import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Reusa o mesmo projeto Supabase do CRM.
// Lazy init: client so' e criado quando a funcao e chamada em runtime.
// Permite build/pre-render sem env vars configuradas.

// Re-exporta tipo comum para evitar import direto de @supabase/supabase-js nos consumidores
export type SiteSupabase = SupabaseClient;

let cached: SiteSupabase | null = null;

export function getSiteSupabase(): SiteSupabase {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_CRM_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_CRM_ANON_KEY || '';

  if (!url || !anonKey) {
    throw new Error(
      'Supabase nao configurado. Defina NEXT_PUBLIC_SUPABASE_CRM_URL e NEXT_PUBLIC_SUPABASE_CRM_ANON_KEY nas env vars.'
    );
  }

  cached = createBrowserClient(url, anonKey);
  return cached;
}