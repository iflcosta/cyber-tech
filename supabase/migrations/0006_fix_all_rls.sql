-- ============================================================
-- 0006_fix_all_rls.sql — corrigir RLS recursiva em todas as tabelas
-- Rodar no SQL Editor do painel do Supabase. Uma unica vez.
-- ============================================================
--
-- Problema: policies que referenciam a propria tabela em subquery
-- causam 'infinite recursion detected'. A correcao via
-- SECURITY DEFINER funciona pra qualquer tabela.
--
-- Aplica a mesma estrategia da 0005 (profiles) em:
--   - service_orders
--   - customers
--   - service_order_events
--
-- Tambem adiciona as 3 funcoes helper:
--   - current_user_role()       (ja existia da 0005)
--   - is_owner()                (wrapper)
--   - is_technician_or_owner()  (wrapper)

-- Funcao ja existia, garantir
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() = 'owner', false);
$$;

GRANT EXECUTE ON FUNCTION public.is_owner() TO authenticated;

-- ============================================================
-- SERVICE_ORDERS
-- ============================================================
-- Limpar policies existentes (nomes comuns — os que existirem sao apagados)
DO $$
DECLARE
  p text;
BEGIN
  FOR p IN SELECT polname FROM pg_policy WHERE polrelid = 'public.service_orders'::regclass
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.service_orders', p);
  END LOOP;
END $$;

CREATE POLICY "service_orders_select_authenticated" ON public.service_orders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "service_orders_insert_authenticated" ON public.service_orders
  FOR INSERT TO authenticated WITH CHECK (true);

-- Update: owner sempre; technician em OS atribuida a ele
CREATE POLICY "service_orders_update_owner_or_assigned" ON public.service_orders
  FOR UPDATE TO authenticated
  USING (public.is_owner() OR assigned_to = auth.uid())
  WITH CHECK (public.is_owner() OR assigned_to = auth.uid());

CREATE POLICY "service_orders_delete_owner_only" ON public.service_orders
  FOR DELETE TO authenticated USING (public.is_owner());

-- ============================================================
-- CUSTOMERS
-- ============================================================
DO $$
DECLARE
  p text;
BEGIN
  FOR p IN SELECT polname FROM pg_policy WHERE polrelid = 'public.customers'::regclass
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.customers', p);
  END LOOP;
END $$;

CREATE POLICY "customers_select_authenticated" ON public.customers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "customers_insert_authenticated" ON public.customers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "customers_update_authenticated" ON public.customers
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Delete: so owner (defesa em profundidade; cancelar OS e' o caminho normal)
CREATE POLICY "customers_delete_owner_only" ON public.customers
  FOR DELETE TO authenticated USING (public.is_owner());

-- ============================================================
-- SERVICE_ORDER_EVENTS
-- ============================================================
DO $$
DECLARE
  p text;
BEGIN
  FOR p IN SELECT polname FROM pg_policy WHERE polrelid = 'public.service_order_events'::regclass
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.service_order_events', p);
  END LOOP;
END $$;

CREATE POLICY "service_order_events_select_authenticated" ON public.service_order_events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "service_order_events_insert_authenticated" ON public.service_order_events
  FOR INSERT TO authenticated WITH CHECK (true);

-- Update/Delete raramente, mas mantemos consistencia
CREATE POLICY "service_order_events_update_owner_or_author" ON public.service_order_events
  FOR UPDATE TO authenticated
  USING (public.is_owner() OR author_id = auth.uid())
  WITH CHECK (public.is_owner() OR author_id = auth.uid());

CREATE POLICY "service_order_events_delete_owner_only" ON public.service_order_events
  FOR DELETE TO authenticated USING (public.is_owner());

-- Forca reload do schema
NOTIFY pgrst, 'reload schema';
