-- ============================================================================
-- 0036_audit_security_and_integrity.sql
-- Hardening de Segurança, RBAC (active=true), Validação em RPCs, Ajuste de
-- Inventário Bidirecional e Higienização de Triggers/Storage
-- ============================================================================

-- 1. Funções de RBAC: exigir active = true para qualquer permissão no banco
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role FROM public.profiles WHERE id = auth.uid() AND active = true;
$function$;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(public.current_user_role() = 'owner', false);
$function$;

CREATE OR REPLACE FUNCTION public.can_delete()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT can_delete FROM public.profiles WHERE id = auth.uid() AND active = true),
    false
  );
$function$;

-- 2. Permitir ajuste de estoque (movement_type = 'adjust') positivo OU negativo
ALTER TABLE public.stock_movements
  DROP CONSTRAINT IF EXISTS stock_movements_quantity_check;

ALTER TABLE public.stock_movements
  ADD CONSTRAINT stock_movements_quantity_check
  CHECK (
    (movement_type = 'adjust' AND quantity <> 0)
    OR (movement_type <> 'adjust' AND quantity > 0)
  );

CREATE OR REPLACE FUNCTION public.fn_update_stock_on_movement()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  current_qty int;
BEGIN
  SELECT current_stock INTO current_qty
  FROM public.stock_items
  WHERE id = NEW.stock_item_id
  FOR UPDATE;

  IF current_qty IS NULL THEN
    RAISE EXCEPTION 'Item de estoque % nao encontrado', NEW.stock_item_id;
  END IF;

  IF NEW.movement_type IN ('out', 'sale') THEN
    IF current_qty < NEW.quantity THEN
      RAISE EXCEPTION 'Estoque insuficiente: item tem % unidades, tentativa de saida de %',
        current_qty, NEW.quantity
        USING ERRCODE = 'check_violation';
    END IF;
    UPDATE public.stock_items
      SET current_stock = current_stock - NEW.quantity,
          updated_at = now()
      WHERE id = NEW.stock_item_id;
  ELSIF NEW.movement_type = 'in' THEN
    UPDATE public.stock_items
      SET current_stock = current_stock + NEW.quantity,
          updated_at = now()
      WHERE id = NEW.stock_item_id;
  ELSIF NEW.movement_type = 'adjust' THEN
    IF current_qty + NEW.quantity < 0 THEN
      RAISE EXCEPTION 'Ajuste invalido: estoque resultante ficaria negativo (% + %)',
        current_qty, NEW.quantity
        USING ERRCODE = 'check_violation';
    END IF;
    UPDATE public.stock_items
      SET current_stock = current_qty + NEW.quantity,
          updated_at = now()
      WHERE id = NEW.stock_item_id;
  END IF;

  RETURN NEW;
END;
$function$;

-- 3. Hardening da RPC create_sale (validação de perfil ativo, itens, quantidades e desconto)
CREATE OR REPLACE FUNCTION public.create_sale(
  p_items jsonb,
  p_payment_method text,
  p_customer_name text DEFAULT NULL::text,
  p_customer_phone text DEFAULT NULL::text,
  p_discount numeric DEFAULT 0,
  p_notes text DEFAULT NULL::text,
  p_customer_id uuid DEFAULT NULL::uuid
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
    IF NOT EXISTS (SELECT 1 FROM public.stock_items WHERE id = v_item.stock_item_id) THEN
      RAISE EXCEPTION 'Item de estoque % nao encontrado', v_item.stock_item_id;
    END IF;
    v_item_subtotal := v_item.quantity * v_item.unit_price;
    v_subtotal := v_subtotal + v_item_subtotal;
  END LOOP;

  v_total := v_subtotal - COALESCE(p_discount, 0);
  IF v_total < 0 THEN
    RAISE EXCEPTION 'Desconto (%) maior que subtotal (%)', p_discount, v_subtotal;
  END IF;

  INSERT INTO public.sales (
    subtotal, discount, total, payment_method,
    customer_name, customer_phone, customer_id, notes, author_id
  )
  VALUES (
    v_subtotal, COALESCE(p_discount, 0), v_total, p_payment_method,
    NULLIF(trim(p_customer_name), ''), NULLIF(trim(p_customer_phone), ''), p_customer_id,
    NULLIF(trim(p_notes), ''), auth.uid()
  )
  RETURNING id, sale_number INTO v_sale_id, v_sale_number;

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

REVOKE EXECUTE ON FUNCTION public.create_sale(jsonb, text, text, text, numeric, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_sale(jsonb, text, text, text, numeric, text, uuid) TO authenticated;

-- 4. Remover trigger duplicado trg_short_id (mantendo trigger_set_short_id)
DROP TRIGGER IF EXISTS trg_short_id ON public.service_orders;

-- 5. Restrição de MIME type e tamanho (5MB) no bucket equipment-photos
UPDATE storage.buckets
SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
WHERE id = 'equipment-photos';

NOTIFY pgrst, 'reload schema';
