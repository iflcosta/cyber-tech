-- ============================================================
-- 0027_revoke_helper_functions_from_anon.sql
-- ============================================================
--
-- Advisors do Supabase: is_owner() e current_user_role() continuavam
-- executáveis por "anon" (sem login). Risco baixo na prática — as
-- duas só leem profiles via auth.uid(), que é NULL sem sessão, então
-- retornam vazio/false — mas é a mesma pegadinha de sempre (Supabase
-- concede EXECUTE em função nova pra anon automaticamente) e mesma
-- defesa em profundidade já aplicada nas outras funções sensíveis
-- (0020/0021/0022/0023).

REVOKE EXECUTE ON FUNCTION public.is_owner() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_owner() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_owner() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM anon;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

-- rls_auto_enable() é um EVENT TRIGGER (dispara sozinho em CREATE
-- TABLE, não é chamável via RPC/API) — não faz sentido revogar EXECUTE
-- de anon nele, o advisor sinaliza mas não é uma exposição real.

NOTIFY pgrst, 'reload schema';
