-- ============================================================
-- 0010_fix_short_id.sql — corrigir formato MMYYnnnn
-- Rodar no SQL Editor do painel do Supabase. Uma unica vez.
-- ============================================================
--
-- Problema: a 0009 falhou porque ja' existem short_ids em
-- formatos diferentes e unique constraint + NOT NULL bloqueiam
-- o backfill limpo.
--
-- Solucao: drop UNIQUE + NOT NULL, reset, backfill, recria.

-- 1. Backup do estado atual
CREATE TABLE IF NOT EXISTS public.service_orders_short_id_backup AS
SELECT id, short_id, created_at FROM public.service_orders;

-- 2. Dropa o indice UNIQUE + NOT NULL
ALTER TABLE public.service_orders DROP CONSTRAINT IF EXISTS service_orders_short_id_key;
DROP INDEX IF EXISTS idx_service_orders_short_id;
ALTER TABLE public.service_orders ALTER COLUMN short_id DROP NOT NULL;

-- 3. Reseta todos os short_id
UPDATE public.service_orders SET short_id = NULL;

-- 4. Recria a funcao set_short_id (formato MMYYnnnn)
CREATE OR REPLACE FUNCTION public.set_short_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  next_num int;
  yr text;
  mo text;
BEGIN
  yr := to_char(now(), 'YY');
  mo := to_char(now(), 'MM');

  SELECT COALESCE(MAX(
    CAST(substring(short_id FROM 7 FOR 4) AS int)
  ), 0) + 1
  INTO next_num
  FROM public.service_orders
  WHERE short_id LIKE '__' || yr || '%'
    AND length(short_id) = 10;

  NEW.short_id := 'OS-' || mo || yr || lpad(next_num::text, 4, '0');
  RETURN NEW;
END;
$$;

-- 5. Backfill usando CTE com window function (sem DO block)
WITH ranked AS (
  SELECT
    id,
    created_at,
    to_char(created_at, 'YY') AS yr,
    to_char(created_at, 'MM') AS mo,
    ROW_NUMBER() OVER (
      PARTITION BY to_char(created_at, 'YY'), to_char(created_at, 'MM')
      ORDER BY created_at ASC
    ) AS seq
  FROM public.service_orders
)
UPDATE public.service_orders so
SET short_id = 'OS-' || r.mo || r.yr || lpad(r.seq::text, 4, '0')
FROM ranked r
WHERE so.id = r.id;

-- 6. Recria UNIQUE + NOT NULL
ALTER TABLE public.service_orders
  ADD CONSTRAINT service_orders_short_id_key UNIQUE (short_id);
ALTER TABLE public.service_orders ALTER COLUMN short_id SET NOT NULL;

NOTIFY pgrst, 'reload schema';