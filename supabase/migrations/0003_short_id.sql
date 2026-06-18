-- ============================================================
-- 0003_short_id.sql — ID curto sequencial pra etiqueta física
-- Formato: OS-0001, OS-0002, ... (zfill 4 dígitos)
-- Rodar no SQL Editor do painel do Supabase. Uma unica vez.
-- Apos rodar: cada OS tera short_id preenchido, e novas OSs
-- receberao o proximo sequencial automaticamente.
-- ============================================================

-- 1. Nova sequence (independente da service_order_seq que gera os_number)
CREATE SEQUENCE IF NOT EXISTS public.service_order_short_seq START 1;

-- 2. Coluna short_id (NULL permitido durante o backfill)
ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS short_id text;

-- 3. Backfill: preenche OSs existentes em ordem cronologica
--    Garante que a primeira OS cadastrada seja OS-0001, a segunda OS-0002, etc.
--    Roda ANTES de criar o indice UNIQUE pra evitar conflito.
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT id FROM public.service_orders
    WHERE short_id IS NULL
    ORDER BY created_at ASC, id ASC
  LOOP
    UPDATE public.service_orders
    SET short_id = 'OS-' || lpad(nextval('public.service_order_short_seq')::text, 4, '0')
    WHERE id = rec.id;
  END LOOP;
END;
$$;

-- 4. Sincroniza a sequence com o maior short_id ja usado
--    (caso o backfill tenha sido parcial ou rodado em duas etapas)
SELECT setval(
  'public.service_order_short_seq',
  GREATEST(
    COALESCE(
      (SELECT MAX(
        CAST(regexp_replace(short_id, '^OS-', '', 'i') AS integer)
      ) FROM public.service_orders WHERE short_id ~ '^OS-[0-9]+$'),
      0
    ),
    1
  )
);

-- 5. A partir de agora, short_id e NOT NULL + UNIQUE
ALTER TABLE public.service_orders
  ALTER COLUMN short_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_service_orders_short_id
  ON public.service_orders(short_id);

-- 6. Trigger: gera short_id no INSERT (sequencial, zfill 4)
CREATE OR REPLACE FUNCTION public.set_short_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.short_id IS NULL THEN
    NEW.short_id := 'OS-' || lpad(nextval('public.service_order_short_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_short_id ON public.service_orders;
CREATE TRIGGER trg_short_id
  BEFORE INSERT ON public.service_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_short_id();

-- 7. Documentacao
COMMENT ON COLUMN public.service_orders.short_id IS
  'ID curto sequencial humano-legivel: OS-0001, OS-0002, ... Usado na etiqueta fisica colada no aparelho e na busca rapida. Independente do os_number (OS-YYYY-NNNN) que continua existindo pra auditoria.';

-- 8. View atualizada: tambem retorna short_id (ja retorna via SELECT *, entao nada a fazer)
--    Mas a busca por short_id precisa de indice — ja criado no passo 5.
