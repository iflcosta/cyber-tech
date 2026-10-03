-- ============================================================
-- 0042_security_hardening_views_and_permissions.sql
-- ============================================================
--
-- 1. Restaura security_invoker = true na view service_orders_with_stale
--    (que foi recriada na migration 0034 sem a flag, reabrindo
--    possibilidade de bypass de RLS por anon).
-- 2. Revoga acesso anon nas views administrativas internas.
-- 3. Restringe cancel_sale para usuários autenticados com is_owner() ou can_delete().
-- 4. Notifica o PostgREST para recarregar o schema cache.

-- 1 & 2. Blindagem da view service_orders_with_stale
ALTER VIEW public.service_orders_with_stale SET (security_invoker = true);
REVOKE ALL ON public.service_orders_with_stale FROM PUBLIC;
REVOKE ALL ON public.service_orders_with_stale FROM anon;
GRANT SELECT ON public.service_orders_with_stale TO authenticated, service_role;

-- Blindagem adicional de views operacionais
ALTER VIEW public.stock_low_alert SET (security_invoker = true);
REVOKE ALL ON public.stock_low_alert FROM PUBLIC;
REVOKE ALL ON public.stock_low_alert FROM anon;
GRANT SELECT ON public.stock_low_alert TO authenticated, service_role;

ALTER VIEW public.part_orders_pending_return SET (security_invoker = true);
REVOKE ALL ON public.part_orders_pending_return FROM PUBLIC;
REVOKE ALL ON public.part_orders_pending_return FROM anon;
GRANT SELECT ON public.part_orders_pending_return TO authenticated, service_role;

-- 3. Atualização segura da função cancel_sale com verificação de privilégios
CREATE OR REPLACE FUNCTION public.cancel_sale(p_sale_id uuid, p_reason text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_sale_number text;
  v_already_voided timestamptz;
  v_item record;
  v_reason text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação necessária' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NOT (public.is_owner() OR public.can_delete()) THEN
    RAISE EXCEPTION 'Apenas administradores ou operadores autorizados podem cancelar vendas' USING ERRCODE = 'insufficient_privilege';
  END IF;

  v_reason := NULLIF(trim(p_reason), '');
  IF v_reason IS NULL THEN
    RAISE EXCEPTION 'Motivo do cancelamento eh obrigatorio';
  END IF;

  SELECT sale_number, voided_at INTO v_sale_number, v_already_voided
  FROM public.sales
  WHERE id = p_sale_id;

  IF v_sale_number IS NULL THEN
    RAISE EXCEPTION 'Venda % nao encontrada', p_sale_id;
  END IF;

  IF v_already_voided IS NOT NULL THEN
    RAISE EXCEPTION 'Venda % ja foi cancelada em %', v_sale_number, v_already_voided;
  END IF;

  UPDATE public.sales
  SET
    voided_at = now(),
    voided_by = auth.uid(),
    voided_reason = v_reason
  WHERE id = p_sale_id;

  FOR v_item IN
    SELECT stock_item_id, quantity
    FROM public.sale_items
    WHERE sale_id = p_sale_id
  LOOP
    INSERT INTO public.stock_movements (
      stock_item_id, movement_type, quantity, unit_price, total_amount, reference, notes, author_id
    ) VALUES (
      v_item.stock_item_id, 'in', v_item.quantity, NULL, NULL,
      v_sale_number || ' (CANCELADA)',
      'Estorno automatico por cancelamento da venda ' || v_sale_number,
      auth.uid()
    );
  END LOOP;

  RETURN p_sale_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.cancel_sale(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cancel_sale(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.cancel_sale(uuid, text) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
