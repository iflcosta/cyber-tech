-- ============================================================
-- 0026_service_orders_payment_status.sql
-- ============================================================
--
-- OS não sabia se tinha sido paga — recibo mostra o total, mas nada
-- registrava "pago, em PIX, nesta data". Caso real: computador
-- entregue numa farmácia pra avaliação, cliente só paga no dia
-- seguinte se ficar com o produto — hoje o sistema não tem onde
-- guardar "entregue mas ainda não pago", então esse controle vivia só
-- na cabeça de quem entregou (ou no papel do termo de recebimento).
--
-- Fica record="pending" por padrão em toda OS nova. Sem gatilho
-- automático nenhum ligando a entrega ao pagamento — são eventos
-- independentes de propósito (o caso da farmácia é exatamente
-- "entregue" e "pago" acontecendo em dias diferentes).

ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid')),
  ADD COLUMN IF NOT EXISTS payment_method text
    CHECK (payment_method IN ('cash', 'pix', 'card', 'transfer', 'other')),
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_service_orders_payment_status ON public.service_orders(payment_status);

COMMENT ON COLUMN public.service_orders.payment_status IS 'pending (padrão) | paid — independente do status de entrega. Existe porque produto pode sair da loja antes do pagamento (ex: avaliação em outra loja, pagamento no dia seguinte).';

NOTIFY pgrst, 'reload schema';
