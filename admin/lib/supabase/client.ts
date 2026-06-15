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
import type { Database } from '../../types/database';

export function createCRMBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_CRM_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_CRM_ANON_KEY;

  if (!url || !anon) {
    throw new Error(
      '[CRM] Variaveis NEXT_PUBLIC_SUPABASE_CRM_URL e NEXT_PUBLIC_SUPABASE_CRM_ANON_KEY precisam estar definidas no .env.local'
    );
  }

  return createBrowserClient<Database>(url, anon);
}
