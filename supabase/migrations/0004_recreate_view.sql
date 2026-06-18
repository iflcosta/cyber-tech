-- ============================================================
-- 0004_recreate_view.sql — recriar view incluindo short_id
-- Rodar no SQL Editor do painel do Supabase. Uma unica vez.
-- ============================================================

-- A view original (0001) foi criada com `so.*` antes da migration
-- 0003 adicionar a coluna `short_id`. Views no Postgres herdam
-- colunas adicionadas depois, MAS o cache de schema do PostgREST
-- (REST API) nao atualiza sozinho e a view continua retornando
-- o shape antigo. Solucao: dropar e recriar explicitamente.

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
  so.assigned_to,
  so.blocking_reason,
  so.estimated_value,
  so.estimated_ready_at,
  so.created_by,
  so.created_at,
  so.updated_at,
  so.delivered_at,
  c.name    AS customer_name,
  c.phone   AS customer_phone,
  p.full_name AS assigned_to_name,
  EXTRACT(DAY FROM (now() - so.updated_at))::int AS days_since_update
FROM public.service_orders so
JOIN public.customers c ON c.id = so.customer_id
LEFT JOIN public.profiles p ON p.id = so.assigned_to
WHERE so.status NOT IN ('delivered', 'cancelled');

GRANT SELECT ON public.service_orders_with_stale TO authenticated;

-- Forca o PostgREST a recarregar o schema agora
NOTIFY pgrst, 'reload schema';
