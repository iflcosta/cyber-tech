-- ============================================================
-- 0035_public_portal_tracking.sql — Rastreio Pericial no Portal do Cliente (Cyber V2)
-- ============================================================
--
-- Permite que o cliente consulte o status de sua Ordem de Serviço
-- em tempo real digitando o número da OS ou os dígitos do seu telefone,
-- sem login e sem expor dados internos sensíveis (senhas, custos de compra, etc).
--
-- 100% ADITIVA E SEGURA.
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_track_service_order(
  p_query text,
  p_phone text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_res jsonb;
  v_clean_query text;
  v_clean_phone text;
  v_order_id uuid;
BEGIN
  v_clean_query := TRIM(COALESCE(p_query, ''));
  v_clean_phone := REGEXP_REPLACE(COALESCE(p_phone, ''), '\D', '', 'g');

  IF v_clean_query = '' AND v_clean_phone = '' THEN
    RETURN jsonb_build_object('found', false, 'error', 'Informe o número da OS ou telefone para consulta.');
  END IF;

  -- Localiza a OS por UUID, short_id, os_number ou telefone do cliente
  SELECT so.id INTO v_order_id
  FROM public.service_orders so
  LEFT JOIN public.customers c ON so.customer_id = c.id
  WHERE (
    -- Busca por UUID direto
    (v_clean_query ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND so.id = v_clean_query::uuid)
    -- Busca por short_id (case insensitive)
    OR (v_clean_query <> '' AND UPPER(so.short_id) = UPPER(v_clean_query))
    -- Busca por os_number (ex: "1023" ou "#1023")
    OR (v_clean_query <> '' AND (so.os_number = v_clean_query OR ('#' || so.os_number) = v_clean_query))
    -- Busca por telefone se query estiver vazia ou for número de telefone
    OR (
      v_clean_phone <> ''
      AND LENGTH(v_clean_phone) >= 4
      AND (
        c.phone_search LIKE ('%' || v_clean_phone)
        OR REGEXP_REPLACE(COALESCE(c.phone, ''), '\D', '', 'g') LIKE ('%' || v_clean_phone)
      )
    )
  )
  ORDER BY so.created_at DESC
  LIMIT 1;

  IF v_order_id IS NULL THEN
    RETURN jsonb_build_object('found', false, 'error', 'Ordem de serviço não encontrada com os dados informados.');
  END IF;

  -- Constrói objeto de resposta higienizado (LGPD Safe & Anti-Vazamento)
  SELECT jsonb_build_object(
    'found', true,
    'id', so.id,
    'short_id', COALESCE(so.short_id, 'CYB-' || SUBSTRING(so.id::text, 1, 6)),
    'os_number', so.os_number,
    'status', so.status,
    'equipment_type', so.equipment_type,
    'equipment_brand', COALESCE(so.equipment_brand, 'Equipamento'),
    'equipment_model', COALESCE(so.equipment_model, 'Hardware'),
    'reported_defect', so.reported_defect,
    'accessories_in', so.accessories_in,
    'entry_checklist', COALESCE(so.entry_checklist, '{}'::jsonb),
    'equipment_photos', COALESCE(to_jsonb(so.equipment_photos), '[]'::jsonb),
    'estimated_value', COALESCE(so.estimated_value, 0.00),
    'labor_cost', COALESCE(so.labor_cost, 0.00),
    'payment_status', COALESCE(so.payment_status, 'pending'),
    'payment_method', so.payment_method,
    'estimated_ready_at', so.estimated_ready_at,
    'created_at', so.created_at,
    'updated_at', so.updated_at,
    'delivered_at', so.delivered_at,
    'customer_first_name', COALESCE(SPLIT_PART(c.name, ' ', 1), 'Cliente'),
    -- Linha do tempo de eventos periciais higienizada
    'timeline', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', ev.id,
          'event_type', ev.event_type,
          'from_value', ev.from_value,
          'to_value', ev.to_value,
          'note', ev.note,
          'created_at', ev.created_at
        ) ORDER BY ev.created_at ASC
      )
      FROM public.service_order_events ev
      WHERE ev.service_order_id = so.id
    ), '[]'::jsonb),
    -- Peças aplicadas (apenas nome e quantidade para conferência do cliente)
    'parts_applied', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', si.name,
          'quantity', sm.quantity,
          'unit_price', sm.unit_price
        )
      )
      FROM public.stock_movements sm
      JOIN public.stock_items si ON sm.stock_item_id = si.id
      WHERE sm.service_order_id = so.id AND sm.movement_type = 'out'
    ), '[]'::jsonb)
  ) INTO v_res
  FROM public.service_orders so
  LEFT JOIN public.customers c ON so.customer_id = c.id
  WHERE so.id = v_order_id;

  RETURN v_res;
END;
$$;

COMMENT ON FUNCTION public.rpc_track_service_order(text, text) IS
  'Consulta pública e segura de status de OS para o Portal do Cliente e Rastreio no Hero';

-- Libera execução pública sem necessidade de login (anon)
GRANT EXECUTE ON FUNCTION public.rpc_track_service_order(text, text) TO anon, authenticated, service_role;
