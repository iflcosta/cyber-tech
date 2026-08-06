-- ============================================================
-- 0017_stock_movement_os_fk.sql — vínculo real entre estoque e OS
-- ============================================================
--
-- Contexto (2026-08-06): "peças usadas" na tela da OS casava
-- stock_movements.reference com service_orders.os_number por
-- IGUALDADE DE TEXTO — sem FK, dependia do técnico digitar o
-- número certinho. O short_id já mudou de formato 3x no histórico
-- (migrations 0003, 0009, 0010); qualquer mudança futura quebraria
-- esse vínculo silenciosamente.
--
-- Esta migration adiciona uma FK de verdade. `reference` continua
-- existindo pra outros usos (nº de nota fiscal na entrada, etc) —
-- não é removido, só deixa de ser o único jeito de linkar a uma OS.

ALTER TABLE public.stock_movements
  ADD COLUMN IF NOT EXISTS service_order_id uuid REFERENCES public.service_orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_stock_movements_service_order
  ON public.stock_movements(service_order_id);

COMMENT ON COLUMN public.stock_movements.service_order_id IS 'Vínculo real (FK) com a OS que consumiu essa peça de estoque. Preferir isto a comparar reference com os_number.';
COMMENT ON COLUMN public.stock_movements.reference IS 'Texto livre pra outros usos (nº de nota fiscal na entrada, etc). Pra vincular a uma OS, usar service_order_id.';

NOTIFY pgrst, 'reload schema';
