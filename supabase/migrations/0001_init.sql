-- ============================================================
-- 0001_init.sql — CRM da Cyber Informática
-- Supabase project: avfcsuyackxiaglldyvo.supabase.co (NOVO, isolado)
-- Rodar no SQL Editor do painel do Supabase. Uma unica vez.
-- ============================================================

-- 1. Extensoes
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Sequences (para numeracao de OS)
CREATE SEQUENCE IF NOT EXISTS public.service_order_seq START 1;

-- 3. Tabela profiles (1:1 com auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text NOT NULL,
  email       text NOT NULL UNIQUE,
  role        text NOT NULL CHECK (role IN ('owner', 'technician')),
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Todo usuario autenticado ve todos os profiles (necessario para dropdowns)
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- So owner pode inserir/atualizar/deletar profiles
CREATE POLICY "Only owners can manage profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'owner'
    )
  );

-- 4. Tabela customers
CREATE TABLE IF NOT EXISTS public.customers (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          text NOT NULL,
  phone         text,
  phone_search  text GENERATED ALWAYS AS (
    regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g')
  ) STORED,
  email         text,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone_search ON public.customers(phone_search);
CREATE INDEX IF NOT EXISTS idx_customers_name_lower ON public.customers(lower(name));

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view customers"
  ON public.customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create customers"
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Owner or creator can update customers"
  ON public.customers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Only owners can delete customers"
  ON public.customers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'owner'
    )
  );

-- 5. Tabela service_orders
CREATE TABLE IF NOT EXISTS public.service_orders (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  os_number           text UNIQUE,
  customer_id         uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  equipment_type      text NOT NULL CHECK (equipment_type IN ('computador', 'notebook', 'celular', 'tablet', 'outro')),
  equipment_brand     text,
  equipment_model     text,
  equipment_color     text,
  equipment_serial    text,
  equipment_password  text,
  reported_defect     text NOT NULL,
  entry_checklist     jsonb NOT NULL DEFAULT '{}'::jsonb,
  accessories_in      text,
  status              text NOT NULL DEFAULT 'awaiting_approval' CHECK (status IN (
    'awaiting_approval', 'approved', 'in_progress', 'waiting_part',
    'ready', 'delivered', 'cancelled'
  )),
  assigned_to         uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  blocking_reason     text,
  estimated_value     numeric(10,2),
  estimated_ready_at  date,
  created_by          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  delivered_at        timestamptz
);

CREATE INDEX IF NOT EXISTS idx_service_orders_status ON public.service_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_assigned_to ON public.service_orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_service_orders_created_at_desc ON public.service_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_orders_equipment_serial ON public.service_orders(equipment_serial);
CREATE INDEX IF NOT EXISTS idx_service_orders_customer_id ON public.service_orders(customer_id);

ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

-- Todos veem todas as OS
CREATE POLICY "Authenticated users can view all service orders"
  ON public.service_orders FOR SELECT
  TO authenticated
  USING (true);

-- Qualquer autenticado pode criar
CREATE POLICY "Authenticated users can create service orders"
  ON public.service_orders FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- UPDATE: owner edita tudo, tecnico so nas atribuidas a ele
-- Excecao: tecnico pode se auto-atribuir (assigned_to = auth.uid()) mesmo
-- que a OS ainda nao seja dele (caminho de "pegar a OS pra mim")
CREATE POLICY "Owner or assigned technician can update service orders"
  ON public.service_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'owner'
    )
    OR assigned_to = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'owner'
    )
    OR assigned_to = auth.uid()
    OR (assigned_to IS NULL AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'technician'
    ))
  );

-- DELETE: apenas owner
CREATE POLICY "Only owners can delete service orders"
  ON public.service_orders FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'owner'
    )
  );

-- 6. Tabela service_order_events (linha do tempo)
CREATE TABLE IF NOT EXISTS public.service_order_events (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_order_id  uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  event_type        text NOT NULL CHECK (event_type IN (
    'created', 'status_changed', 'assigned', 'note_added',
    'checklist_updated', 'part_resolved', 'delivered'
  )),
  from_value        text,
  to_value          text,
  note              text,
  author_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_order_created ON public.service_order_events(service_order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_author ON public.service_order_events(author_id);

ALTER TABLE public.service_order_events ENABLE ROW LEVEL SECURITY;

-- Todos veem todos os eventos
CREATE POLICY "Authenticated users can view events"
  ON public.service_order_events FOR SELECT
  TO authenticated
  USING (true);

-- Pode criar evento se pode atualizar a OS (mesma logica)
CREATE POLICY "Authorized users can create events"
  ON public.service_order_events FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.service_orders so
      WHERE so.id = service_order_id
      AND (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'owner')
        OR so.assigned_to = auth.uid()
        OR so.created_by = auth.uid()
      )
    )
  );

-- Ninguem edita evento depois de criado (sao imutaveis)
-- Ninguem deleta evento (audit trail)

-- 7. View para lista de OS com dias parada
CREATE OR REPLACE VIEW public.service_orders_with_stale AS
SELECT
  so.*,
  c.name    AS customer_name,
  c.phone   AS customer_phone,
  p.full_name AS assigned_to_name,
  EXTRACT(DAY FROM (now() - so.updated_at))::int AS days_since_update
FROM public.service_orders so
JOIN public.customers c ON c.id = so.customer_id
LEFT JOIN public.profiles p ON p.id = so.assigned_to
WHERE so.status NOT IN ('delivered', 'cancelled');

GRANT SELECT ON public.service_orders_with_stale TO authenticated;

-- 8. Trigger: gerar os_number automaticamente
CREATE OR REPLACE FUNCTION public.set_os_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_year text;
  next_seq     int;
BEGIN
  IF NEW.os_number IS NULL THEN
    current_year := to_char(now(), 'YYYY');
    next_seq := nextval('public.service_order_seq');
    NEW.os_number := 'OS-' || current_year || '-' || lpad(next_seq::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_os_number ON public.service_orders;
CREATE TRIGGER trg_os_number
  BEFORE INSERT ON public.service_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_os_number();

-- 9. Trigger: tocar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_service_orders_touch ON public.service_orders;
CREATE TRIGGER trg_service_orders_touch
  BEFORE UPDATE ON public.service_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_customers_touch ON public.customers;
CREATE TRIGGER trg_customers_touch
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

-- 10. Trigger: quando status muda para delivered, setar delivered_at
CREATE OR REPLACE FUNCTION public.set_delivered_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status <> 'delivered' THEN
    NEW.delivered_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_service_orders_delivered ON public.service_orders;
CREATE TRIGGER trg_service_orders_delivered
  BEFORE UPDATE ON public.service_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_delivered_at();

-- 11. Trigger: auto-criar profile quando novo usuario e criado no Auth
-- (so se o usuario for criado com metadata -> role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'technician')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 12. Comentarios para documentacao
COMMENT ON TABLE public.service_orders IS 'Ordens de servico da bancada';
COMMENT ON TABLE public.service_order_events IS 'Linha do tempo imutavel de cada OS';
COMMENT ON COLUMN public.service_orders.os_number IS 'Numero sequencial humano-legivel: OS-YYYY-NNNN';
COMMENT ON COLUMN public.service_orders.blocking_reason IS 'Texto livre: o que impede de avancar (ex: aguardando peca). NAO e controle de estoque.';
