-- ============================================================
-- 0032_fix_service_orders_with_stale_security_invoker.sql
-- ============================================================
--
-- Achado na auditoria pós-sessão: a migration 0031 (que tirou
-- assigned_to) precisou recriar a view service_orders_with_stale via
-- DROP VIEW + CREATE VIEW (CREATE OR REPLACE não deixa tirar coluna).
-- DROP VIEW apaga TODAS as propriedades da view, inclusive
-- security_invoker=true, que a migration 0020 (security_hardening)
-- tinha aplicado nela especificamente por causa disso: sem
-- security_invoker, a view roda com o dono (postgres), que ignora RLS
-- das tabelas por baixo (service_orders, customers).
--
-- Como o SELECT dessa view já era concedido a anon (privilégio padrão
-- do projeto pra tabelas/views novas do schema public — o mesmo vale
-- pra stock_low_alert e part_orders_pending_return, que continuam
-- seguras porque têm security_invoker=true), a falta dessa opção
-- reabriu, por alguns minutos entre o merge da 0031 e esse fix, a
-- possibilidade de um usuário NÃO autenticado ler nome, telefone,
-- defeito relatado etc. de toda OS ativa através dessa view — mesmo
-- a tabela base bloqueando anon corretamente via RLS.
--
-- advisors do Supabase confirmaram o problema (security_definer_view,
-- nível ERROR) logo depois do deploy; corrigido e reconferido (nível
-- ERROR sumiu da lista).

ALTER VIEW public.service_orders_with_stale SET (security_invoker = true);

-- Bônus de higiene encontrado na mesma auditoria: rls_auto_enable() é
-- um event trigger function (dispara sozinho toda vez que uma tabela
-- nova é criada no schema public, pra ligar RLS automaticamente) —
-- não é algo que o app deveria chamar via API. Funções desse tipo
-- (RETURNS event_trigger) não são invocáveis via RPC normal mesmo com
-- EXECUTE concedido, mas por consistência com a defesa em profundidade
-- já aplicada nas outras funções (is_owner, current_user_role,
-- can_delete...), revoga o acesso mesmo assim.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;

NOTIFY pgrst, 'reload schema';
