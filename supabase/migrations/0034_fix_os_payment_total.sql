-- ============================================================
-- 0034_fix_os_payment_total.sql
-- ============================================================
--
-- Corrige o cálculo do total da OS para recálculo do payment_status:
-- Quando a OS é criada com "Valor orçado" (estimated_value) mas
-- sem preenchimento do campo avulso de "mão de obra" em diagnóstico,
-- o total da OS ficava 0, impedindo o status de virar "paid" e
-- fazendo com que a OS permanecesse como "pending".
--
-- Agora:
-- 1. Se labor_cost + peças > 0, usa essa soma.
-- 2. Se labor_cost + peças = 0 mas estimated_value > 0, usa estimated_value.
-- 3. Atualiza payment_method e paid_at na OS quando o pagamento for registrado.
-- 4. Gatilho dispara também quando estimated_value for alterado.

CREATE OR REPLACE FUNCTION public.recompute_os_payment_status(p_os_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_labor_cost     numeric;
  v_estimated_val  numeric;
  v_parts_total    numeric;
  v_grand_total    numeric;
  v_total_paid     numeric;
  v_new_status     text;
  v_last_method    text;
  v_last_paid_at   timestamptz;
BEGIN
  SELECT labor_cost, estimated_value INTO v_labor_cost, v_estimated_val
    FROM public.service_orders
    WHERE id = p_os_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT COALESCE(SUM(total_amount), 0) INTO v_parts_total
    FROM public.stock_movements
    WHERE service_order_id = p_os_id
      AND movement_type IN ('out', 'sale');

  IF (COALESCE(v_labor_cost, 0) + v_parts_total) > 0 THEN
    v_grand_total := COALESCE(v_labor_cost, 0) + v_parts_total;
  ELSIF COALESCE(v_estimated_val, 0) > 0 THEN
    v_grand_total := v_estimated_val;
  ELSE
    v_grand_total := 0;
  END IF;

  SELECT COALESCE(SUM(amount), 0),
         MAX(paid_at)
    INTO v_total_paid, v_last_paid_at
    FROM public.service_order_payments
    WHERE service_order_id = p_os_id;

  v_new_status := CASE
    WHEN v_total_paid <= 0 THEN 'pending'
    WHEN v_grand_total > 0 AND v_total_paid >= v_grand_total THEN 'paid'
    WHEN v_grand_total = 0 AND v_total_paid > 0 THEN 'paid'
    ELSE 'partial'
  END;

  IF v_new_status IN ('paid', 'partial') THEN
    SELECT payment_method INTO v_last_method
      FROM public.service_order_payments
      WHERE service_order_id = p_os_id
      ORDER BY paid_at DESC
      LIMIT 1;
  ELSE
    v_last_method := null;
    v_last_paid_at := null;
  END IF;

  UPDATE public.service_orders
    SET payment_status = v_new_status,
        payment_method = v_last_method,
        paid_at = v_last_paid_at
    WHERE id = p_os_id
      AND (
        payment_status IS DISTINCT FROM v_new_status
        OR payment_method IS DISTINCT FROM v_last_method
        OR paid_at IS DISTINCT FROM v_last_paid_at
      );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.recompute_os_payment_status(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recompute_os_payment_status(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.recompute_os_payment_status(uuid) TO authenticated;

-- Gatilho atualizado para disparar tanto com labor_cost quanto estimated_value
DROP TRIGGER IF EXISTS trg_service_orders_labor_cost_recompute ON public.service_orders;
DROP TRIGGER IF EXISTS trg_service_orders_cost_recompute ON public.service_orders;

CREATE OR REPLACE FUNCTION public.trg_recompute_payment_status_from_os()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.recompute_os_payment_status(NEW.id);
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_service_orders_cost_recompute
  AFTER UPDATE OF labor_cost, estimated_value ON public.service_orders
  FOR EACH ROW
  WHEN (
    OLD.labor_cost IS DISTINCT FROM NEW.labor_cost
    OR OLD.estimated_value IS DISTINCT FROM NEW.estimated_value
  )
  EXECUTE FUNCTION public.trg_recompute_payment_status_from_os();

-- Recomputa para todas as ordens de serviço existentes
DO $$
DECLARE
  v_os_id uuid;
BEGIN
  FOR v_os_id IN
    SELECT id FROM public.service_orders
  LOOP
    PERFORM public.recompute_os_payment_status(v_os_id);
  END LOOP;
END;
$$;

NOTIFY pgrst, 'reload schema';
