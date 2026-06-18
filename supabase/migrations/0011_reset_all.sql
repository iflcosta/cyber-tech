-- ============================================================
-- 0011_reset_all.sql — RESET TOTAL das OSs de teste
-- Rodar no SQL Editor do painel do Supabase. Uma unica vez.
-- ============================================================
--
-- Apaga TODAS as OSs e eventos. Reset total.
-- Mantem profiles e customers intactos.
-- A partir da proxima OS criada, ja sai com formato MMYYnnnn.

-- 1. Apaga eventos
DELETE FROM public.service_order_events;

-- 2. Apaga OSs
DELETE FROM public.service_orders;

-- 3. Reseta a sequence antiga (do OS-0001, caso exista)
-- O nome pode variar; ignora erro se nao existir
DO $$
DECLARE
  seq_name text;
BEGIN
  FOR seq_name IN
    SELECT sequencename FROM pg_sequences
    WHERE schemaname = 'public'
      AND sequencename LIKE '%short%'
  LOOP
    EXECUTE format('ALTER SEQUENCE public.%I RESTART WITH 1', seq_name);
  END LOOP;
END $$;

-- 4. Dropa UNIQUE e NOT NULL temporariamente
ALTER TABLE public.service_orders DROP CONSTRAINT IF EXISTS service_orders_short_id_key;
DROP INDEX IF EXISTS idx_service_orders_short_id;
ALTER TABLE public.service_orders ALTER COLUMN short_id DROP NOT NULL;

-- 5. Recria a funcao set_short_id (formato MMYYnnnn com 4 chars no numero)
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

  -- Pega o proximo numero global
  SELECT COALESCE(MAX(
    CAST(substring(short_id FROM 7 FOR 4) AS int)
  ), 0) + 1
  INTO next_num
  FROM public.service_orders
  WHERE short_id LIKE '__' || yr || '%'
    AND length(short_id) = 10;  -- "OS-" + MMYY (4) + nnnn (4) = 11 total... espera

  -- Formato: OS-MMyy-nnnn = "OS-" (3) + MMyy (4) + nnnn (4) = 11 chars total
  NEW.short_id := 'OS-' || mo || yr || lpad(next_num::text, 4, '0');
  RETURN NEW;
END;
$$;

-- 6. Recria UNIQUE e NOT NULL
ALTER TABLE public.service_orders
  ADD CONSTRAINT service_orders_short_id_key UNIQUE (short_id);
ALTER TABLE public.service_orders ALTER COLUMN short_id SET NOT NULL;

NOTIFY pgrst, 'reload schema';