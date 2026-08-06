-- ============================================================
-- 0021_security_hardening_grants_search_path.sql
-- ============================================================
--
-- Continuação da 0020. Duas falhas descobertas ao VERIFICAR (não só
-- aplicar) o hardening anterior:
--
-- 1. REVOKE EXECUTE ... FROM anon (feito na 0020) não é suficiente.
--    O Postgres concede EXECUTE em toda função nova/recriada pro
--    role especial PUBLIC por padrão, e "anon" herda esse acesso via
--    PUBLIC mesmo depois de revogado diretamente dele. Confirmado
--    com has_function_privilege('anon', 'create_sale(...)', 'EXECUTE')
--    retornando true mesmo após a 0020. Corrigido revogando de
--    PUBLIC (não só de anon) e reconcedendo explicitamente pra
--    authenticated. Reverificado com has_function_privilege (anon
--    volta pra false) e com uma chamada real como anon
--    (SET ROLE anon; SELECT create_sale(...)) que agora falha com
--    "permission denied for function create_sale".
--
-- 2. search_path mutável em funções SECURITY DEFINER/trigger — mesma
--    classe de risco que motivou SET search_path TO 'public' em
--    create_sale/cancel_sale na 0020, faltando nas demais.

-- ── 1. Fecha a brecha do grant em PUBLIC ──

REVOKE EXECUTE ON FUNCTION public.create_sale(jsonb, text, text, text, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_sale(jsonb, text, text, text, numeric, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.cancel_sale(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_sale(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.wipe_stock() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.wipe_stock() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.reset_stock_quantities() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_stock_quantities() TO authenticated;

-- handle_new_user só roda via trigger (on_auth_user_created), não
-- precisa ser chamável por nenhum role diretamente.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- ── 2. search_path fixo nas funções restantes ──

ALTER FUNCTION public.set_os_number() SET search_path = public;
ALTER FUNCTION public.touch_updated_at() SET search_path = public;
ALTER FUNCTION public.set_delivered_at() SET search_path = public;
ALTER FUNCTION public.set_short_id() SET search_path = public;
ALTER FUNCTION public.fn_update_stock_on_movement() SET search_path = public;
ALTER FUNCTION public.fn_set_sale_number() SET search_path = public;
ALTER FUNCTION public.profiles_block_self_role_change() SET search_path = public;
ALTER FUNCTION public.fn_customers_set_created_by() SET search_path = public;
ALTER FUNCTION public.fn_stock_category_code(text) SET search_path = public;
ALTER FUNCTION public.fn_stock_item_set_internal_sku() SET search_path = public;
ALTER FUNCTION public.fn_stock_item_lock_internal_sku() SET search_path = public;

-- ── 3. stock_category_codes ficou sem policy de SELECT explícita ──

CREATE POLICY "Authenticated can view stock_category_codes"
  ON public.stock_category_codes FOR SELECT
  TO authenticated
  USING (true);

-- ── 4. profiles tinha 2 policies permissivas de UPDATE (owner_only +
--    self_full_name) — o Postgres avalia as duas em toda query,
--    desperdiçando trabalho. Funde numa só; a troca de role/active
--    por si mesmo já é bloqueada pelo trigger
--    trg_profiles_block_self_role_change independente da policy,
--    então isso é só ganho de performance, sem mudar o que é
--    permitido.

DROP POLICY IF EXISTS "profiles_update_owner_only" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self_full_name" ON public.profiles;
CREATE POLICY "profiles_update_owner_or_self"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((select public.is_owner()) OR id = (select auth.uid()))
  WITH CHECK ((select public.is_owner()) OR id = (select auth.uid()));

NOTIFY pgrst, 'reload schema';
