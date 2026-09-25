-- ============================================================
-- 0035_allow_custom_equipment_type.sql
-- Permite especificar qual é o aparelho quando o tipo selecionado
-- for "Outro" (ex: "GPS", "Monitor", "Videogame", "Impressora"),
-- mantendo os tipos padrão ('computador', 'notebook', 'celular', 'tablet', 'outro').
-- Também sincroniza labor_cost em OSs que tinham apenas estimated_value.
-- ============================================================

ALTER TABLE public.service_orders
  DROP CONSTRAINT IF EXISTS service_orders_equipment_type_check;

ALTER TABLE public.service_orders
  ADD CONSTRAINT service_orders_equipment_type_check
  CHECK (length(trim(equipment_type)) > 0);

UPDATE public.service_orders so
SET labor_cost = GREATEST(0, so.estimated_value - COALESCE((
  SELECT SUM(sm.total_amount)
  FROM public.stock_movements sm
  WHERE sm.service_order_id = so.id
    AND sm.movement_type IN ('out', 'sale')
), 0))
WHERE COALESCE(so.labor_cost, 0) = 0
  AND COALESCE(so.estimated_value, 0) > 0;
