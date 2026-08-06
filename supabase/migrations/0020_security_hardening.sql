-- ============================================================
-- 0020_security_hardening.sql — auditoria completa do ERP
-- ============================================================
--
-- Achados via Supabase Advisors + revisão manual (2026-08-06):
--
-- 1. CRÍTICO: create_sale e cancel_sale (RPC, SECURITY DEFINER)
--    eram executáveis pelo papel "anon" — ou seja, qualquer um com
--    a chave anônima pública (embutida no site, não é segredo)
--    podia criar venda falsa ou cancelar venda real via
--    /rest/v1/rpc/create_sale ou /rest/v1/rpc/cancel_sale, SEM
--    LOGIN NENHUM. Confirmado que não havia nem proteção acidental
--    (author_id é nullable nas duas tabelas). Corrigido com
--    checagem explícita de autenticação + revogação de EXECUTE de
--    "anon".
--
-- 2. 4 views (service_orders_with_stale, stock_low_alert,
--    service_order_totals, part_orders_pending_return) rodavam
--    como SECURITY DEFINER (ignoram RLS do usuário que consulta,
--    usam permissão de quem criou a view). Sem efeito prático hoje
--    porque as tabelas de base já liberam SELECT geral pra
--    authenticated, mas é hardening correto — trocado pra
--    SECURITY INVOKER (padrão do Postgres).
--
-- 3. Funções SECURITY DEFINER sensíveis (wipe_stock,
--    reset_stock_quantities, handle_new_user) já tinham proteção
--    interna (is_owner() ou uso exclusivo por trigger), mas também
--    apareciam como executáveis por "anon" — revogado por
--    defesa em profundidade.
--
-- 4. Colunas de FK sem índice (author_id, created_by, requested_by,
--    voided_by) — adicionado índice.
--
-- 5. Tabela service_orders_short_id_backup — resíduo de uma
--    migration antiga (0009/0010), 2 linhas, nunca usada pelo app,
--    RLS sem nenhuma política (fica inacessível mas continua
--    aparecendo no advisor). Removida.
--
-- 6. Políticas RLS chamando auth.uid()/is_owner() sem envolver em
--    (select ...) — reavaliado por LINHA em vez de uma vez só,
--    ruim pra performance em escala (irrelevante no volume de hoje,
--    mas fica pronto pro crescimento). Recriadas com o wrapping
--    recomendado pelo Postgres/Supabase.

-- ── 1. Trava as RPCs financeiras contra chamada sem login ──

