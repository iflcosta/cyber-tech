-- ============================================================
-- 0010_fix_short_id.sql — corrigir formato MMYYnnnn
-- Rodar no SQL Editor do painel do Supabase. Uma unica vez.
-- ============================================================
--
-- Problema: a 0009 tentou rodar mas falhou por unique constraint
-- porque ja' existem short_ids em formatos diferentes:
--   - OS-0001 (antigo, 4 chars)
--   - OS-06260001 (parcial, 5 chars - errado)
--
-- Solucao:
-- 1. Reseta todos os short_id pra NULL
-- 2. Recria a funcao set_short_id (ja' existe da 0009)
-- 3. Roda backfill usando created_at de cada OS em ordem
-- 4. Recria o index UNIQUE

-- 1. Backup do estado atual
CREATE TABLE IF NOT EXISTS public.service_orders_short_id_backup AS
SELECT id, short_id, created_at FROM public.service_orders;

-- 2. Dropa o indice UNIQUE temporariamente
ALTER TABLE public.service_orders DROP CONSTRAINT IF EXISTS service_orders_short_id_key;
DROP INDEX IF EXISTS idx_service_orders_short_id;
DROP INDEX IF EXISTS service_orders_short_id_unique;

-- 3. Reseta todos os short_id
UPDATE public.service_orders SET short_id = NULL;

-- 4. Recria a funcao set_short_id (formato MMYYnnnn com 4 chars)
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
    AND length(short_id) = 10;  -- MMYY = 4 chars, nnnn = 4 chars, total = 10

  NEW.short_id := 'OS-' || mo || yr || lpad(next_num::text, 4, '0');
  RETURN NEW;
END;
$$;

-- 5. Backfill em ordem cronologica (mes + ano + sequencial)
DO $$
DECLARE
  rec record;
  next_num int;
  yr text;
  mo text;
  prefix text;
BEGIN
  FOR rec IN
    SELECT id, created_at
    FROM public.service_orders
    ORDER BY created_at ASC
  LOOP
    yr := to_char(rec.created_at, 'YY');
    mo := to_char(rec.created_at, 'MM');
    prefix := 'OS-' || mo || yr;

    SELECT COALESCE(MAX(
      CAST(substring(short_id FROM 7 FOR 4) AS int)
    ), 0) + 1
    INTO next_num
    FROM public.service_orders
    WHERE short_id LIKE prefix || '%'
      AND length(short_id) = 10;

    UPDATE public.service_orders
    SET short_id = prefix || lpad(next_num::text, 4, '0')
    WHERE id = rec.id;
  END LOOP;
END $$;

-- 6. Recria o indice UNIQUE
ALTER TABLE public.service_orders
  ADD CONSTRAINT service_orders_short_id_key UNIQUE (short_id);

NOTIFY pgrst, 'reload schema';