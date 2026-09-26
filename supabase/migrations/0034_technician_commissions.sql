-- ============================================================
-- 0034_technician_commissions.sql — Comissões Diferenciadas por Técnico
-- ============================================================
--
-- REGRAS DE NEGÓCIO V2:
-- 1. IAGO: Recebe 30% de comissão sobre a mão de obra líquida (labor_cost)
--    das ordens de serviço executadas por ele.
-- 2. JEFFERSON (Técnico de celular, placa de vídeo e telas OCA): Opera no
--    modelo 50/50 com o Felipe (50% mão de obra líquida para o Jefferson,
--    50% para a loja).
-- 3. FELIPE (Dono) / LOJA: 100% da mão de obra fica na loja (0% comissão externa).
--
-- PRESERVAÇÃO DE DADOS:
-- Esta migration é 100% ADITIVA. Nenhuma tabela é dropada ou resetada.
-- Todos os dados de estoque (stock_items cadastrados pelo estagiário Eduardo)
-- e histórico de clientes/OS permanecem intactos.
-- ============================================================

-- 1. Adiciona coluna commission_rate em profiles (taxa de comissão padrão do técnico)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS commission_rate numeric(4,2) NOT NULL DEFAULT 0.00;

COMMENT ON COLUMN public.profiles.commission_rate IS
  'Taxa de comissão do técnico sobre a mão de obra líquida (ex: 0.30 para Iago, 0.50 para Jefferson, 0.00 para Felipe/Loja)';

-- Atualiza as taxas conhecidas se os perfis existirem por email/nome
UPDATE public.profiles
  SET commission_rate = 0.30
  WHERE lower(full_name) LIKE '%iago%' OR lower(email) LIKE '%iago%';

UPDATE public.profiles
  SET commission_rate = 0.50
  WHERE lower(full_name) LIKE '%jefferson%' OR lower(email) LIKE '%jefferson%';

-- 2. Adiciona technician_id em service_orders para saber quem executou o serviço
ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS technician_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.service_orders.technician_id IS
  'Técnico responsável pela execução da OS (define a regra de comissão aplicável)';

-- 3. Tabela de Livro-Razão de Comissões (commission_ledger)
CREATE TABLE IF NOT EXISTS public.commission_ledger (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_order_id    uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  technician_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  technician_name     text NOT NULL,
  labor_amount        numeric(10,2) NOT NULL DEFAULT 0.00,
  commission_rate     numeric(4,2) NOT NULL DEFAULT 0.00,
  commission_amount   numeric(10,2) NOT NULL DEFAULT 0.00,
  os_payment_status   text NOT NULL DEFAULT 'pending',
  status              text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid_out')),
  payout_date         timestamptz,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (service_order_id, technician_id)
);

ALTER TABLE public.commission_ledger ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para commission_ledger
CREATE POLICY commission_ledger_select_staff ON public.commission_ledger
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY commission_ledger_all_owner ON public.commission_ledger
  FOR ALL
  TO authenticated
  USING ((SELECT public.is_owner()))
  WITH CHECK ((SELECT public.is_owner()));

GRANT ALL ON public.commission_ledger TO anon, authenticated, service_role;

