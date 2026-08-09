-- ============================================================
-- 0030_payment_status_trigger.sql
-- ============================================================
--
-- payment_status (pending/partial/paid) era escrito manualmente pelo
-- NAVEGADOR toda vez que um pagamento era registrado ou apagado,
-- usando o total (mão de obra + peças) daquele momento de carregamento
-- da página. Problema: o total pode mudar DEPOIS de um pagamento já
-- registrado — ex.: OS já estava "Pago" e o técnico usa mais uma peça
-- (labor_cost ou stock_movements mudam), mas nada recalculava
-- payment_status. Ficava "Pago" mesmo devendo dinheiro, sumindo do
-- painel "hoje" e do card de "não pago" — o mesmo tipo de furo que
-- motivou o pagamento parcial existir.
--
-- Corrige tirando esse cálculo do client e colocando 100% no banco:
-- uma função recompute_os_payment_status(os_id) que sempre recalcula
-- do zero (soma de service_order_payments vs labor_cost + soma de
-- stock_movements ligados à OS), chamada automaticamente por trigger
-- sempre que qualquer uma dessas três fontes mudar. Única fonte de
-- verdade; o frontend não escreve mais em payment_status.

CREATE OR REPLACE FUNCTION public.recompute_os_payment_status(p_os_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_labor_cost  numeric;
  v_parts_total numeric;
  v_grand_total numeric;
  v_total_paid  numeric;
  v_new_status  text;
BEGIN
  SELECT labor_cost INTO v_labor_cost
    FROM public.service_orders
    WHERE id = p_os_id;

  -- OS pode não existir mais (chamado a partir de um DELETE em
  -- cascata de service_order_payments/stock_movements quando a OS é
  -- apagada) — nesse caso não há o que recalcular.
  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT COALESCE(SUM(total_amount), 0) INTO v_parts_total
    FROM public.stock_movements
    WHERE service_order_id = p_os_id
      AND movement_type IN ('out', 'sale');

  v_grand_total := COALESCE(v_labor_cost, 0) + v_parts_total;

  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM public.service_order_payments
    WHERE service_order_id = p_os_id;

  -- Mesma regra que já existia no client (PaymentStatusEditor), só que
  -- agora roda toda vez que qualquer entrada muda, não só quando um
  -- pagamento é registrado/apagado.
  v_new_status := CASE
    WHEN v_total_paid <= 0 THEN 'pending'
    WHEN v_total_paid >= v_grand_total AND v_grand_total > 0 THEN 'paid'
    ELSE 'partial'
  END;

  UPDATE public.service_orders
    SET payment_status = v_new_status
    WHERE id = p_os_id
      AND payment_status IS DISTINCT FROM v_new_status;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.recompute_os_payment_status(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recompute_os_payment_status(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.recompute_os_payment_status(uuid) TO authenticated;

-- SECURITY DEFINER de propósito: quem registra o pagamento (INSERT em
-- service_order_payments) não precisa necessariamente ter permissão
-- de UPDATE na OS (a policy de update de service_orders é
-- owner-ou-técnico-atribuído) — o recálculo de payment_status é um
-- efeito automático do sistema, não uma edição feita pelo usuário, e
-- não deve depender de quem disparou o evento.

-- 1. Gatilho: pagamento registrado ou apagado -------------------------
CREATE OR REPLACE FUNCTION public.trg_recompute_payment_status_from_payments()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_os_payment_status(OLD.service_order_id);
    RETURN OLD;
  ELSE
    PERFORM public.recompute_os_payment_status(NEW.service_order_id);
    RETURN NEW;
  END IF;
END;
$function$;

DROP TRIGGER IF EXISTS trg_service_order_payments_recompute ON public.service_order_payments;
CREATE TRIGGER trg_service_order_payments_recompute
  AFTER INSERT OR DELETE ON public.service_order_payments
  FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_payment_status_from_payments();

-- 2. Gatilho: peça usada/removida na OS (stock_movements out/sale) ----
CREATE OR REPLACE FUNCTION public.trg_recompute_payment_status_from_movements()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.service_order_id IS NOT NULL AND OLD.movement_type IN ('out', 'sale') THEN
      PERFORM public.recompute_os_payment_status(OLD.service_order_id);
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.service_order_id IS NOT NULL AND NEW.movement_type IN ('out', 'sale') THEN
    PERFORM public.recompute_os_payment_status(NEW.service_order_id);
  END IF;

  -- UPDATE que troca a OS vinculada (raro) -- recalcula a OS antiga tambem
  IF TG_OP = 'UPDATE'
     AND OLD.service_order_id IS DISTINCT FROM NEW.service_order_id
     AND OLD.service_order_id IS NOT NULL
     AND OLD.movement_type IN ('out', 'sale') THEN
    PERFORM public.recompute_os_payment_status(OLD.service_order_id);
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_stock_movements_recompute ON public.stock_movements;
CREATE TRIGGER trg_stock_movements_recompute
  AFTER INSERT OR UPDATE OR DELETE ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_payment_status_from_movements();

-- 3. Gatilho: mão de obra editada na própria OS ------------------------
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

-- Roda só quando labor_cost realmente muda -- o UPDATE que o próprio
-- recompute faz (só em payment_status) não altera labor_cost, então
-- a condição WHEN abaixo evita loop infinito.
DROP TRIGGER IF EXISTS trg_service_orders_labor_cost_recompute ON public.service_orders;
CREATE TRIGGER trg_service_orders_labor_cost_recompute
  AFTER UPDATE OF labor_cost ON public.service_orders
  FOR EACH ROW
  WHEN (OLD.labor_cost IS DISTINCT FROM NEW.labor_cost)
  EXECUTE FUNCTION public.trg_recompute_payment_status_from_os();

-- 4. Corrige o que já estiver desatualizado hoje -----------------------
-- (qualquer OS que já teve pagamento registrado em algum momento pode
-- estar com payment_status desatualizado por causa do bug acima)
DO $$
DECLARE
  v_os_id uuid;
BEGIN
  FOR v_os_id IN
    SELECT DISTINCT service_order_id FROM public.service_order_payments
  LOOP
    PERFORM public.recompute_os_payment_status(v_os_id);
  END LOOP;
END;
$$;

NOTIFY pgrst, 'reload schema';
