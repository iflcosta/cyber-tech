-- ============================================================
-- 0009_short_id_format.sql — short_id formato MMYYnnnn
-- Rodar no SQL Editor do painel do Supabase. Uma unica vez.
-- ============================================================
--
-- Antes: OS-0001, OS-0002, ... (sequencial simples)
-- Depois: OS-0626001, OS-0726002, ... (mes + ano + sequencial)
--
-- "06" = mes de criacao (zero-padded)
-- "26" = ano de criacao (2 digitos)
-- "001" = sequencial dentro daquele mes
--
-- Vantagens:
-- - Sabe quando a OS foi aberta so' olhando o numero
-- - Nao confunde OS de meses diferentes
-- - Padrao usado em muitas oficinas no Brasil
--
-- O sequencial reseta a cada mes? NAO — mantem global por ordem de
-- criacao (mais simples, evita buracos quando uma trigger roda fora
-- de ordem). O mes+ano ja' da a referencia temporal.

-- 1. Recria a funcao set_short_id (trigger original)
CREATE OR REPLACE FUNCTION public.set_short_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  next_num int;
  yr text;
  mo text;
BEGIN
  -- Pega ano e mes do momento da insercao
  yr := to_char(now(), 'YY');
  mo := to_char(now(), 'MM');

  -- Pega o proximo numero global (continuo, nao reseta por mes)
  -- Filtra por short_id com formato MMYY pra evitar colisao com
  -- OSs antigas (OS-0001 etc).
  SELECT COALESCE(MAX(
    CAST(substring(short_id FROM 7 FOR 4) AS int)
  ), 0) + 1
  INTO next_num
  FROM public.service_orders
  WHERE short_id LIKE '__' || yr || '%'
    AND length(short_id) = 10;  -- formato MMYYnnnn

  NEW.short_id := 'OS-' || mo || yr || lpad(next_num::text, 4, '0');
  RETURN NEW;
END;
$$;

-- Trigger ja existe (criado na 0003), nao precisa recriar

-- 2. Backfill das OSs existentes (formato antigo -> novo)
-- Regra: usa o created_at de cada OS pra gerar o novo short_id
DO $$
DECLARE
  rec record;
  next_num int;
  yr text;
  mo text;
  prefix text;
BEGIN
  FOR rec IN
    SELECT id, short_id, created_at
    FROM public.service_orders
    WHERE short_id ~ '^OS-[0-9]{4}$'  -- formato antigo: OS-0001
    ORDER BY created_at
  LOOP
    yr := to_char(rec.created_at, 'YY');
    mo := to_char(rec.created_at, 'MM');
    prefix := 'OS-' || mo || yr;

    -- Pega o proximo numero desse par (mes+ano)
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

-- 3. Garante unicidade (caso ja tenha colisao)
-- (o backfill acima e' deterministico, mas so' por seguranca)
-- Nada a fazer — o index UNIQUE ja existe.

NOTIFY pgrst, 'reload schema';