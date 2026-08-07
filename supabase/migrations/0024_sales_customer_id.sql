-- ============================================================
-- 0024_sales_customer_id.sql
-- ============================================================
--
-- Vendas (PDV) só guardavam customer_name/customer_phone como texto
-- livre, sem link nenhum com a tabela customers — resultado: não dava
-- pra ver o histórico de compras de um cliente junto com o histórico
-- de OS dele (não tinha como cruzar os dois). Diferente de
-- service_orders, que sempre teve customer_id FK de verdade.
--
-- customer_id é opcional (nullable) de propósito: venda de balcão
-- "avulsa" sem identificar o cliente continua funcionando igual —
-- só quando o operador busca/seleciona um cliente cadastrado no PDV
-- que o link é gravado.

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON public.sales(customer_id);

COMMENT ON COLUMN public.sales.customer_id IS 'Opcional — só preenchido quando o operador vincula a venda a um cliente já cadastrado. customer_name/customer_phone continuam sendo o snapshot em texto (útil mesmo pra venda de balcão sem cadastro).';

-- Atualiza create_sale pra aceitar e gravar o customer_id opcional.
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
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação necessária' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_payment_method NOT IN ('cash', 'pix', 'card', 'transfer', 'other') THEN
    RAISE EXCEPTION 'Forma de pagamento invalida: %', p_payment_method;
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

REVOKE EXECUTE ON FUNCTION public.create_sale(jsonb, text, text, text, numeric, text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_sale(jsonb, text, text, text, numeric, text, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_sale(jsonb, text, text, text, numeric, text, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
