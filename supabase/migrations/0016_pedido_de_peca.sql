-- ============================================================
-- 0016_pedido_de_peca.sql — módulo de Pedido de Peça (fornecedores)
-- ============================================================
--
-- Contexto (2026-08-06): a loja não tem estoque de peça de conserto
-- (tela, bateria, etc — só estoque de revenda: cabo, RAM, SSD...).
-- Peça de conserto é sempre encomendada pontualmente a um fornecedor
-- quando surge uma OS que precisa dela. Faltava rastreabilidade
-- dessas encomendas — em especial das devoluções/trocas, que
-- geraram uma cobrança indevida de um fornecedor por falta de
-- registro de que a peça tinha sido devolvida.
--
-- Modelo: 1 registro por encomenda ("preciso de uma tela pra
-- resolver o problema do cliente X"), com um pipeline CÍCLICO — não
-- linear — porque troca não é um pedido novo, é a mesma encomenda
-- indo e voltando até resolver. Ver AGENTS.md / conversa do reboot
-- pra desenho completo.
--
--   PEDIDO → RECEBIDO → APLICADO (fim)
--                     → DEVOLUÇÃO SINALIZADA (motivo obrigatório)
--                           → DEVOLVIDO (fim, sem troca)
--                           → AGUARDANDO TROCA → volta pra RECEBIDO
--                             (reposição chega, mesmo registro)
--                     → CANCELADO (a qualquer momento antes de aplicado)
--
-- Prova de devolução/troca = o recibo físico assinado pelo motoboy
-- do fornecedor (dupla via). O sistema não pede foto — só registra
-- quem confirmou cada etapa e quando (timeline), complementando o
-- papel físico.

-- 1. Tabela suppliers (fornecedores)
CREATE TABLE IF NOT EXISTS public.suppliers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  phone       text,
  notes       text,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view suppliers"
  ON public.suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create suppliers"
  ON public.suppliers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update suppliers"
  ON public.suppliers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Only owners can delete suppliers"
  ON public.suppliers FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'owner')
  );

COMMENT ON TABLE public.suppliers IS 'Fornecedores de peça de conserto (tela, bateria, etc). Separado do estoque de revenda.';

-- 2. Tabela part_orders (o pedido de peça em si)
CREATE TABLE IF NOT EXISTS public.part_orders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_description  text NOT NULL,
  part_variant      text,
  supplier_id       uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  part_value        numeric(10,2) NOT NULL CHECK (part_value >= 0),
  service_order_id  uuid REFERENCES public.service_orders(id) ON DELETE SET NULL,
  context_note      text,
  status            text NOT NULL DEFAULT 'ordered' CHECK (status IN (
    'ordered', 'received', 'applied', 'return_pending',
    'returned', 'awaiting_exchange', 'cancelled'
  )),
  return_reason     text CHECK (return_reason IN (
    'not_the_issue', 'defective', 'wrong_item', 'customer_cancelled'
  )),
  requested_by      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_part_orders_status ON public.part_orders(status);
CREATE INDEX IF NOT EXISTS idx_part_orders_supplier ON public.part_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_part_orders_service_order ON public.part_orders(service_order_id);
CREATE INDEX IF NOT EXISTS idx_part_orders_created_at_desc ON public.part_orders(created_at DESC);

ALTER TABLE public.part_orders ENABLE ROW LEVEL SECURITY;

-- Regra igual à de service_orders (0002): qualquer autenticado vê e
-- edita qualquer pedido — quem fala com o fornecedor é quem
-- registra, sem depender de um único intermediário.
CREATE POLICY "Authenticated users can view part orders"
  ON public.part_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create part orders"
  ON public.part_orders FOR INSERT
  TO authenticated
  WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Authenticated users can update part orders"
  ON public.part_orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Only owners can delete part orders"
  ON public.part_orders FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'owner')
  );

COMMENT ON TABLE public.part_orders IS 'Encomenda pontual de peça de conserto a um fornecedor, vinculada opcionalmente a uma OS. Pipeline cíclico (troca reaproveita o mesmo registro).';
COMMENT ON COLUMN public.part_orders.service_order_id IS 'Opcional — muitos pedidos são para lojistas parceiros e não geram OS. Nesses casos usar context_note.';
COMMENT ON COLUMN public.part_orders.context_note IS 'Texto livre pra identificar o pedido quando não há OS (ex: "Loja TechFix — cliente Marcos").';
COMMENT ON COLUMN public.part_orders.status IS 'ordered→received→applied(fim) | received→return_pending→returned(fim) | return_pending→awaiting_exchange→received (troca, mesmo registro)';

-- 3. Tabela part_order_events (timeline imutável)
CREATE TABLE IF NOT EXISTS public.part_order_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_order_id  uuid NOT NULL REFERENCES public.part_orders(id) ON DELETE CASCADE,
  event_type     text NOT NULL CHECK (event_type IN (
    'created', 'received', 'applied', 'return_signaled', 'returned',
    'exchange_awaited', 'exchange_received', 'value_adjusted',
    'note_added', 'cancelled'
  )),
  from_value     text,
  to_value       text,
  note           text,
  author_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_part_order_events_order_created
  ON public.part_order_events(part_order_id, created_at DESC);

ALTER TABLE public.part_order_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view part order events"
  ON public.part_order_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create part order events"
  ON public.part_order_events FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

-- Sem UPDATE/DELETE — eventos são imutáveis (audit trail), igual
-- service_order_events.

COMMENT ON TABLE public.part_order_events IS 'Linha do tempo imutável de cada pedido de peça — quem confirmou o quê e quando. Complementa (não substitui) o recibo físico do fornecedor.';

-- 4. Trigger: tocar updated_at (reaproveita a função já criada em 0001)
DROP TRIGGER IF EXISTS trg_part_orders_touch ON public.part_orders;
CREATE TRIGGER trg_part_orders_touch
  BEFORE UPDATE ON public.part_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

-- 5. View: pedidos com devolução sinalizada há tempo (alerta interno)
CREATE OR REPLACE VIEW public.part_orders_pending_return AS
SELECT
  po.*,
  s.name AS supplier_name,
  EXTRACT(DAY FROM (now() - po.updated_at))::int AS days_since_signaled
FROM public.part_orders po
JOIN public.suppliers s ON s.id = po.supplier_id
WHERE po.status = 'return_pending';

GRANT SELECT ON public.part_orders_pending_return TO authenticated;

COMMENT ON VIEW public.part_orders_pending_return IS 'Peças sinalizadas pra devolver e ainda não confirmadas. Frontend marca badge se days_since_signaled >= 5 (risco de esquecer na bancada).';

NOTIFY pgrst, 'reload schema';
