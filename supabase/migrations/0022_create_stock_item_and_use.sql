-- ============================================================
-- 0022_create_stock_item_and_use.sql
-- ============================================================
--
-- "Usar peça do estoque" na tela da OS só deixava escolher peças já
-- cadastradas — se o técnico usasse algo que não estava no catálogo
-- (cabo/conector avulso comprado na hora, por exemplo), não tinha
-- como registrar sem sair da OS, ir em Estoque, cadastrar o item,
-- voltar pra OS e só então usar.
--
-- Esta RPC cadastra o item E já registra o uso na mesma operação
-- atômica (tudo ou nada — se qualquer passo falhar, nada é gravado):
--   1. cria o stock_item (current_stock começa em 0, igual ao
--      cadastro manual em /admin/estoque/new)
--   2. registra uma movimentação de ENTRADA da quantidade informada
--      (o item "entra no sistema" com a quantidade que o técnico
--      tinha fisicamente)
--   3. registra uma movimentação de SAÍDA da mesma quantidade,
--      vinculada à OS (consumo imediato)
--
-- Resultado: current_stock volta pra 0 (não fica negativo, respeita
-- o CHECK current_stock >= 0), mas o item já existe no catálogo pra
-- reposição futura, e o histórico de movimentação mostra exatamente
-- o que aconteceu (entrada seguida de saída), nada escondido.

CREATE OR REPLACE FUNCTION public.create_stock_item_and_use(
  p_name text,
  p_unit_price numeric,
  p_quantity int,
  p_service_order_id uuid,
  p_category text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_item_id uuid;
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

  IF p_service_order_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.service_orders WHERE id = p_service_order_id
  ) THEN
    RAISE EXCEPTION 'OS % não encontrada', p_service_order_id;
  END IF;

  v_total := p_unit_price * p_quantity;

  INSERT INTO public.stock_items (name, category, unit_price)
  VALUES (trim(p_name), NULLIF(trim(coalesce(p_category, '')), ''), p_unit_price)
  RETURNING id INTO v_item_id;

  INSERT INTO public.stock_movements (
    stock_item_id, movement_type, quantity, unit_price, total_amount, notes, author_id
  ) VALUES (
    v_item_id, 'in', p_quantity, p_unit_price, v_total,
    'Cadastro automático ao usar peça fora do estoque', auth.uid()
  );

  INSERT INTO public.stock_movements (
    stock_item_id, movement_type, quantity, unit_price, total_amount, service_order_id, author_id
  ) VALUES (
    v_item_id, 'out', p_quantity, p_unit_price, v_total, p_service_order_id, auth.uid()
  );

  RETURN v_item_id;
END;
$function$;

-- Supabase concede EXECUTE em toda função nova pro schema public
-- automaticamente pra anon/authenticated/service_role (via ALTER
-- DEFAULT PRIVILEGES do próprio projeto, separado do PUBLIC padrão do
-- Postgres) — precisa revogar de PUBLIC *e* de anon explicitamente
-- pra travar de verdade (mesma pegadinha encontrada na auditoria de
-- segurança da 0020/0021).
REVOKE EXECUTE ON FUNCTION public.create_stock_item_and_use(text, numeric, int, uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_stock_item_and_use(text, numeric, int, uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_stock_item_and_use(text, numeric, int, uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
