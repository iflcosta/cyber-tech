-- =============================================================================
-- 0045_cash_control_and_used_devices.sql
-- Módulo de Controle de Caixa Diário e Compras de Aparelhos Usados (Seminovos)
-- =============================================================================

-- 1. TABELA DE SESSÕES DE CAIXA DIÁRIO (cash_sessions)
CREATE TABLE IF NOT EXISTS public.cash_sessions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_number      serial UNIQUE,
  opened_by           uuid NOT NULL REFERENCES public.profiles(id),
  closed_by           uuid REFERENCES public.profiles(id),
  opened_at           timestamptz NOT NULL DEFAULT now(),
  closed_at           timestamptz,
  initial_cash        numeric(10,2) NOT NULL DEFAULT 0.00 CHECK (initial_cash >= 0),
  total_cash_in       numeric(10,2) NOT NULL DEFAULT 0.00,
  total_cash_out      numeric(10,2) NOT NULL DEFAULT 0.00,
  expected_cash       numeric(10,2) NOT NULL DEFAULT 0.00,
  declared_cash       numeric(10,2),
  cash_difference     numeric(10,2),
  status              text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cash_sessions_status ON public.cash_sessions(status);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_opened ON public.cash_sessions(opened_at DESC);

ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read cash_sessions" ON public.cash_sessions;
CREATE POLICY "Authenticated users can read cash_sessions"
  ON public.cash_sessions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage cash_sessions" ON public.cash_sessions;
CREATE POLICY "Authenticated users can manage cash_sessions"
  ON public.cash_sessions FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON public.cash_sessions TO authenticated, anon, service_role;

-- 2. TABELA DE MOVIMENTAÇÕES DE CAIXA (cash_entries)
CREATE TABLE IF NOT EXISTS public.cash_entries (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          uuid NOT NULL REFERENCES public.cash_sessions(id) ON DELETE CASCADE,
  entry_type          text NOT NULL CHECK (entry_type IN ('initial', 'in_sale', 'in_os', 'out_bleed', 'in_reinforce', 'manual_adjustment')),
  amount              numeric(10,2) NOT NULL CHECK (amount > 0),
  description         text NOT NULL,
  author_id           uuid NOT NULL REFERENCES public.profiles(id),
  related_sale_id     uuid REFERENCES public.sales(id) ON DELETE SET NULL,
  related_service_order_id uuid REFERENCES public.service_orders(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cash_entries_session ON public.cash_entries(session_id);
CREATE INDEX IF NOT EXISTS idx_cash_entries_type ON public.cash_entries(entry_type);

ALTER TABLE public.cash_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read cash_entries" ON public.cash_entries;
CREATE POLICY "Authenticated users can read cash_entries"
  ON public.cash_entries FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage cash_entries" ON public.cash_entries;
CREATE POLICY "Authenticated users can manage cash_entries"
  ON public.cash_entries FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON public.cash_entries TO authenticated, anon, service_role;

-- 3. TRIGGER PARA ATUALIZAR TOTAIS DA SESSÃO AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION public.trg_cash_entries_update_totals()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_session_id uuid;
  v_initial numeric(10,2);
  v_in numeric(10,2);
  v_out numeric(10,2);
BEGIN
  v_session_id := COALESCE(NEW.session_id, OLD.session_id);

  SELECT initial_cash INTO v_initial FROM public.cash_sessions WHERE id = v_session_id;

  SELECT 
    COALESCE(SUM(amount) FILTER (WHERE entry_type IN ('in_sale', 'in_os', 'in_reinforce')), 0.00),
    COALESCE(SUM(amount) FILTER (WHERE entry_type IN ('out_bleed')), 0.00)
  INTO v_in, v_out
  FROM public.cash_entries
  WHERE session_id = v_session_id;

  UPDATE public.cash_sessions
  SET 
    total_cash_in = v_in,
    total_cash_out = v_out,
    expected_cash = COALESCE(v_initial, 0.00) + v_in - v_out,
    updated_at = now()
  WHERE id = v_session_id;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_cash_entries_sync ON public.cash_entries;
CREATE TRIGGER trg_cash_entries_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.cash_entries
  FOR EACH ROW EXECUTE FUNCTION public.trg_cash_entries_update_totals();

-- 4. TABELA DE COMPRAS DE APARELHOS USADOS (DECLARAÇÃO DE PROCEDÊNCIA & COMPLIANCE)
CREATE TABLE IF NOT EXISTS public.used_device_purchases (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_number              serial UNIQUE,
  seller_name                 text NOT NULL,
  seller_cpf                  text NOT NULL,
  seller_rg                   text,
  seller_phone                text NOT NULL,
  seller_address              text,
  device_type                 text NOT NULL,
  brand                       text NOT NULL,
  model                       text NOT NULL,
  color                       text,
  serial_number               text,
  imei_1                      text,
  imei_2                      text,
  purchase_price              numeric(10,2) NOT NULL CHECK (purchase_price >= 0),
  payment_method              text NOT NULL DEFAULT 'pix',
  pix_key                     text,
  condition_notes             text,
  icloud_google_removed       boolean NOT NULL DEFAULT true,
  legal_declaration_accepted  boolean NOT NULL DEFAULT true,
  registered_by               uuid NOT NULL REFERENCES public.profiles(id),
  stock_item_id               uuid REFERENCES public.stock_items(id) ON DELETE SET NULL,
  created_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_used_devices_cpf ON public.used_device_purchases(seller_cpf);
CREATE INDEX IF NOT EXISTS idx_used_devices_imei ON public.used_device_purchases(imei_1);

ALTER TABLE public.used_device_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read used_purchases" ON public.used_device_purchases;
CREATE POLICY "Authenticated users can read used_purchases"
  ON public.used_device_purchases FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage used_purchases" ON public.used_device_purchases;
CREATE POLICY "Authenticated users can manage used_purchases"
  ON public.used_device_purchases FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON public.used_device_purchases TO authenticated, anon, service_role;

NOTIFY pgrst, 'reload schema';
