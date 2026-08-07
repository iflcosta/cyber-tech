-- ============================================================
-- 0028_service_order_payments.sql
-- ============================================================
--
-- payment_status pending/paid (0026) não cobria pagamento parcial —
-- caso real: cliente paga R$200 na entrega, resto depois. Precisa de
-- um registro por pagamento (valor, forma, data, quem recebeu), não
-- só um booleano — mesmo padrão de "ledger" já usado em
-- stock_movements e part_order_events em vez de guardar só um estado
-- final.

CREATE TABLE IF NOT EXISTS public.service_order_payments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id  uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  amount            numeric(10,2) NOT NULL CHECK (amount > 0),
  payment_method    text NOT NULL CHECK (payment_method IN ('cash', 'pix', 'card', 'transfer', 'other')),
  notes             text,
  author_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  paid_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_order_payments_os ON public.service_order_payments(service_order_id, paid_at DESC);

ALTER TABLE public.service_order_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view OS payments"
  ON public.service_order_payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can register OS payments"
  ON public.service_order_payments FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Only owners can delete OS payments"
  ON public.service_order_payments FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'owner')
  );

-- Sem UPDATE: pagamento registrado é imutável (corrige apagando e
-- registrando de novo, com o motivo em notes se precisar).

COMMENT ON TABLE public.service_order_payments IS 'Cada pagamento recebido numa OS — parcial ou total. Soma de amount vs o total da OS (mão de obra + peças) decide se payment_status é partial ou paid.';

-- payment_status ganha o estado intermediário.
ALTER TABLE public.service_orders DROP CONSTRAINT IF EXISTS service_orders_payment_status_check;
ALTER TABLE public.service_orders
  ADD CONSTRAINT service_orders_payment_status_check
  CHECK (payment_status IN ('pending', 'partial', 'paid'));

NOTIFY pgrst, 'reload schema';
