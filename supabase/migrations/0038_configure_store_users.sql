-- ============================================================
-- 0038_configure_store_users.sql — Setup Completo de Usuários e Comissões
-- ============================================================

-- 1. Garante que as colunas necessárias existam em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS commission_rate numeric(4,2) NOT NULL DEFAULT 0.00;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS can_delete boolean NOT NULL DEFAULT false;

-- 2. Garante que technician_id exista em service_orders
ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS technician_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Garante que a tabela commission_ledger exista
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'commission_ledger' AND policyname = 'commission_ledger_select_staff'
  ) THEN
    CREATE POLICY commission_ledger_select_staff ON public.commission_ledger FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'commission_ledger' AND policyname = 'commission_ledger_all_owner'
  ) THEN
    CREATE POLICY commission_ledger_all_owner ON public.commission_ledger FOR ALL TO authenticated USING ((SELECT public.is_owner())) WITH CHECK ((SELECT public.is_owner()));
  END IF;
END $$;

GRANT ALL ON public.commission_ledger TO anon, authenticated, service_role;

-- 4. DESABILITA TEMPORARIAMENTE OS TRIGGERS DE SEGURANÇA PARA APLICAR AS MUDANÇAS ADMINISTRATIVAS
ALTER TABLE public.profiles DISABLE TRIGGER ALL;

-- 5. Sincroniza e insere os usuários criados em auth.users para public.profiles
INSERT INTO public.profiles (id, full_name, email, role, commission_rate, can_delete, active)
SELECT 
  u.id,
  CASE 
    WHEN lower(u.email) LIKE '%felipe%' THEN 'Felipe'
    WHEN lower(u.email) LIKE '%jefferson%' THEN 'Jefferson'
    WHEN lower(u.email) LIKE '%eduardo%' THEN 'Eduardo'
    ELSE split_part(u.email, '@', 1)
  END AS full_name,
  u.email,
  CASE 
    WHEN lower(u.email) LIKE '%felipe%' THEN 'owner'
    ELSE 'technician'
  END AS role,
  CASE 
    WHEN lower(u.email) LIKE '%jefferson%' THEN 0.50
    WHEN lower(u.email) LIKE '%iago%' THEN 0.30
    ELSE 0.00
  END AS commission_rate,
  CASE 
    WHEN lower(u.email) LIKE '%felipe%' THEN true
    ELSE false
  END AS can_delete,
  true AS active
FROM auth.users u
WHERE lower(u.email) IN (
  'felipe@cyberinformatica.tech',
  'jefferson@cyberinformatica.tech',
  'eduardo@cyberinformatica.tech'
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  commission_rate = EXCLUDED.commission_rate,
  can_delete = EXCLUDED.can_delete,
  active = EXCLUDED.active;

-- 6. Atualiza por e-mail caso os registros já existissem previamente
UPDATE public.profiles
SET full_name = 'Felipe', role = 'owner', commission_rate = 0.00, can_delete = true, active = true
WHERE lower(email) = 'felipe@cyberinformatica.tech' OR lower(email) LIKE '%felipe%';

UPDATE public.profiles
SET full_name = 'Jefferson', role = 'technician', commission_rate = 0.50, can_delete = false, active = true
WHERE lower(email) = 'jefferson@cyberinformatica.tech' OR lower(email) LIKE '%jefferson%';

UPDATE public.profiles
SET full_name = 'Eduardo', role = 'technician', commission_rate = 0.00, can_delete = false, active = true
WHERE lower(email) = 'eduardo@cyberinformatica.tech' OR lower(email) LIKE '%eduardo%';

-- 7. Atualiza também taxa do Iago se existir
UPDATE public.profiles
SET commission_rate = 0.30
WHERE lower(email) LIKE '%iago%' OR lower(full_name) LIKE '%iago%';

-- 8. REATIVA TODOS OS TRIGGERS DE SEGURANÇA
ALTER TABLE public.profiles ENABLE TRIGGER ALL;

-- 9. Função de recalcular comissão da OS
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

  IF v_technician_id IS NULL OR v_tech_rate <= 0.00 THEN
    DELETE FROM public.commission_ledger
      WHERE service_order_id = p_os_id
        AND status = 'pending';
    RETURN;
  END IF;

  v_comm_amount := ROUND((v_labor_cost * v_tech_rate), 2);

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
  WHERE public.commission_ledger.status = 'pending';
END;
$function$;

-- 10. Atualiza a view de OS para incluir dados do técnico
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

-- 11. Retorna os perfis configurados para confirmação visual
SELECT id, full_name, email, role, commission_rate, can_delete, active 
FROM public.profiles
WHERE lower(email) IN (
  'felipe@cyberinformatica.tech',
  'jefferson@cyberinformatica.tech',
  'eduardo@cyberinformatica.tech'
) OR lower(email) LIKE '%iago%';
