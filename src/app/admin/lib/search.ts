/**
 * Busca server-side pros filtros de texto do /admin.
 *
 * Problema que isso resolve: as listas (OS, Estoque, Peças, Vendas)
 * buscavam um lote limitado do banco (ex: 100 OS mais recentes) e
 * filtravam o texto DEPOIS, no navegador, só dentro desse lote. Com
 * poucos registros isso nunca aparece — mas assim que a loja acumular
 * histórico, buscar um cliente de meses atrás vai retornar "nenhum
 * resultado" e vai parecer que o registro sumiu, quando na verdade
 * só não fazia parte do lote carregado.
 *
 * Aqui a busca roda no Postgres (ilike), sem limite de "só os N mais
 * recentes" — sempre olha a tabela inteira.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Tira caracteres que têm significado especial na sintaxe de filtro
 * do PostgREST (`,` separa condições dentro de `.or()`, `(` e `)`
 * delimitam grupo) — sem isso, buscar por algo com vírgula ou
 * parêntese quebraria a query em vez de simplesmente não achar nada.
 */
export function sanitizeSearchTerm(q: string): string {
  return q.replace(/[,()]/g, ' ').trim();
}

/**
 * Monta o `.or()` de busca em customers: nome, telefone (texto livre)
 * e telefone por dígitos (phone_search, coluna gerada) quando `q` tem
 * dígito — assim "11999996638" acha "(11) 99999-9638" independente de
 * como foi formatado no cadastro. `extra` deixa incluir mais colunas
 * (ex: email, só usado na tela de lista de clientes).
 */
export function customerSearchOr(q: string, extra: string[] = []): string {
  const digits = q.replace(/\D/g, '');
  const parts = [`name.ilike.%${q}%`, `phone.ilike.%${q}%`, ...extra];
  if (digits.length >= 3) parts.push(`phone_search.ilike.%${digits}%`);
  return parts.join(',');
}

/** IDs de clientes cujo nome ou telefone batem com `q`. */
export async function findMatchingCustomerIds(
  supabase: SupabaseClient,
  q: string,
): Promise<string[]> {
  const { data } = await supabase
    .from('customers')
    .select('id')
    .or(customerSearchOr(q))
    .limit(500);
  return (data ?? []).map((c: { id: string }) => c.id);
}

/** IDs de técnicos/dono cujo nome bate com `q`. */
export async function findMatchingProfileIds(
  supabase: SupabaseClient,
  q: string,
): Promise<string[]> {
  const { data } = await supabase.from('profiles').select('id').ilike('full_name', `%${q}%`);
  return (data ?? []).map((p: { id: string }) => p.id);
}

/** IDs de fornecedores cujo nome bate com `q`. */
export async function findMatchingSupplierIds(
  supabase: SupabaseClient,
  q: string,
): Promise<string[]> {
  const { data } = await supabase.from('suppliers').select('id').ilike('name', `%${q}%`);
  return (data ?? []).map((s: { id: string }) => s.id);
}

/**
 * IDs de OS cujo short_id/os_number batem com `q` OU que pertencem a
 * um cliente que bate com `q` (nome/telefone) — usado por telas que
 * não têm acesso direto às colunas da OS (ex: pedido de peça).
 */
export async function findMatchingServiceOrderIds(
  supabase: SupabaseClient,
  q: string,
  customerIds: string[],
): Promise<string[]> {
  const orParts = [`short_id.ilike.%${q}%`, `os_number.ilike.%${q}%`];
  if (customerIds.length > 0) orParts.push(`customer_id.in.(${customerIds.join(',')})`);
  const { data } = await supabase.from('service_orders').select('id').or(orParts.join(','));
  return (data ?? []).map((o: { id: string }) => o.id);
}
