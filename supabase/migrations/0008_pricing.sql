-- ============================================================
-- 0008_pricing.sql — campos de preco/PIX (sem integracao gateway)
-- Rodar no SQL Editor do painel do Supabase. Uma unica vez.
-- ============================================================
--
-- O AGENTS.md original diz 'sem financeiro no MVP' (comissao, valor,
-- pagamento -> fase 2). Mas o Iago precisa urgentemente de um jeito
-- rapido de informar o valor ao cliente (cobrar antes de entregar).
--
-- Adiciona 3 campos opcionais:
--   - service_orders.price_value      (numeric, valor do servico)
--   - service_orders.price_status     (pending | paid)
--   - service_orders.pix_receipt_url  (text, link do comprovante opcional)
--
-- Nao ha' integracao com gateway. O fluxo e' manual:
--   1. Tecnico coloca o valor no detalhe da OS
--   2. Botao 'Cobrar via PIX' mostra a chave PIX (env var)
--   3. Cliente paga e manda comprovante no WhatsApp
--   4. Tecnico marca como 'pago' (botao)
--   5. Status pode ir pra 'ready' -> 'delivered'

ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS price_value numeric(10,2) NULL,
  ADD COLUMN IF NOT EXISTS price_status text NULL
    CHECK (price_status IS NULL OR price_status IN ('pending', 'paid')),
  ADD COLUMN IF NOT EXISTS pix_receipt_url text NULL;

NOTIFY pgrst, 'reload schema';
