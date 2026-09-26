-- ============================================================
-- 0037_harden_stock_concurrency.sql
-- ============================================================
-- Blindagem de Concorrência (Race Condition) no Estoque
-- Aplica bloqueio de linha FOR UPDATE e mensagens de erro amigáveis
-- para concorrência simultânea entre Balcão (PDV) e Bancada (OS).

CREATE OR REPLACE FUNCTION public.create_sale(
  p_items jsonb,
  p_payment_method text,
  p_customer_name text DEFAULT NULL::text,
  p_customer_phone text DEFAULT NULL::text,
  p_customer_id uuid DEFAULT NULL::uuid,
  p_discount numeric DEFAULT 0,
  p_notes text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_sale_id uuid;
  v_sale_number text;
  v_item record;
  v_item_subtotal numeric;
  v_total numeric := 0;
  v_item_name text;
  v_current_stock int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação necessária' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Carrinho vazio';
  END IF;

  -- 1. Validação com Row-Level Lock (FOR UPDATE) para serializar concorrência
  FOR v_item IN
    SELECT
      (item->>'stock_item_id')::uuid AS stock_item_id,
      (item->>'quantity')::int AS quantity,
      (item->>'unit_price')::numeric AS unit_price
    FROM jsonb_array_elements(p_items) AS item
  LOOP
    IF v_item.quantity <= 0 THEN
      RAISE EXCEPTION 'Quantidade deve ser maior que zero';
    END IF;

    -- Trava atômica da linha do item de estoque
    SELECT name, current_stock
    INTO v_item_name, v_current_stock
    FROM public.stock_items
    WHERE id = v_item.stock_item_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Item de estoque ID % não encontrado', v_item.stock_item_id;
    END IF;

    IF v_item.quantity > v_current_stock THEN
      RAISE EXCEPTION 'Estoque insuficiente para "%": disponível % un, solicitado % un.',
        v_item_name, v_current_stock, v_item.quantity;
    END IF;

    v_total := v_total + (v_item.quantity * v_item.unit_price);
  END LOOP;

  v_total := GREATEST(0, v_total - coalesce(p_discount, 0));

  -- 2. Cria a venda
  INSERT INTO public.sales (
    operator_id, customer_name, customer_phone, customer_id,
    payment_method, total_amount, discount, notes
  ) VALUES (
    auth.uid(), p_customer_name, p_customer_phone, p_customer_id,
    p_payment_method, v_total, coalesce(p_discount, 0), p_notes
  )
  RETURNING id, sale_number INTO v_sale_id, v_sale_number;

  -- 3. Registra os itens da venda e movimenta o estoque
  FOR v_item IN
    SELECT
      (item->>'stock_item_id')::uuid AS stock_item_id,
      (item->>'quantity')::int AS quantity,
      (item->>'unit_price')::numeric AS unit_price
    FROM jsonb_array_elements(p_items) AS item
  LOOP
    v_item_subtotal := v_item.quantity * v_item.unit_price;

    INSERT INTO public.sale_items (sale_id, stock_item_id, item_name, quantity, unit_price, subtotal)
    SELECT v_sale_id, v_item.stock_item_id, si.name,
           v_item.quantity, v_item.unit_price, v_item_subtotal
    FROM public.stock_items si
    WHERE si.id = v_item.stock_item_id;

    INSERT INTO public.stock_movements (
      stock_item_id, movement_type, quantity, unit_price, total_amount, reference, author_id
    ) VALUES (
      v_item.stock_item_id, 'sale', v_item.quantity, v_item.unit_price, v_item_subtotal,
      v_sale_number, auth.uid()
    );
  END LOOP;

  RETURN v_sale_id;
END;
$function$;