CREATE OR REPLACE FUNCTION public.create_sale(
  p_items jsonb,
  p_payment_method text,
  p_customer_name text DEFAULT NULL::text,
  p_customer_phone text DEFAULT NULL::text,
  p_discount numeric DEFAULT 0,
  p_notes text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_sale_id uuid;
  v_sale_number text;
  v_item record;
  v_subtotal numeric := 0;
  v_total numeric;
  v_item_subtotal numeric;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação necessária' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_payment_method NOT IN ('cash', 'pix', 'card', 'transfer', 'other') THEN
    RAISE EXCEPTION 'Forma de pagamento invalida: %', p_payment_method;
  END IF;

  FOR v_item IN
    SELECT
      (item->>'stock_item_id')::uuid AS stock_item_id,
      (item->>'quantity')::int AS quantity,
      (item->>'unit_price')::numeric AS unit_price
    FROM jsonb_array_elements(p_items) AS item
  LOOP
    v_item_subtotal := v_item.quantity * v_item.unit_price;
    v_subtotal := v_subtotal + v_item_subtotal;
  END LOOP;

  v_total := v_subtotal - COALESCE(p_discount, 0);
  IF v_total < 0 THEN
    RAISE EXCEPTION 'Desconto (%) maior que subtotal (%)', p_discount, v_subtotal;
  END IF;

  INSERT INTO public.sales (
    subtotal, discount, total, payment_method,
    customer_name, customer_phone, notes, author_id
  )
  VALUES (
    v_subtotal, COALESCE(p_discount, 0), v_total, p_payment_method,
    NULLIF(trim(p_customer_name), ''), NULLIF(trim(p_customer_phone), ''),
    NULLIF(trim(p_notes), ''), auth.uid()
  )
  RETURNING id, sale_number INTO v_sale_id, v_sale_number;

  FOR v_item IN
    SELECT
      (item->>'stock_item_id')::uuid AS stock_item_id,
      (item->>'quantity')::int AS quantity,
      (item->>'unit_price')::numeric AS unit_price
    FROM jsonb_array_elements(p_items) AS item
  LOOP
    v_item_subtotal := v_item.quantity * v_item.unit_price;

    INSERT INTO public.sale_items (sale_id, stock_item_id, item_name, quantity, unit_price, subtotal)
    SELECT v_sale_id, v_item.stock_item_id, si.name,
           v_item.quantity, v_item.unit_price, v_item_subtotal
    FROM public.stock_items si
    WHERE si.id = v_item.stock_item_id;

    INSERT INTO public.stock_movements (
      stock_item_id, movement_type, quantity, unit_price, total_amount, reference, author_id
    ) VALUES (
      v_item.stock_item_id, 'sale', v_item.quantity, v_item.unit_price, v_item_subtotal,
      v_sale_number, auth.uid()
    );
  END LOOP;

  RETURN v_sale_id;
END;
$function$;

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

REVOKE EXECUTE ON FUNCTION public.create_sale(jsonb, text, text, text, numeric, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cancel_sale(uuid, text) FROM anon;

-- Defesa em profundidade: RPCs sensíveis não precisam ser
-- executáveis por quem não está logado, mesmo já tendo checagem
-- interna (is_owner()) ou sendo pra uso exclusivo de trigger.
REVOKE EXECUTE ON FUNCTION public.wipe_stock() FROM anon;
REVOKE EXECUTE ON FUNCTION public.reset_stock_quantities() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- ── 2. Views: SECURITY INVOKER em vez de DEFINER ──

ALTER VIEW public.service_orders_with_stale SET (security_invoker = true);
ALTER VIEW public.stock_low_alert SET (security_invoker = true);
ALTER VIEW public.service_order_totals SET (security_invoker = true);
ALTER VIEW public.part_orders_pending_return SET (security_invoker = true);

-- ── 3. Índices em FK que faltavam ──

CREATE INDEX IF NOT EXISTS idx_part_order_events_author ON public.part_order_events(author_id);
CREATE INDEX IF NOT EXISTS idx_part_orders_requested_by ON public.part_orders(requested_by);
CREATE INDEX IF NOT EXISTS idx_sales_voided_by ON public.sales(voided_by);
CREATE INDEX IF NOT EXISTS idx_service_orders_created_by ON public.service_orders(created_by);
CREATE INDEX IF NOT EXISTS idx_stock_movements_author ON public.stock_movements(author_id);

-- ── 4. Remove tabela residual de migration antiga ──

DROP TABLE IF EXISTS public.service_orders_short_id_backup;

-- ── 5. RLS: evita reavaliar auth.uid()/is_owner() por linha ──

DROP POLICY IF EXISTS "service_orders_update_owner_or_assigned" ON public.service_orders;
CREATE POLICY "service_orders_update_owner_or_assigned"
  ON public.service_orders FOR UPDATE
  TO authenticated
  USING ((select public.is_owner()) OR (assigned_to = (select auth.uid())))
  WITH CHECK ((select public.is_owner()) OR (assigned_to = (select auth.uid())));

DROP POLICY IF EXISTS "Authenticated can insert stock_movements" ON public.stock_movements;
CREATE POLICY "Authenticated can insert stock_movements"
  ON public.stock_movements FOR INSERT
  TO authenticated
  WITH CHECK (author_id = (select auth.uid()));

DROP POLICY IF EXISTS "Only owners can delete stock_movements" ON public.stock_movements;
CREATE POLICY "Only owners can delete stock_movements"
  ON public.stock_movements FOR DELETE
  TO authenticated
  USING ((select public.is_owner()));

DROP POLICY IF EXISTS "Only owners can delete stock_items" ON public.stock_items;
CREATE POLICY "Only owners can delete stock_items"
  ON public.stock_items FOR DELETE
  TO authenticated
  USING ((select public.is_owner()));

DROP POLICY IF EXISTS "profiles_update_self_full_name" ON public.profiles;
CREATE POLICY "profiles_update_self_full_name"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "service_order_events_insert_owner_or_assigned_or_creator" ON public.service_order_events;
CREATE POLICY "service_order_events_insert_owner_or_assigned_or_creator"
  ON public.service_order_events FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.service_orders so
      WHERE so.id = service_order_events.service_order_id
        AND ((select public.is_owner()) OR so.assigned_to = (select auth.uid()) OR so.created_by = (select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Authenticated can insert sales" ON public.sales;
CREATE POLICY "Authenticated can insert sales"
  ON public.sales FOR INSERT
  TO authenticated
  WITH CHECK (author_id = (select auth.uid()));

DROP POLICY IF EXISTS "Only owners can delete sales" ON public.sales;
CREATE POLICY "Only owners can delete sales"
  ON public.sales FOR DELETE
  TO authenticated
  USING ((select public.is_owner()));

DROP POLICY IF EXISTS "Only owners can delete sale_items" ON public.sale_items;
CREATE POLICY "Only owners can delete sale_items"
  ON public.sale_items FOR DELETE
  TO authenticated
  USING ((select public.is_owner()));

DROP POLICY IF EXISTS "Authenticated users can create part orders" ON public.part_orders;
CREATE POLICY "Authenticated users can create part orders"
  ON public.part_orders FOR INSERT
  TO authenticated
  WITH CHECK (requested_by = (select auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can create part order events" ON public.part_order_events;
CREATE POLICY "Authenticated users can create part order events"
  ON public.part_order_events FOR INSERT
  TO authenticated
  WITH CHECK (author_id = (select auth.uid()));

NOTIFY pgrst, 'reload schema';
