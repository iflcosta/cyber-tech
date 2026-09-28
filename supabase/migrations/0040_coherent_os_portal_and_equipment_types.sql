-- ============================================================================
-- MIGRATION 0040: Coerência do Portal de Status (/status) e Tipos de Equipamento
-- ============================================================================
-- 1. Remove sobrecarga ambígua de rpc_track_service_order e recria função única
--    com (p_query TEXT, p_phone TEXT DEFAULT NULL) que retorna found = true,
--    repair_notes, parts_total, parts_applied, timeline/events, etc.
-- 2. Normaliza a OS-2026-0003 (Smart Tank 517) para equipment_type = 'impressora' e equipment_brand = 'HP'.

DROP FUNCTION IF EXISTS public.rpc_track_service_order(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.rpc_track_service_order(TEXT);

CREATE OR REPLACE FUNCTION public.rpc_track_service_order(
  p_query TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_raw TEXT;
  v_clean_query TEXT;
  v_no_prefix TEXT;
  v_digits_only TEXT;
  v_order RECORD;
  v_events JSONB;
  v_parts JSONB;
  v_parts_total NUMERIC(12,2);
  v_customer_first_name TEXT;
BEGIN
  v_raw := COALESCE(NULLIF(BTRIM(p_query), ''), NULLIF(BTRIM(p_phone), ''), '');
  v_clean_query := BTRIM(REGEXP_REPLACE(v_raw, '^#', ''));
  v_no_prefix := BTRIM(REGEXP_REPLACE(v_clean_query, '^OS-?', '', 'i'));
  v_digits_only := REGEXP_REPLACE(v_clean_query, '\D', '', 'g');

  IF v_clean_query = '' THEN
    RETURN JSONB_BUILD_OBJECT('found', false);
  END IF;

  SELECT 
    so.id,
    so.os_number,
    so.short_id,
    so.status,
    so.payment_status,
    so.payment_method,
    so.equipment_type,
    so.equipment_brand,
    so.equipment_model,
    so.equipment_color,
    so.equipment_serial,
    so.reported_defect,
    so.repair_notes,
    so.accessories_in,
    so.entry_checklist,
    so.equipment_photos,
    so.estimated_value,
    so.labor_cost,
    so.created_at,
    so.updated_at,
    so.estimated_ready_at,
    so.delivered_at,
    c.name AS customer_full_name
  INTO v_order
  FROM public.service_orders so
  LEFT JOIN public.customers c ON c.id = so.customer_id
  WHERE 
    UPPER(so.short_id) = UPPER(v_clean_query)
    OR UPPER(so.short_id) = UPPER('OS-' || v_no_prefix)
    OR UPPER(so.os_number) = UPPER(v_clean_query)
    OR UPPER(so.os_number) = UPPER('OS-' || v_no_prefix)
    OR (v_digits_only <> '' AND LENGTH(v_digits_only) <= 6 AND so.os_number LIKE '%-' || LPAD(v_digits_only, 4, '0'))
    OR so.id::TEXT = v_clean_query
    OR (v_digits_only <> '' AND LENGTH(v_digits_only) >= 8 AND REGEXP_REPLACE(c.phone, '\D', '', 'g') LIKE '%' || v_digits_only || '%')
  ORDER BY so.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN JSONB_BUILD_OBJECT('found', false);
  END IF;

  v_customer_first_name := SPLIT_PART(BTRIM(COALESCE(v_order.customer_full_name, 'Cliente')), ' ', 1);

  -- Busca eventos da linha do tempo
  SELECT COALESCE(
    JSONB_AGG(
      JSONB_BUILD_OBJECT(
        'id', e.id,
        'event_type', e.event_type,
        'from_value', e.from_value,
        'to_value', e.to_value,
        'note', e.note,
        'payload', JSONB_BUILD_OBJECT(
          'from', e.from_value,
          'to', e.to_value,
          'note', e.note
        ),
        'created_at', e.created_at
      ) ORDER BY e.created_at DESC
    ),
    '[]'::JSONB
  )
  INTO v_events
  FROM public.service_order_events e
  WHERE e.service_order_id = v_order.id;

  -- Busca peças utilizadas na OS (stock_movements)
  SELECT 
    COALESCE(SUM(COALESCE(sm.total_amount, sm.unit_price * sm.quantity, 0)), 0),
    COALESCE(
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'id', sm.id,
          'name', COALESCE(si.name, 'Peça / Insumo'),
          'quantity', sm.quantity,
          'unit_price', sm.unit_price,
          'total_amount', COALESCE(sm.total_amount, sm.unit_price * sm.quantity, 0)
        ) ORDER BY sm.created_at ASC
      ),
      '[]'::JSONB
    )
  INTO v_parts_total, v_parts
  FROM public.stock_movements sm
  LEFT JOIN public.stock_items si ON si.id = sm.stock_item_id
  WHERE sm.service_order_id = v_order.id
    AND sm.movement_type IN ('out', 'sale');

  RETURN JSONB_BUILD_OBJECT(
    'found', true,
    'id', v_order.id,
    'os_number', v_order.os_number,
    'short_id', v_order.short_id,
    'status', v_order.status,
    'payment_status', COALESCE(v_order.payment_status, 'pending'),
    'payment_method', v_order.payment_method,
    'equipment_type', v_order.equipment_type,
    'equipment_brand', v_order.equipment_brand,
    'equipment_model', v_order.equipment_model,
    'equipment_color', v_order.equipment_color,
    'equipment_serial', v_order.equipment_serial,
    'reported_defect', v_order.reported_defect,
    'repair_notes', v_order.repair_notes,
    'accessories_in', v_order.accessories_in,
    'entry_checklist', COALESCE(v_order.entry_checklist, '{}'::JSONB),
    'equipment_photos', COALESCE(v_order.equipment_photos, '{}'::TEXT[]),
    'estimated_value', COALESCE(v_order.estimated_value, 0),
    'labor_cost', COALESCE(v_order.labor_cost, 0),
    'parts_total', COALESCE(v_parts_total, 0),
    'parts_applied', v_parts,
    'parts_used', v_parts,
    'created_at', v_order.created_at,
    'updated_at', v_order.updated_at,
    'estimated_ready_at', v_order.estimated_ready_at,
    'delivered_at', v_order.delivered_at,
    'customer_first_name', v_customer_first_name,
    'timeline', v_events,
    'events', v_events
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_track_service_order(TEXT, TEXT) TO anon, authenticated;

-- Normaliza OS-2026-0003 para usar o tipo 'impressora' e marca 'HP'
UPDATE public.service_orders
SET
  equipment_type = 'impressora',
  equipment_brand = 'HP'
WHERE os_number = 'OS-2026-0003'
  AND (equipment_brand = 'Impressora · HP' OR equipment_type = 'outro');
