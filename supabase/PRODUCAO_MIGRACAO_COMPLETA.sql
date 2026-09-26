-- =============================================================================
-- CYBER INFORMÁTICA — SCRIPT UNIFICADO DE PRODUÇÃO (MIGRAÇÕES 0034, 0035 E 0036)
-- Projeto Supabase CRM: avfcsuyackxiaglldyvo
-- =============================================================================
-- 100% ADITIVO E IDEMPOTENTE:
-- • Preserva integralmente todo o estoque cadastrado pelo Eduardo (stock_items).
-- • Preserva todas as Ordens de Serviço, Clientes, Vendas e Perfis existentes.
-- • Adiciona:
--   1. Livro-razão de comissões (Iago 30%, Jefferson 50/50, Felipe/Loja 0%)
--   2. RPC pública e segura de rastreio de OS (/status)
--   3. SKU interno + localização física no estoque do Eduardo + Cyber Camera Sync
-- =============================================================================

-- =============================================================================
-- PARTE 1: COMISSÕES POR TÉCNICO (0034)
-- =============================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS commission_rate numeric(4,2) NOT NULL DEFAULT 0.00;

UPDATE public.profiles
  SET commission_rate = 0.30
  WHERE lower(full_name) LIKE '%iago%' OR lower(email) LIKE '%iago%';

UPDATE public.profiles
  SET commission_rate = 0.50
  WHERE lower(full_name) LIKE '%jefferson%' OR lower(email) LIKE '%jefferson%';

ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS technician_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Preenche technician_id nas OSs antigas que ainda estão sem técnico usando created_by
UPDATE public.service_orders
  SET technician_id = created_by
  WHERE technician_id IS NULL AND created_by IS NOT NULL;

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

DROP POLICY IF EXISTS commission_ledger_select_staff ON public.commission_ledger;
CREATE POLICY commission_ledger_select_staff ON public.commission_ledger
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS commission_ledger_all_staff ON public.commission_ledger;
CREATE POLICY commission_ledger_all_staff ON public.commission_ledger
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT ALL ON public.commission_ledger TO authenticated, service_role;

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
  v_comm_amount     numeric(10,2);
BEGIN
  SELECT 
    COALESCE(so.technician_id, so.created_by),
    p.full_name,
    COALESCE(p.commission_rate, 0.00),
    COALESCE(so.labor_cost, 0.00),
    so.payment_status
  INTO 
    v_technician_id,
    v_tech_name,
    v_tech_rate,
    v_labor_cost,
    v_payment_status
  FROM public.service_orders so
  LEFT JOIN public.profiles p ON p.id = COALESCE(so.technician_id, so.created_by)
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

GRANT EXECUTE ON FUNCTION public.recompute_os_commission(uuid) TO authenticated, service_role;

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
    PERFORM public.recompute_os_commission(NEW.id);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_service_orders_recompute_commission ON public.service_orders;
CREATE TRIGGER trg_service_orders_recompute_commission
  AFTER INSERT OR UPDATE ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION public.trg_service_orders_commission();

