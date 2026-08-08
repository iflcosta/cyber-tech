-- Ate agora, "role = 'owner'" controlava DUAS coisas ao mesmo tempo:
-- (1) poder editar/aprovar qualquer OS, venda, pedido de peca etc. e
-- (2) poder apagar registros do sistema (OS, cliente, item de estoque,
-- fornecedor, foto, pagamento...).
--
-- O pedido do dono da loja foi manter os 3 usuarios (felipe, iago,
-- jefferson) com acesso total de EDICAO (todos ja sao role='owner',
-- decisao tomada numa mudanca anterior desta mesma sessao), mas
-- reservar a capacidade de APAGAR/EXCLUIR exclusivamente para uma
-- pessoa (iago) -- "quem controla o estoque" e quem assume a
-- responsabilidade se algo for apagado por engano.
--
-- Como role='owner' hoje da as duas coisas junto, a unica forma de
-- separar isso e' criar uma segunda dimensao de permissao,
-- independente de role: profiles.can_delete. Todas as 14 politicas de
-- DELETE deste sistema passam a checar can_delete() no lugar de
-- is_owner()/role='owner'. Edicao continua liberada pra role='owner'
-- exatamente como estava.

-- 1. Nova coluna -----------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS can_delete boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.can_delete IS
  'Permissao independente de role: só quem tem can_delete=true pode apagar registros (OS, clientes, estoque, vendas, fotos, pagamentos...). Edicao normal continua controlada por role.';

-- 2. Funcao helper can_delete(), no mesmo molde de is_owner() --------
CREATE OR REPLACE FUNCTION public.can_delete()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT p.can_delete FROM public.profiles p WHERE p.id = auth.uid()),
    false
  );
$function$;

REVOKE EXECUTE ON FUNCTION public.can_delete() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_delete() FROM anon;
GRANT EXECUTE ON FUNCTION public.can_delete() TO authenticated;

-- 3. Fecha a brecha: sem isso, como os 3 sao role='owner', qualquer
-- um deles poderia se auto-conceder (ou conceder a outro) can_delete
-- via UPDATE profiles normal, ja que a policy de UPDATE em profiles
-- libera qualquer owner editar qualquer profile. Agora, mudar
-- can_delete exige que quem esta fazendo a mudanca JA tenha
-- can_delete=true (nao basta ser owner).
CREATE OR REPLACE FUNCTION public.profiles_block_self_role_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_owner() THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Nao pode alterar proprio role (precisa de owner)';
    END IF;
    IF NEW.active IS DISTINCT FROM OLD.active THEN
      RAISE EXCEPTION 'Nao pode alterar proprio active (precisa de owner)';
    END IF;
  END IF;

  IF NEW.can_delete IS DISTINCT FROM OLD.can_delete THEN
    IF NOT public.can_delete() THEN
      RAISE EXCEPTION 'Nao pode alterar can_delete (precisa ja ter permissao de exclusao)';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 4. Concede can_delete apenas pro iago -------------------------------
-- (trigger acima bloquearia esse UPDATE mesmo vindo de um owner, ja
-- que nenhum dos 3 tem can_delete=true ainda -- desabilita
-- temporariamente, igual ja foi feito pra corrigir role do felipe e
-- do jefferson nesta mesma sessao)
ALTER TABLE public.profiles DISABLE TRIGGER trg_profiles_block_self_role_change;

UPDATE public.profiles
  SET can_delete = true
  WHERE email = 'iago@cyberinformatica.tech';

ALTER TABLE public.profiles ENABLE TRIGGER trg_profiles_block_self_role_change;

-- 5. Reescreve as 14 policies de DELETE para usar can_delete() -------

-- contact_leads
DROP POLICY IF EXISTS "Only owners can delete contact leads" ON public.contact_leads;
CREATE POLICY "Only owners can delete contact leads" ON public.contact_leads
  FOR DELETE
  USING (public.can_delete());

-- customers
DROP POLICY IF EXISTS customers_delete_owner_only ON public.customers;
CREATE POLICY customers_delete_owner_only ON public.customers
  FOR DELETE
  USING (public.can_delete());

-- part_orders
DROP POLICY IF EXISTS part_orders_delete_owner_only ON public.part_orders;
CREATE POLICY part_orders_delete_owner_only ON public.part_orders
  FOR DELETE
  USING (public.can_delete());

-- profiles
DROP POLICY IF EXISTS profiles_delete_owner_only ON public.profiles;
CREATE POLICY profiles_delete_owner_only ON public.profiles
  FOR DELETE
  USING (public.can_delete());

-- sale_items
DROP POLICY IF EXISTS "Only owners can delete sale_items" ON public.sale_items;
CREATE POLICY "Only owners can delete sale_items" ON public.sale_items
  FOR DELETE
  USING ((SELECT public.can_delete()));

