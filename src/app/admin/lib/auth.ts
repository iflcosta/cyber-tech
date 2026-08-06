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
 * Mesma ideia, incluindo o profile (full_name, role) — layout.tsx e
 * mais de uma página buscavam profile.role separadamente. Chamar
 * getAuthedProfile() nesses lugares dedupe tanto o getUser() quanto
 * essa segunda query, cada um só rodando uma vez por request.
 */
export const getAuthedProfile = cache(async () => {
  const { supabase, user } = await getAuthedUser();
  if (!user) return { supabase, user, profile: null };
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();
  return { supabase, user, profile };
});
