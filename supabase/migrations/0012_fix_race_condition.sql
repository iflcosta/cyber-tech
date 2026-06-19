-- ============================================================
-- 0012_fix_race_condition.sql — short_id via sequence atomica
-- Rodar no SQL Editor do painel do Supabase. Uma unica vez.
-- ============================================================
--
-- Problema: a funcao set_short_id atual usa MAX(substring(...))+1,
-- que tem RACE CONDITION. Quando duas OSs sao criadas quase ao
-- mesmo tempo (ex: 2 tecnicos cadastrando simultaneamente), ambas
-- leem o mesmo MAX e tentam inserir o mesmo numero, causando
-- erro 'duplicate key value violates unique constraint'.
--
-- Solucao: criar uma SEQUENCE real do Postgres (que tem protecao
-- atomica nativa via nextval). O nextval e' thread-safe.
--
-- A sequence e' GLOBAL (mesmo para todos os meses/anos), mas o
-- short_id gerado inclui mes+ano no prefixo, entao o numero da
-- sequence NAO reseta por mes — apenas incrementa. Isso mantem
-- o mesmo comportamento da versao anterior.

-- 1. Cria a sequence (comeca em 1)
CREATE SEQUENCE IF NOT EXISTS public.service_order_short_seq
  START WITH 1
  INCREMENT BY 1
  NO MAXVALUE
  CACHE 1;

-- 2. Sincroniza a sequence com o maximo short_id existente
-- Isso garante que se ja existem OSs com short_id "OS-0626005",
-- a proxima vai ser "OS-0626006" e nao "OS-0626001" de novo.
DO $$
DECLARE
  max_num int := 0;
BEGIN
  SELECT COALESCE(MAX(
    CAST(substring(short_id FROM 7 FOR 4) AS int)
  ), 0)
  INTO max_num
  FROM public.service_orders
  WHERE short_id ~ '^OS-[0-9]{2}[0-9]{2}[0-9]{4}$'
    AND length(short_id) = 10;

  -- Garante que a sequence comeca depois do maximo existente
  EXECUTE format('ALTER SEQUENCE public.service_order_short_seq RESTART WITH %s', max_num + 1);
END $$;

-- 3. Recria a funcao set_short_id usando nextval (atomica)
CREATE OR REPLACE FUNCTION public.set_short_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  next_num int;
  yr text;
  mo text;
BEGIN
  -- nextval e' atomica — duas chamadas simultaneas sempre retornam
  -- numeros diferentes, sem race condition.
  next_num := nextval('public.service_order_short_seq');

  yr := to_char(now(), 'YY');
  mo := to_char(now(), 'MM');

  -- Formato: OS-MMyy-nnnn (10 chars)
  -- Exemplo: OS-0626001 (junho 2026, primeira OS)
  NEW.short_id := 'OS-' || mo || yr || lpad(next_num::text, 4, '0');
  RETURN NEW;
END;
$$;

-- 4. Verifica que a trigger ainda existe (foi criada na 0003)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_set_short_id'
  ) THEN
    CREATE TRIGGER trigger_set_short_id
    BEFORE INSERT ON public.service_orders
    FOR EACH ROW
    WHEN (NEW.short_id IS NULL)
    EXECUTE FUNCTION public.set_short_id();
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';