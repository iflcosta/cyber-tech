-- =============================================================================
-- 0047_critical_p0_fixes.sql
-- SPRINT 1 (P0): Estabilidade de Banco, Recálculo de Comissões, Sincronização
-- Automática de Caixa (PDV & OS) e Blindagem de Permissões Críticas
-- =============================================================================

-- 1. CORREÇÃO DA FUNÇÃO recompute_os_commission
-- Declaração das variáveis v_current_labor, v_sum_labor e v_parts_total
-- Preservação do valor de peças no estimated_value
CREATE OR REPLACE FUNCTION public.recompute_os_commission(p_os_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_has_services    boolean;
  v_os_pay_status   text;
  v_os_status       text;
  v_rec             record;
  v_legacy_tech_id  uuid;
  v_legacy_rate     numeric(4,2);
  v_legacy_name     text;
  v_current_labor   numeric(10,2);
  v_sum_labor       numeric(10,2);
  v_parts_total     numeric(10,2);
BEGIN
  -- 1.1 Busca status atual da OS
  SELECT payment_status, status, technician_id, labor_cost
  INTO v_os_pay_status, v_os_status, v_legacy_tech_id, v_current_labor
  FROM public.service_orders
  WHERE id = p_os_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- 1.2 Verifica se a OS possui procedimentos em service_order_services
  SELECT EXISTS (
    SELECT 1 FROM public.service_order_services 
    WHERE service_order_id = p_os_id AND status <> 'cancelled'
  ) INTO v_has_services;

  IF v_has_services THEN
    -- MODO 1: Mão de obra discriminada por serviços/técnicos
    -- Calcula a soma dos procedimentos
    SELECT COALESCE(SUM(labor_cost), 0.00) INTO v_sum_labor
    FROM public.service_order_services
    WHERE service_order_id = p_os_id AND status <> 'cancelled';

    -- Calcula o total de peças utilizadas na OS para não zerar estimated_value
    SELECT COALESCE(SUM(total_amount), 0.00) INTO v_parts_total
    FROM public.stock_movements
    WHERE service_order_id = p_os_id AND movement_type IN ('out', 'sale');

    -- Atualiza service_orders.labor_cost e estimated_value SOMENTE se houver alteração
    IF v_current_labor IS DISTINCT FROM v_sum_labor THEN
      UPDATE public.service_orders
      SET labor_cost = v_sum_labor,
          estimated_value = v_sum_labor + v_parts_total
      WHERE id = p_os_id;
    END IF;

    -- Remove lançamentos pendentes que não pertencem mais aos serviços ativos
    DELETE FROM public.commission_ledger cl
    WHERE cl.service_order_id = p_os_id
      AND cl.status = 'pending'
      AND (
        cl.service_order_service_id IS NULL OR
        cl.service_order_service_id NOT IN (
          SELECT id FROM public.service_order_services
          WHERE service_order_id = p_os_id AND status <> 'cancelled'
        )
      );

    -- Itera sobre cada procedimento cadastrado
    FOR v_rec IN (
      SELECT 
        sos.id AS service_item_id,
        sos.service_name,
        sos.labor_cost,
        sos.technician_id,
        p.full_name AS tech_name,
        COALESCE(p.commission_rate, 0.00) AS comm_rate
      FROM public.service_order_services sos
      LEFT JOIN public.profiles p ON p.id = sos.technician_id
      WHERE sos.service_order_id = p_os_id
        AND sos.status <> 'cancelled'
    ) LOOP
      IF v_rec.technician_id IS NOT NULL AND v_rec.comm_rate > 0.00 THEN
        INSERT INTO public.commission_ledger (
          service_order_id,
          service_order_service_id,
          service_description,
          technician_id,
          technician_name,
          labor_amount,
          commission_rate,
          commission_amount,
          os_payment_status,
          updated_at
        ) VALUES (
          p_os_id,
          v_rec.service_item_id,
          v_rec.service_name,
          v_rec.technician_id,
          COALESCE(v_rec.tech_name, 'Técnico'),
          v_rec.labor_cost,
          v_rec.comm_rate,
          ROUND(v_rec.labor_cost * v_rec.comm_rate, 2),
          COALESCE(v_os_pay_status, 'pending'),
          now()
        )
        ON CONFLICT (service_order_id, technician_id, COALESCE(service_order_service_id, '00000000-0000-0000-0000-000000000000'::uuid))
        DO UPDATE SET
          service_description = EXCLUDED.service_description,
          labor_amount = EXCLUDED.labor_amount,
          commission_rate = EXCLUDED.commission_rate,
          commission_amount = EXCLUDED.commission_amount,
          os_payment_status = EXCLUDED.os_payment_status,
          technician_name = EXCLUDED.technician_name,
          updated_at = now()
        WHERE public.commission_ledger.status = 'pending';
      END IF;
    END LOOP;

  ELSE
    -- MODO 2: Legado (sem itens em service_order_services)
    SELECT p.full_name, COALESCE(p.commission_rate, 0.00)
    INTO v_legacy_name, v_legacy_rate
    FROM public.profiles p
    WHERE p.id = v_legacy_tech_id;

    IF v_legacy_tech_id IS NULL OR v_legacy_rate <= 0.00 THEN
      DELETE FROM public.commission_ledger
      WHERE service_order_id = p_os_id AND status = 'pending';
      RETURN;
    END IF;

    INSERT INTO public.commission_ledger (
      service_order_id,
      technician_id,
      technician_name,
      labor_amount,
      commission_rate,
      commission_amount,
      os_payment_status,
      updated_at
    ) VALUES (
      p_os_id,
      v_legacy_tech_id,
      COALESCE(v_legacy_name, 'Técnico'),
      COALESCE(v_current_labor, 0.00),
      v_legacy_rate,
      ROUND(COALESCE(v_current_labor, 0.00) * v_legacy_rate, 2),
      COALESCE(v_os_pay_status, 'pending'),
      now()
    )
    ON CONFLICT (service_order_id, technician_id, COALESCE(service_order_service_id, '00000000-0000-0000-0000-000000000000'::uuid))
    DO UPDATE SET
      labor_amount = EXCLUDED.labor_amount,
      commission_rate = EXCLUDED.commission_rate,
      commission_amount = EXCLUDED.commission_amount,
      os_payment_status = EXCLUDED.os_payment_status,
      technician_name = EXCLUDED.technician_name,
      updated_at = now()
    WHERE public.commission_ledger.status = 'pending';
  END IF;

END;
$function$;

-- 2. INTEGRAÇÃO AUTOMÁTICA DE CAIXA: VENDAS EM DINHEIRO (PDV) E RECEBIMENTOS DE OS
-- 2.1 Adiciona FK cascade para service_order_payments em cash_entries
ALTER TABLE public.cash_entries
  ADD COLUMN IF NOT EXISTS service_order_payment_id uuid REFERENCES public.service_order_payments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_cash_entries_os_payment ON public.cash_entries(service_order_payment_id);

-- 2.2 Trigger para alimentar o Caixa quando uma Venda em Dinheiro (cash) for realizada no PDV
CREATE OR REPLACE FUNCTION public.trg_sales_cash_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_session_id uuid;
  v_author_id uuid;
BEGIN
  IF NEW.payment_method = 'cash' AND NEW.total > 0 AND NEW.voided_at IS NULL THEN
    SELECT id INTO v_session_id
    FROM public.cash_sessions
    WHERE status = 'open'
    ORDER BY opened_at DESC
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
      v_author_id := COALESCE(NEW.operator_id, NEW.author_id, auth.uid());
      IF v_author_id IS NULL THEN
        SELECT id INTO v_author_id FROM public.profiles WHERE role = 'owner' LIMIT 1;
      END IF;

      INSERT INTO public.cash_entries (
        session_id,
        entry_type,
        amount,
        description,
        author_id,
        related_sale_id
      ) VALUES (
        v_session_id,
        'in_sale',
        NEW.total,
        'Venda PDV #' || COALESCE(NEW.sale_number::text, ''),
        v_author_id,
        NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_sales_cash_sync_insert ON public.sales;
CREATE TRIGGER trg_sales_cash_sync_insert
  AFTER INSERT ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.trg_sales_cash_sync();

-- 2.3 Atualiza cancel_sale para expurgar a entrada de caixa da venda estornada
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

  -- Exclui lançamento de caixa da venda cancelada se houver (recalculando o caixa cego)
  DELETE FROM public.cash_entries
  WHERE related_sale_id = p_sale_id;

  -- Devolve peças ao estoque
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

-- 2.4 Trigger para alimentar o Caixa quando um pagamento de OS em Dinheiro (cash) for registrado
CREATE OR REPLACE FUNCTION public.trg_os_payments_cash_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_session_id uuid;
  v_os_num text;
  v_author_id uuid;
BEGIN
  IF NEW.payment_method = 'cash' AND NEW.amount > 0 THEN
    SELECT id INTO v_session_id
    FROM public.cash_sessions
    WHERE status = 'open'
    ORDER BY opened_at DESC
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
      SELECT os_number::text INTO v_os_num
      FROM public.service_orders
      WHERE id = NEW.service_order_id;

      v_author_id := COALESCE(NEW.author_id, auth.uid());
      IF v_author_id IS NULL THEN
        SELECT id INTO v_author_id FROM public.profiles WHERE role = 'owner' LIMIT 1;
      END IF;

      INSERT INTO public.cash_entries (
        session_id,
        entry_type,
        amount,
        description,
        author_id,
        related_service_order_id,
        service_order_payment_id
      ) VALUES (
        v_session_id,
        'in_os',
        NEW.amount,
        'Recebimento OS #' || COALESCE(v_os_num, ''),
        v_author_id,
        NEW.service_order_id,
        NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_os_payments_cash_sync_insert ON public.service_order_payments;
CREATE TRIGGER trg_os_payments_cash_sync_insert
  AFTER INSERT ON public.service_order_payments
  FOR EACH ROW EXECUTE FUNCTION public.trg_os_payments_cash_sync();

-- 3. REVOGAÇÃO DE PERMISSÕES ANÔNIMAS E BLINDAGEM DE WIPE_STOCK
REVOKE ALL ON public.cash_sessions, public.cash_entries, public.used_device_purchases, public.service_order_services, public.settlement_batches FROM anon, public;
GRANT ALL ON public.cash_sessions, public.cash_entries, public.used_device_purchases, public.service_order_services, public.settlement_batches TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.wipe_stock() FROM anon, authenticated, public;

NOTIFY pgrst, 'reload schema';
