-- 0041_fix_create_sale_operator_id.sql
-- Garante retrocompatibilidade para operator_id e corrige a RPC create_sale

-- 1. Adicionar operator_id na tabela sales apontando para profiles(id)
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS operator_id uuid REFERENCES public.profiles(id);

-- 2. Preencher operator_id com author_id caso esteja nulo
UPDATE public.sales
SET operator_id = author_id
WHERE operator_id IS NULL AND author_id IS NOT NULL;

-- 3. Atualizar a RPC create_sale corrigindo as colunas de inserção (subtotal, discount, total, author_id, operator_id)
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
  v_subtotal numeric := 0;
  v_total numeric;
  v_item_subtotal numeric;
  v_item_name text;
  v_current_stock int;
BEGIN
  IF auth.uid() IS NULL OR public.current_user_role() IS NULL THEN
    RAISE EXCEPTION 'Autenticação necessária ou perfil inativo' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_payment_method NOT IN ('cash', 'pix', 'card', 'transfer', 'other') THEN
    RAISE EXCEPTION 'Forma de pagamento invalida: %', p_payment_method;
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'A venda precisa ter pelo menos 1 item';
  END IF;

  IF COALESCE(p_discount, 0) < 0 THEN
    RAISE EXCEPTION 'Desconto nao pode ser negativo (%)', p_discount;
  END IF;

  IF p_customer_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.customers WHERE id = p_customer_id
  ) THEN
    RAISE EXCEPTION 'Cliente % não encontrado', p_customer_id;
  END IF;

  -- 1. Validação com Row-Level Lock (FOR UPDATE) para serializar concorrência
  FOR v_item IN
    SELECT
      (item->>'stock_item_id')::uuid AS stock_item_id,
      (item->>'quantity')::int AS quantity,
      (item->>'unit_price')::numeric AS unit_price
    FROM jsonb_array_elements(p_items) AS item
  LOOP
    IF v_item.quantity IS NULL OR v_item.quantity <= 0 THEN
      RAISE EXCEPTION 'Quantidade invalida no carrinho: %', v_item.quantity;
    END IF;
    IF v_item.unit_price IS NULL OR v_item.unit_price < 0 THEN
      RAISE EXCEPTION 'Preco unitario invalido no carrinho: %', v_item.unit_price;
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

    v_item_subtotal := v_item.quantity * v_item.unit_price;
    v_subtotal := v_subtotal + v_item_subtotal;
  END LOOP;

  v_total := GREATEST(0, v_subtotal - COALESCE(p_discount, 0));

  -- 2. Cria a venda gravando tanto author_id quanto operator_id, subtotal, discount e total
  INSERT INTO public.sales (
    subtotal, discount, total, payment_method,
    customer_name, customer_phone, customer_id, notes, author_id, operator_id
  )
  VALUES (
    v_subtotal, COALESCE(p_discount, 0), v_total, p_payment_method,
    NULLIF(trim(p_customer_name), ''), NULLIF(trim(p_customer_phone), ''), p_customer_id,
    NULLIF(trim(p_notes), ''), auth.uid(), auth.uid()
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

REVOKE EXECUTE ON FUNCTION public.create_sale(jsonb, text, text, text, uuid, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_sale(jsonb, text, text, text, uuid, numeric, text) TO authenticated;