-- =============================================================================
-- PARTE 2: RASTREIO PÚBLICO SEGURO NO PORTAL DO CLIENTE (/status) (0035)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.rpc_track_service_order(
  p_query text,
  p_phone text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_res jsonb;
  v_clean_query text;
  v_clean_phone text;
  v_order_id uuid;
BEGIN
  v_clean_query := TRIM(COALESCE(p_query, ''));
  v_clean_phone := REGEXP_REPLACE(COALESCE(p_phone, ''), '\D', '', 'g');

  IF v_clean_query = '' AND v_clean_phone = '' THEN
    RETURN jsonb_build_object('found', false, 'error', 'Informe o número da OS ou telefone para consulta.');
  END IF;

  SELECT so.id INTO v_order_id
  FROM public.service_orders so
  LEFT JOIN public.customers c ON so.customer_id = c.id
  WHERE (
    (v_clean_query ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND so.id = v_clean_query::uuid)
    OR (v_clean_query <> '' AND UPPER(so.short_id) = UPPER(v_clean_query))
    OR (v_clean_query <> '' AND (so.os_number = v_clean_query OR ('#' || so.os_number) = v_clean_query))
    OR (
      v_clean_phone <> ''
      AND LENGTH(v_clean_phone) >= 4
      AND (
        c.phone_search LIKE ('%' || v_clean_phone)
        OR REGEXP_REPLACE(COALESCE(c.phone, ''), '\D', '', 'g') LIKE ('%' || v_clean_phone)
      )
    )
  )
  ORDER BY so.created_at DESC
  LIMIT 1;

  IF v_order_id IS NULL THEN
    RETURN jsonb_build_object('found', false, 'error', 'Ordem de serviço não encontrada com os dados informados.');
  END IF;

  SELECT jsonb_build_object(
    'found', true,
    'id', so.id,
    'short_id', COALESCE(so.short_id, 'CYB-' || SUBSTRING(so.id::text, 1, 6)),
    'os_number', so.os_number,
    'status', so.status,
    'equipment_type', so.equipment_type,
    'equipment_brand', COALESCE(so.equipment_brand, 'Equipamento'),
    'equipment_model', COALESCE(so.equipment_model, 'Hardware'),
    'reported_defect', so.reported_defect,
    'accessories_in', so.accessories_in,
    'entry_checklist', COALESCE(so.entry_checklist, '{}'::jsonb),
    'equipment_photos', COALESCE(to_jsonb(so.equipment_photos), '[]'::jsonb),
    'estimated_value', COALESCE(so.estimated_value, 0.00),
    'labor_cost', COALESCE(so.labor_cost, 0.00),
    'payment_status', COALESCE(so.payment_status, 'pending'),
    'payment_method', so.payment_method,
    'estimated_ready_at', so.estimated_ready_at,
    'created_at', so.created_at,
    'updated_at', so.updated_at,
    'delivered_at', so.delivered_at,
    'customer_first_name', COALESCE(SPLIT_PART(c.name, ' ', 1), 'Cliente'),
    'timeline', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', ev.id,
          'event_type', ev.event_type,
          'from_value', ev.from_value,
          'to_value', ev.to_value,
          'note', ev.note,
          'created_at', ev.created_at
        ) ORDER BY ev.created_at ASC
      )
      FROM public.service_order_events ev
      WHERE ev.service_order_id = so.id
    ), '[]'::jsonb),
    'parts_applied', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', si.name,
          'quantity', sm.quantity,
          'unit_price', sm.unit_price
        )
      )
      FROM public.stock_movements sm
      JOIN public.stock_items si ON sm.stock_item_id = si.id
      WHERE sm.service_order_id = so.id AND sm.movement_type = 'out'
    ), '[]'::jsonb)
  ) INTO v_res
  FROM public.service_orders so
  LEFT JOIN public.customers c ON so.customer_id = c.id
  WHERE so.id = v_order_id;

  RETURN v_res;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_track_service_order(text, text) TO anon, authenticated, service_role;

-- =============================================================================
-- PARTE 3: ESTOQUE DO EDUARDO (SKU / PRATELEIRA) + CYBER CAMERA SYNC (0036)
-- =============================================================================
ALTER TABLE public.stock_items
  ADD COLUMN IF NOT EXISTS internal_sku text,
  ADD COLUMN IF NOT EXISTS shelf_location text,
  ADD COLUMN IF NOT EXISTS reserved_stock integer NOT NULL DEFAULT 0;

UPDATE public.stock_items
SET internal_sku = 'CYB-' || UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 6))
WHERE internal_sku IS NULL;

CREATE INDEX IF NOT EXISTS idx_stock_items_ean13
  ON public.stock_items (ean13)
  WHERE ean13 IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stock_items_internal_sku
  ON public.stock_items (UPPER(internal_sku))
  WHERE internal_sku IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stock_items_name_trgm
  ON public.stock_items (LOWER(name));

CREATE TABLE IF NOT EXISTS public.camera_sync_sessions (
  session_token   text PRIMARY KEY,
  photos          jsonb NOT NULL DEFAULT '[]'::jsonb,
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '30 minutes')
);

ALTER TABLE public.camera_sync_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS camera_sync_public_token_access ON public.camera_sync_sessions;
CREATE POLICY camera_sync_public_token_access ON public.camera_sync_sessions
  FOR ALL
  TO anon, authenticated
  USING (expires_at > now())
  WITH CHECK (expires_at > now());

GRANT ALL ON public.camera_sync_sessions TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
