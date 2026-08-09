/**
 * Cliente Supabase para uso no BROWSER (Client Components do Next.js).
 *
 * IMPORTANTE: Este cliente usa APENAS a chave anon do projeto NOVO do CRM
 * (NEXT_PUBLIC_SUPABASE_CRM_URL / NEXT_PUBLIC_SUPABASE_CRM_ANON_KEY).
 * NUNCA misturar com o Supabase principal que serve a landing/leads.
 *
 * A persistencia de sessao e feita via cookies (padrao do @supabase/ssr),
 * o que ja da o "manter logado" automatico entre reloads.
 */

import { createBrowserClient } from '@supabase/ssr';

export function createCRMBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_CRM_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_CRM_ANON_KEY;

  if (!url || !anon) {
    throw new Error(
      '[CRM] Variaveis NEXT_PUBLIC_SUPABASE_CRM_URL e NEXT_PUBLIC_SUPABASE_CRM_ANON_KEY precisam estar definidas no .env.local'
    );
  }

  // O tipo Database gerado à mão não bate exatamente com o shape que
  // essa versão do @supabase/ssr/postgrest-js espera como genérico —
  // usar <Database> aqui colapsa toda tabela pra "never" (tentado e
  // revertido numa auditoria: quebrava o typecheck do app inteiro).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createBrowserClient<any>(url, anon);
}
