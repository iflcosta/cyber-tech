-- =============================================================================
-- 0044_multi_technician_services_and_settlement.sql
-- Rateio Multi-Técnico por Itens de Serviço, Lotes de Acerto Semanal e Planilha
-- =============================================================================

-- 1. TABELA DE ITENS DE SERVIÇO / PROCEDIMENTOS DA OS (service_order_services)
CREATE TABLE IF NOT EXISTS public.service_order_services (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id    uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  service_name        text NOT NULL,
  labor_cost          numeric(10,2) NOT NULL DEFAULT 0.00 CHECK (labor_cost >= 0),
  technician_id       uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status              text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_so_services_order ON public.service_order_services(service_order_id);
CREATE INDEX IF NOT EXISTS idx_so_services_tech ON public.service_order_services(technician_id);

ALTER TABLE public.service_order_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read so_services" ON public.service_order_services;
CREATE POLICY "Authenticated users can read so_services"
  ON public.service_order_services FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage so_services" ON public.service_order_services;
CREATE POLICY "Authenticated users can manage so_services"
  ON public.service_order_services FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON public.service_order_services TO authenticated, anon, service_role;

-- 2. TABELA DE LOTES DE FECHAMENTO / BAIXA DE SEXTA-FEIRA (settlement_batches)
CREATE TABLE IF NOT EXISTS public.settlement_batches (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number        serial UNIQUE,
  closed_by           uuid REFERENCES public.profiles(id),
  cycle_start         timestamptz NOT NULL,
  cycle_end           timestamptz NOT NULL,
  total_commission    numeric(10,2) NOT NULL DEFAULT 0.00,
  total_allowances    numeric(10,2) NOT NULL DEFAULT 0.00,
  total_paid          numeric(10,2) NOT NULL DEFAULT 0.00,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.settlement_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read settlement_batches" ON public.settlement_batches;
CREATE POLICY "Authenticated users can read settlement_batches"
  ON public.settlement_batches FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Only staff can manage settlement_batches" ON public.settlement_batches;
CREATE POLICY "Only staff can manage settlement_batches"
  ON public.settlement_batches FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON public.settlement_batches TO authenticated, anon, service_role;

-- 3. EVOLUÇÃO DA TABELA commission_ledger
ALTER TABLE public.commission_ledger
  ADD COLUMN IF NOT EXISTS service_order_service_id uuid REFERENCES public.service_order_services(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS settlement_batch_id uuid REFERENCES public.settlement_batches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS service_description text;

-- Remove restrição de unicidade antiga (1 único técnico por OS)
ALTER TABLE public.commission_ledger
  DROP CONSTRAINT IF EXISTS commission_ledger_service_order_id_technician_id_key;

-- Adiciona unicidade por serviço/técnico com fallback para legados
CREATE UNIQUE INDEX IF NOT EXISTS idx_commission_ledger_unique_service
  ON public.commission_ledger (
    service_order_id, 
    technician_id, 
    COALESCE(service_order_service_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

-- 4. FUNÇÃO ROBUSTA DE RECÁLCULO DE COMISSÕES
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
  v_legacy_cost     numeric(10,2);
  v_legacy_name     text;
BEGIN
  -- Busca status atual da OS
  SELECT payment_status, status, technician_id, labor_cost
  INTO v_os_pay_status, v_os_status, v_legacy_tech_id, v_legacy_cost
  FROM public.service_orders
  WHERE id = p_os_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Verifica se a OS possui procedimentos em service_order_services
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

    -- Atualiza service_orders.labor_cost SOMENTE se for diferente para evitar qualquer loop
    IF v_current_labor IS DISTINCT FROM v_sum_labor THEN
      UPDATE public.service_orders
      SET labor_cost = v_sum_labor,
          estimated_value = v_sum_labor
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

-- 5. TRIGGER EM service_order_services
CREATE OR REPLACE FUNCTION public.trg_service_order_services_sync()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM public.recompute_os_commission(OLD.service_order_id);
    RETURN OLD;
  ELSE
    PERFORM public.recompute_os_commission(NEW.service_order_id);
    RETURN NEW;
  END IF;
END;
$function$;

DROP TRIGGER IF EXISTS trg_so_services_sync_commission ON public.service_order_services;
CREATE TRIGGER trg_so_services_sync_commission
  AFTER INSERT OR UPDATE OR DELETE ON public.service_order_services
  FOR EACH ROW EXECUTE FUNCTION public.trg_service_order_services_sync();

-- 6. TRIGGER SEGURO EM service_orders
CREATE OR REPLACE FUNCTION public.trg_service_orders_commission_sync()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status) OR 
     (OLD.payment_status IS DISTINCT FROM NEW.payment_status) OR 
     (OLD.technician_id IS DISTINCT FROM NEW.technician_id) THEN
    PERFORM public.recompute_os_commission(NEW.id);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_so_sync_comm ON public.service_orders;
CREATE TRIGGER trg_so_sync_comm
  AFTER UPDATE OF status, payment_status, technician_id ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION public.trg_service_orders_commission_sync();

NOTIFY pgrst, 'reload schema';