-- sales
DROP POLICY IF EXISTS "Only owners can delete sales" ON public.sales;
CREATE POLICY "Only owners can delete sales" ON public.sales
  FOR DELETE
  USING ((SELECT public.can_delete()));

-- service_order_events
DROP POLICY IF EXISTS service_order_events_delete_owner_only ON public.service_order_events;
CREATE POLICY service_order_events_delete_owner_only ON public.service_order_events
  FOR DELETE
  USING (public.can_delete());

-- service_order_payments
DROP POLICY IF EXISTS "Only owners can delete OS payments" ON public.service_order_payments;
CREATE POLICY "Only owners can delete OS payments" ON public.service_order_payments
  FOR DELETE
  USING (public.can_delete());

-- service_orders
DROP POLICY IF EXISTS service_orders_delete_owner_only ON public.service_orders;
CREATE POLICY service_orders_delete_owner_only ON public.service_orders
  FOR DELETE
  USING (public.can_delete());

-- stock_items
DROP POLICY IF EXISTS "Only owners can delete stock_items" ON public.stock_items;
CREATE POLICY "Only owners can delete stock_items" ON public.stock_items
  FOR DELETE
  USING ((SELECT public.can_delete()));

-- stock_movements
DROP POLICY IF EXISTS "Only owners can delete stock_movements" ON public.stock_movements;
CREATE POLICY "Only owners can delete stock_movements" ON public.stock_movements
  FOR DELETE
  USING ((SELECT public.can_delete()));

-- suppliers
DROP POLICY IF EXISTS suppliers_delete_owner_only ON public.suppliers;
CREATE POLICY suppliers_delete_owner_only ON public.suppliers
  FOR DELETE
  USING (public.can_delete());

-- storage.objects (os-photos) -- ja era restrita a owner
DROP POLICY IF EXISTS os_photos_delete_owner_only ON storage.objects;
CREATE POLICY os_photos_delete_owner_only ON storage.objects
  FOR DELETE
  USING (bucket_id = 'os-photos' AND public.can_delete());

-- storage.objects (equipment-photos) -- essa NAO tinha nenhuma
-- restricao (qualquer usuario autenticado podia apagar foto de
-- equipamento). Aproveitando a revisao, trazendo pra dentro do mesmo
-- controle das demais.
DROP POLICY IF EXISTS "Authenticated delete equipment photos" ON storage.objects;
CREATE POLICY "Authenticated delete equipment photos" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'equipment-photos' AND public.can_delete());

-- 6. RPCs que fazem DELETE internamente -------------------------------
-- wipe_stock() e reset_stock_quantities() tinham gate manual
-- "IF NOT is_owner() THEN RAISE EXCEPTION" -- troca pra can_delete().

CREATE OR REPLACE FUNCTION public.wipe_stock()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count_items int;
  v_count_mov int;
  v_count_sales_affected int;
BEGIN
  -- Gate: apenas quem tem can_delete pode chamar
  IF NOT public.can_delete() THEN
    RAISE EXCEPTION 'Apenas quem tem permissao de exclusao pode zerar o estoque'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- 1. Contar antes (pra retorno)
  SELECT count(*) INTO v_count_items FROM public.stock_items;
  SELECT count(*) INTO v_count_mov FROM public.stock_movements;
  SELECT count(DISTINCT sale_id) INTO v_count_sales_affected
    FROM public.sale_items WHERE stock_item_id IS NOT NULL;

  -- 2. SET NULL nas referencias de venda (mantem item_name na venda)
  UPDATE public.sale_items
    SET stock_item_id = NULL
    WHERE stock_item_id IS NOT NULL;

  -- 3. Apaga movements (WHERE id IS NOT NULL pra satisfazer protecao do Supabase)
  DELETE FROM public.stock_movements WHERE id IS NOT NULL;

  -- 4. Apaga items
  DELETE FROM public.stock_items WHERE id IS NOT NULL;

  RETURN jsonb_build_object(
    'items_deleted', v_count_items,
    'movements_deleted', v_count_mov,
    'sales_with_item_link_cleared', v_count_sales_affected,
    'wiped_at', now()
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.reset_stock_quantities()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count_items int;
  v_count_mov int;
BEGIN
  IF NOT public.can_delete() THEN
    RAISE EXCEPTION 'Apenas quem tem permissao de exclusao pode zerar as quantidades'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT count(*) INTO v_count_items FROM public.stock_items;
  SELECT count(*) INTO v_count_mov FROM public.stock_movements;

  UPDATE public.stock_items SET current_stock = 0 WHERE id IS NOT NULL;
  DELETE FROM public.stock_movements WHERE id IS NOT NULL;

  RETURN jsonb_build_object(
    'items_reset', v_count_items,
    'movements_deleted', v_count_mov,
    'reset_at', now()
  );
END;
$function$;
