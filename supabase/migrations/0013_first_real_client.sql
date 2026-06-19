-- ============================================================
-- 0013_first_real_client.sql — RESET TOTAL + sequence atomica
-- Rodar no SQL Editor do painel do Supabase. Uma unica vez.
-- ============================================================
--
-- Momento: primeira OS real de cliente. Ate agora so' tinha
-- OSs de teste que ficaram com dados baguncados (duplicatas
-- de short_id por race condition na funcao antiga).
--
-- O que essa migration faz:
--   1. Apaga TODAS as OSs de teste (incluindo as que tem
--      short_id duplicado)
--   2. Apaga TODOS os eventos da timeline
--   3. Reseta a sequence pra comecar do 1
--   4. Recria a funcao set_short_id usando nextval (atomica,
--      sem race condition)
--   5. Garante que a trigger esta' ativa
--
-- Apos rodar, a primeira OS real sera:
--   short_id = "OS-0626001" (junho 2026, primeira do mes)
--   os_number = "OS-2026-0001" (legado, gerado pela trigger antiga)
--
-- Race condition resolvida: agora pode cadastrar 2 OSs quase
-- ao mesmo tempo (2 tecnicos diferentes) que cada uma recebe
-- um numero de sequence diferente, sem conflito.

-- 1. Apaga dados de teste
DELETE FROM public.service_order_events;
DELETE FROM public.service_orders;

-- 2. Cria a sequence se nao existir (idempotente)
CREATE SEQUENCE IF NOT EXISTS public.service_order_short_seq
  START WITH 1
  INCREMENT BY 1
  NO MAXVALUE
  CACHE 1;

-- 3. Reseta a sequence pra comecar do 1
ALTER SEQUENCE public.service_order_short_seq RESTART WITH 1;

-- 4. Recria a funcao set_short_id usando nextval (atomica)
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
  -- numeros diferentes. Resolve a race condition do MAX(substring).
  next_num := nextval('public.service_order_short_seq');

  yr := to_char(now(), 'YY');
  mo := to_char(now(), 'MM');

  -- Formato: OS-MMyy-nnnn (10 chars)
  -- Exemplo: OS-0626001 (junho 2026, primeira OS)
  NEW.short_id := 'OS-' || mo || yr || lpad(next_num::text, 4, '0');
  RETURN NEW;
END;
$$;

-- 5. Garante que a trigger existe (foi criada na 0003, mas confirma)
DROP TRIGGER IF EXISTS trigger_set_short_id ON public.service_orders;
CREATE TRIGGER trigger_set_short_id
  BEFORE INSERT ON public.service_orders
  FOR EACH ROW
  WHEN (NEW.short_id IS NULL)
  EXECUTE FUNCTION public.set_short_id();

NOTIFY pgrst, 'reload schema';