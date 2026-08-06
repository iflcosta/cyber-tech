-- ============================================================
-- 0023_create_stock_item_and_stock_in.sql
-- ============================================================
--
-- "Cadastrar peça e vender" no PDV (venda de computador montado):
-- cadastra a peça (processador, placa-mãe, GPU...) que ainda não tá
-- no catálogo E já registra a entrada da quantidade comprada pra essa
-- montagem, na mesma operação atômica (tudo ou nada). A SAÍDA não
-- acontece aqui — ela acontece no fluxo normal do PDV (create_sale),
-- junto com o resto dos itens da venda, quando o operador finalizar.
--
-- Antes disso rodava como dois INSERTs separados direto do client
-- (stock_items + stock_movements) — funcionava, mas não era atômico:
-- se a aba fechasse ou a rede caísse entre os dois passos, sobrava um
-- stock_item com current_stock errado (criado mas sem a entrada, ou
-- com entrada mas nunca vendido). Mesmo problema que o
-- create_stock_item_and_use (0022) já resolveu pro fluxo de peça de
-- OS — aqui é a mesma solução pro fluxo de venda no PDV.
--
-- Devolve o stock_item já criado (id + current_stock atualizado) pra
-- o client não precisar de um segundo round-trip só pra montar o item
-- do carrinho.

CREATE OR REPLACE FUNCTION public.create_stock_item_and_stock_in(
  p_name text,
  p_unit_price numeric,
  p_quantity int,
  p_category text DEFAULT NULL::text,
  p_notes text DEFAULT NULL::text
)
RETURNS public.stock_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_item public.stock_items;
  v_total numeric;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação necessária' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF trim(coalesce(p_name, '')) = '' THEN
    RAISE EXCEPTION 'Nome da peça é obrigatório';
  END IF;
  IF p_unit_price IS NULL OR p_unit_price <= 0 THEN
    RAISE EXCEPTION 'Preço deve ser maior que zero';
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantidade deve ser maior que zero';
  END IF;

  v_total := p_unit_price * p_quantity;

  INSERT INTO public.stock_items (name, category, unit_price)
  VALUES (trim(p_name), NULLIF(trim(coalesce(p_category, '')), ''), p_unit_price)
  RETURNING * INTO v_item;

  INSERT INTO public.stock_movements (
    stock_item_id, movement_type, quantity, unit_price, total_amount, notes, author_id
  ) VALUES (
    v_item.id, 'in', p_quantity, p_unit_price, v_total,
    coalesce(NULLIF(trim(p_notes), ''), 'Peça comprada pra montagem de computador (venda PDV)'),
    auth.uid()
  );

  -- Recarrega o item pra devolver o current_stock já atualizado (o
  -- v_item capturado no RETURNING acima é de ANTES do trigger da
  -- movimentação rodar).
  SELECT * INTO v_item FROM public.stock_items WHERE id = v_item.id;

  RETURN v_item;
END;
$function$;

-- Mesma pegadinha da 0020/0021/0022: Supabase concede EXECUTE em
-- função nova pra anon automaticamente, REVOKE FROM PUBLIC sozinho
-- não basta.
REVOKE EXECUTE ON FUNCTION public.create_stock_item_and_stock_in(text, numeric, int, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_stock_item_and_stock_in(text, numeric, int, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_stock_item_and_stock_in(text, numeric, int, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
