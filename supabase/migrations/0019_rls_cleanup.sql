-- ============================================================
-- 0019_rls_cleanup.sql — limpeza de políticas RLS
-- ============================================================
--
-- Contexto (2026-08-06), achado na auditoria ampla do CRM:
--
-- 1. stock_items e sales tinham DUAS políticas de UPDATE cada: uma
--    "só dono" (is_owner()) e uma "qualquer autenticado" (true).
--    Postgres combina políticas permissivas com OU — a restritiva
--    nunca valia de fato, só dava falsa impressão de estar
--    protegido. Confirmado com o time: comportamento desejado é
--    mesmo "qualquer autenticado edita" (igual o resto do sistema),
--    então a política "_owner_only" é removida por ser morta/enganosa.
--
-- 2. customers só permitia UPDATE pelo dono ou por quem criou o
--    registro — destoava do padrão relaxado usado em service_orders
--    (migration 0002) e virou um problema prático depois que o
--    cadastro de OS passou a reaproveitar clientes já existentes
--    (um técnico pode reaproveitar cliente criado por outro colega
--    e precisar corrigir um dado depois).
--
-- 3. As migrations 0016 (part_orders/suppliers) usaram um EXISTS
--    inline pra checar "é dono" em vez da função is_owner() que já
--    existe no banco. Mesmo resultado, só inconsistente — trocado
--    aqui pra usar a função padrão.

-- 1. Remove política morta de UPDATE em stock_items
DROP POLICY IF EXISTS "stock_items_update_owner_only" ON public.stock_items;

-- 2. Remove política morta de UPDATE em sales
DROP POLICY IF EXISTS "sales_update_owner_only" ON public.sales;

-- 3. Relaxa UPDATE em customers pra qualquer autenticado
DROP POLICY IF EXISTS "customers_update_owner_or_creator" ON public.customers;
CREATE POLICY "customers_update_authenticated"
  ON public.customers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Padroniza part_orders/suppliers pra usar is_owner()
DROP POLICY IF EXISTS "Only owners can delete part orders" ON public.part_orders;
CREATE POLICY "part_orders_delete_owner_only"
  ON public.part_orders FOR DELETE
  TO authenticated
  USING (public.is_owner());

DROP POLICY IF EXISTS "Only owners can delete suppliers" ON public.suppliers;
CREATE POLICY "suppliers_delete_owner_only"
  ON public.suppliers FOR DELETE
  TO authenticated
  USING (public.is_owner());

NOTIFY pgrst, 'reload schema';
