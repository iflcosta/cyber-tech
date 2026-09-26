import { cache } from 'react';
import { createCRMServerClient } from './supabase/server';

/**
 * auth.getUser() faz uma chamada de rede real pro servidor de Auth do
 * Supabase pra revalidar o token — é o jeito seguro de checar sessão
 * no servidor (diferente de getSession(), que só lê o JWT salvo no
 * cookie sem confirmar que ainda é válido).
 *
 * Antes desse helper, layout.tsx E praticamente toda page.tsx sob
 * /admin faziam essa chamada de novo, cada um por conta própria —
 * a auditoria de performance encontrou o mesmo getUser() duplicado
 * em 23 arquivos diferentes. Isso dobra (ou mais, em páginas que
 * também refaziam a busca de profile.role) o tempo de rede gasto só
 * em autenticação em toda navegação, sem necessidade: dentro do
 * mesmo request, o resultado é sempre o mesmo.
 *
 * cache() do React memoiza por request (Next.js reseta o cache a
 * cada request novo) — chamar getAuthedUser() várias vezes durante
 * o render de uma página só dispara a chamada de rede UMA vez; as
 * chamadas seguintes (no layout, na página, em componentes filhos)
 * reusam o mesmo resultado sem round-trip adicional.
 */
export const getAuthedUser = cache(async () => {
  const supabase = await createCRMServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
});

/**
 * Mesma ideia, incluindo o profile (full_name, role, can_delete) —
 * layout.tsx e mais de uma página buscavam profile.role separadamente.
 * Chamar getAuthedProfile() nesses lugares dedupe tanto o getUser()
 * quanto essa segunda query, cada um só rodando uma vez por request.
 *
 * can_delete é uma permissão independente de role: todos os 3 usuários
 * são role='owner' (edição total liberada pros 3), mas só quem tem
 * can_delete=true pode apagar registros do sistema (ver migration
 * 0029_can_delete_permission.sql).
 */
export const getAuthedProfile = cache(async () => {
  const { supabase, user } = await getAuthedUser();
  if (!user) return { supabase, user, profile: null };
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, can_delete')
    .eq('id', user.id)
    .maybeSingle();
  return { supabase, user, profile };
});

/**
 * Restringe funcionalidades exclusivas de Desenvolvimento & Marketing (como a
 * aba "Leads TI") apenas para o Iago, evitando poluir a interface operacional
 * para o Felipe, o técnico (Jefferson) e o estagiário (Eduardo).
 */
export function isIagoUser(
  user?: { id?: string; email?: string | null } | null,
  profile?: { full_name?: string | null } | null,
): boolean {
  if (!user) return false;
  if (user.id === 'e8bb8d42-2424-46b7-a345-c17ee204862d') return true;
  if (user.email?.toLowerCase() === 'iago@cyberinformatica.tech') return true;
  if (profile?.full_name?.trim().toLowerCase() === 'iago') return true;
  return false;
}