-- 4. Função para recalcular a comissão da OS automaticamente
CREATE OR REPLACE FUNCTION public.recompute_os_commission(p_os_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_technician_id   uuid;
  v_tech_name       text;
  v_tech_rate       numeric(4,2);
  v_labor_cost      numeric(10,2);
  v_payment_status  text;
  v_os_status       text;
  v_comm_amount     numeric(10,2);
BEGIN
  -- Busca dados da OS e do técnico
  SELECT 
    so.technician_id,
    p.full_name,
    COALESCE(p.commission_rate, 0.00),
    COALESCE(so.labor_cost, 0.00),
    so.payment_status,
    so.status
  INTO 
    v_technician_id,
    v_tech_name,
    v_tech_rate,
    v_labor_cost,
    v_payment_status,
    v_os_status
  FROM public.service_orders so
  LEFT JOIN public.profiles p ON p.id = so.technician_id
  WHERE so.id = p_os_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Se não há técnico atribuído ou a taxa de comissão é zero, remove registro pendente se houver
  IF v_technician_id IS NULL OR v_tech_rate <= 0.00 THEN
    DELETE FROM public.commission_ledger
      WHERE service_order_id = p_os_id
        AND status = 'pending';
    RETURN;
  END IF;

  -- Calcula o valor de comissão sobre a mão de obra
  v_comm_amount := ROUND((v_labor_cost * v_tech_rate), 2);

  -- Upsert no commission_ledger
  INSERT INTO public.commission_ledger (
    service_order_id,
    technician_id,
    technician_name,
    labor_amount,
    commission_rate,
    commission_amount,
    os_payment_status,
    updated_at
  )
  VALUES (
    p_os_id,
    v_technician_id,
    COALESCE(v_tech_name, 'Técnico'),
    v_labor_cost,
    v_tech_rate,
    v_comm_amount,
    COALESCE(v_payment_status, 'pending'),
    now()
  )
  ON CONFLICT (service_order_id, technician_id)
  DO UPDATE SET
    labor_amount = EXCLUDED.labor_amount,
    commission_rate = EXCLUDED.commission_rate,
    commission_amount = EXCLUDED.commission_amount,
    os_payment_status = EXCLUDED.os_payment_status,
    technician_name = EXCLUDED.technician_name,
    updated_at = now()
  WHERE public.commission_ledger.status = 'pending'; -- Não altera se já foi dado baixa/pago no acerto

END;
$function$;

REVOKE EXECUTE ON FUNCTION public.recompute_os_commission(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recompute_os_commission(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.recompute_os_commission(uuid) TO authenticated, service_role;

-- 5. Trigger em service_orders para recalcular comissão ao mudar técnico, mão de obra ou pagamento
CREATE OR REPLACE FUNCTION public.trg_service_orders_commission()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    IF (NEW.technician_id IS DISTINCT FROM OLD.technician_id) OR
       (NEW.labor_cost IS DISTINCT FROM OLD.labor_cost) OR
       (NEW.payment_status IS DISTINCT FROM OLD.payment_status) OR
       (NEW.status IS DISTINCT FROM OLD.status) THEN
      PERFORM public.recompute_os_commission(NEW.id);
    END IF;
  ELSIF (TG_OP = 'INSERT') THEN
    IF NEW.technician_id IS NOT NULL THEN
      PERFORM public.recompute_os_commission(NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_service_orders_recompute_commission ON public.service_orders;
CREATE TRIGGER trg_service_orders_recompute_commission
  AFTER INSERT OR UPDATE ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION public.trg_service_orders_commission();

-- 6. Atualização da view service_orders_with_stale para incluir dados do técnico
DROP VIEW IF EXISTS public.service_orders_with_stale;

CREATE VIEW public.service_orders_with_stale AS
SELECT
  so.id,
  so.os_number,
  so.short_id,
  so.customer_id,
  so.equipment_type,
  so.equipment_brand,
  so.equipment_model,
  so.equipment_color,
  so.equipment_serial,
  so.equipment_password,
  so.reported_defect,
  so.entry_checklist,
  so.accessories_in,
  so.status,
  so.blocking_reason,
  so.estimated_value,
  so.labor_cost,
  so.estimated_ready_at,
  so.technician_id,
  p.full_name AS technician_name,
  p.commission_rate AS technician_commission_rate,
  so.created_by,
  so.created_at,
  so.updated_at,
  so.delivered_at,
  c.name AS customer_name,
  c.phone AS customer_phone,
  (EXTRACT(day FROM (now() - so.updated_at)))::integer AS days_since_update
FROM public.service_orders so
JOIN public.customers c ON (c.id = so.customer_id)
LEFT JOIN public.profiles p ON (p.id = so.technician_id)
WHERE so.status <> ALL (ARRAY['delivered'::text, 'cancelled'::text]);

GRANT ALL ON public.service_orders_with_stale TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
