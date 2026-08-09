-- ============================================================
-- 0031_remove_technician_assignment.sql
-- ============================================================
--
-- Atribuição de técnico (service_orders.assigned_to) nunca pegou na
-- prática — 0 das OSs existentes tinham alguém atribuído, e não
-- existia nem link nenhum na UI apontando pro filtro "?mine=1" (chão
-- morto). A loja já sabe informalmente quem está com qual aparelho;
-- o campo só ocupava espaço na tela e ainda tinha duas policies de
-- RLS dependendo dele (hoje inofensivas só porque os 3 usuários são
-- role='owner', mas ficariam enganosas se um técnico novo entrar sem
-- is_owner()).
--
-- Remove a coluna e ajusta o que dependia dela: a view de OS ativas
-- e as duas policies de INSERT/UPDATE (que passam a espelhar
-- exatamente o canEdit já usado no frontend: is_owner() OU
-- role='technician' — sem depender de "atribuída a mim").

-- 1. View: tira assigned_to/assigned_to_name (e o LEFT JOIN em
-- profiles que só existia pra resolver esse nome). CREATE OR REPLACE
-- não permite tirar coluna de uma view existente — precisa DROP.
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
  so.estimated_ready_at,
  so.created_by,
  so.created_at,
  so.updated_at,
  so.delivered_at,
  c.name AS customer_name,
  c.phone AS customer_phone,
  (EXTRACT(day FROM (now() - so.updated_at)))::integer AS days_since_update
FROM public.service_orders so
JOIN public.customers c ON (c.id = so.customer_id)
WHERE so.status <> ALL (ARRAY['delivered'::text, 'cancelled'::text]);

-- Supabase concede esse mesmo conjunto de privilégios por padrão em
-- toda view nova do schema public (ALTER DEFAULT PRIVILEGES do
-- projeto) — replicado aqui pra não mudar o que já valia antes do
-- DROP/CREATE. RLS da tabela base (service_orders) continua sendo o
-- controle real de acesso linha a linha.
GRANT ALL ON public.service_orders_with_stale TO anon, authenticated, service_role;

-- 2. Policy de UPDATE em service_orders: antes exigia is_owner() OU
-- assigned_to=auth.uid(). Sem atribuição, o equivalente ao que o
-- frontend já tratava como "pode editar" (canEdit = role owner OU
-- technician) é is_owner() OU role='technician' — qualquer conta de
-- staff ativa.
DROP POLICY IF EXISTS service_orders_update_owner_or_assigned ON public.service_orders;
CREATE POLICY service_orders_update_staff ON public.service_orders
  FOR UPDATE
  USING ((SELECT public.is_owner()) OR (SELECT public.current_user_role()) = 'technician')
  WITH CHECK ((SELECT public.is_owner()) OR (SELECT public.current_user_role()) = 'technician');

-- 3. Policy de INSERT em service_order_events também dependia de
-- assigned_to (permitia inserir evento se fosse owner, atribuído ou
-- quem criou a OS). Mesma troca: is_owner() OU role='technician' OU
-- criador da OS.
DROP POLICY IF EXISTS service_order_events_insert_owner_or_assigned_or_creator ON public.service_order_events;
CREATE POLICY service_order_events_insert_staff ON public.service_order_events
  FOR INSERT
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.service_orders so
      WHERE so.id = service_order_events.service_order_id
        AND ((SELECT public.is_owner()) OR (SELECT public.current_user_role()) = 'technician' OR so.created_by = (SELECT auth.uid()))
    )
  );

-- 4. Coluna em si (dropa a FK service_orders_assigned_to_fkey junto).
ALTER TABLE public.service_orders DROP COLUMN IF EXISTS assigned_to;

-- event_type 'assigned' continua uma opção válida no CHECK de
-- service_order_events (histórico antigo tem esse tipo, a timeline
-- ainda precisa exibir) — só não vai mais ser gerado por código
-- novo. Não precisa remover do CHECK, é inofensivo manter.

NOTIFY pgrst, 'reload schema';
