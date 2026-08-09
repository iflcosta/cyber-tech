-- ============================================================
-- 0033_perf_hygiene.sql
-- ============================================================
--
-- Sobras de baixo risco apontadas pelo advisor de performance numa
-- auditoria geral: 3 policies de RLS reavaliavam auth.uid() linha a
-- linha em vez de uma vez só (auth_rls_initplan), e service_order_payments
-- não tinha índice na FK de author_id (mesmo padrão já aplicado nas
-- outras tabelas com author_id/created_by na migration 0020).

-- 1. RLS: (SELECT auth.uid()) em vez de auth.uid() puro — o Postgres
-- otimiza isso avaliando a subquery uma única vez por statement em vez
-- de recalcular pra cada linha. Mesmo padrão já usado nas policies
-- mais novas desta sessão (can_delete(), service_orders_update_staff).

DROP POLICY IF EXISTS "Authenticated users can register OS payments" ON public.service_order_payments;
CREATE POLICY "Authenticated users can register OS payments" ON public.service_order_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Only owners can view contact leads" ON public.contact_leads;
CREATE POLICY "Only owners can view contact leads" ON public.contact_leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'owner' AND p.active = true
    )
  );

DROP POLICY IF EXISTS "Only owners can update contact leads" ON public.contact_leads;
CREATE POLICY "Only owners can update contact leads" ON public.contact_leads
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'owner' AND p.active = true
    )
  );

-- 2. Índice que faltava na FK de author_id
CREATE INDEX IF NOT EXISTS idx_service_order_payments_author
  ON public.service_order_payments(author_id);

NOTIFY pgrst, 'reload schema';
