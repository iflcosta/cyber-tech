/**
 * Cliente Supabase para uso no SERVIDOR (Server Components, Route Handlers,
 * Server Actions do Next.js).
 *
 * Mesmo principio do client.ts: usa APENAS o projeto NOVO do CRM.
 * Os cookies de sessao sao gerenciados via next/headers (Server Components
 * do App Router).
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createCRMServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_CRM_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_CRM_ANON_KEY;

  if (!url || !anon) {
    throw new Error(
      '[CRM] Variaveis NEXT_PUBLIC_SUPABASE_CRM_URL e NEXT_PUBLIC_SUPABASE_CRM_ANON_KEY precisam estar definidas no .env.local'
    );
  }

  const cookieStore = await cookies();

  // O tipo Database gerado à mão não bate exatamente com o shape que
  // essa versão do @supabase/ssr/postgrest-js espera como genérico —
  // usar <Database> aqui colapsa toda tabela pra "never" (tentado e
  // revertido numa auditoria: quebrava o typecheck do app inteiro).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createServerClient<any>(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Em Server Components, setAll pode falhar (cookies sao read-only).
          // Em Middleware e Route Handlers funciona normal. Ignorar aqui e ok.
        }
      },
    },
  });
}
