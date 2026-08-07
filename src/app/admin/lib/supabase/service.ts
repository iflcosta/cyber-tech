/**
 * Cliente Supabase com a service_role key — ignora RLS por completo.
 *
 * USO RESTRITO: só pra rotinas de sistema que não têm um usuário
 * logado por trás (ex: backup automático via cron) e que por isso
 * genuinamente precisam ver TODAS as linhas de TODAS as tabelas,
 * independente de quem seria o "dono" do dado.
 *
 * NUNCA importar isso em Server Component, Route Handler acessível
 * por usuário comum, ou qualquer código que possa rodar a pedido de
 * uma requisição de usuário — nesses casos use createCRMServerClient
 * (respeita RLS) ou createCRMBrowserClient. A service_role key não
 * tem NEXT_PUBLIC_ no nome de propósito: nunca deve chegar no bundle
 * do navegador.
 */

import { createClient } from '@supabase/supabase-js';

// Sem o generic <Database> de propósito: esse client existe justamente
// pra rotinas de sistema (backup) que tocam tabelas fora do modelo
// típico do app (ex: contact_leads, stock_category_codes) — travar no
// tipo Database (feito pra cobrir só o que as telas usam) atrapalharia
// mais do que ajudaria aqui.
export function createCRMServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_CRM_URL;
  const serviceKey = process.env.SUPABASE_CRM_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      '[CRM] Faltam NEXT_PUBLIC_SUPABASE_CRM_URL e/ou SUPABASE_CRM_SERVICE_ROLE_KEY nas ' +
        'variáveis de ambiente. A service_role key fica em Supabase → Project Settings → ' +
        'API → service_role (secret) — NUNCA a NEXT_PUBLIC_ anon key.',
    );
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
