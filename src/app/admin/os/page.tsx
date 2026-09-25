import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { OSCard } from '@/app/admin/components/OSCard';
import { OSFilter } from './OSFilter';
import { WARRANTY_DAYS } from '@/app/admin/types/database';
import { sanitizeSearchTerm, findMatchingCustomerIds } from '@/app/admin/lib/search';

export const dynamic = 'force-dynamic';

const ACTIVE_STATUSES = [
  'awaiting_approval', 'approved', 'in_progress', 'waiting_part', 'ready',
];

export default async function OSListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user } = await getAuthedUser();
  if (!user) redirect('/admin/login');

  // Query direto na tabela (nao na view) pra permitir ver OSs
  // entregues/canceladas via filtro de status especifico.
  // Joins manuais replicam os campos da view (customer_name etc).
  let query = supabase
    .from('service_orders')
    .select(`
      *,
      customer:customers(name, phone)
    `)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (params.status === 'warranty') {
    // Entregues dentro dos WARRANTY_DAYS — útil quando cliente volta reclamando.
    // Server Component, lido uma vez por request — Date.now() aqui é seguro.
    // eslint-disable-next-line react-hooks/purity
    const warrantyLimit = new Date(Date.now() - WARRANTY_DAYS * 86400000).toISOString();
    query = query.eq('status', 'delivered').gte('delivered_at', warrantyLimit);
  } else if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  } else {
    // Sem filtro: ativas (exclui delivered/cancelled)
    query = query.in('status', ACTIVE_STATUSES);
  }

  // Busca no banco — nome/telefone do cliente vêm de customers (join),
  // então busca primeiro os IDs de cliente que batem, e combina com as
  // colunas próprias da OS num .or() só.
  if (params.q) {
    const q = sanitizeSearchTerm(params.q);
    const customerIds = await findMatchingCustomerIds(supabase, q);
    const orParts = [
      `os_number.ilike.%${q}%`,
      `short_id.ilike.%${q}%`,
      `equipment_type.ilike.%${q}%`,
      `equipment_serial.ilike.%${q}%`,
      `equipment_model.ilike.%${q}%`,
      `equipment_brand.ilike.%${q}%`,
      `reported_defect.ilike.%${q}%`,
    ];
    if (customerIds.length > 0) orParts.push(`customer_id.in.(${customerIds.join(',')})`);
    query = query.or(orParts.join(','));
  }

  const { data: orders, error } = await query;

  // Normalizar shape (a view retornava customer_name no root e
  // days_since_update calculado). Reproduzimos os dois aqui.
  // Server Component: "agora" é lido uma vez por request (sem re-render
  // no cliente pra ficar desatualizado) — Date.now() aqui é seguro,
  // só o linter de pureza não distingue Server de Client Component.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const filtered = (orders ?? []).map((o) => ({
    ...o,
    customer_name: o.customer?.name ?? '(cliente removido)',
    customer_phone: o.customer?.phone ?? null,
    days_since_update: Math.max(
      0,
      Math.floor((now - new Date(o.updated_at).getTime()) / 86400000),
    ),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ordens de Serviço</h1>
          <p className="text-sm text-slate-500">
            {filtered.length} resultado{filtered.length === 1 ? '' : 's'}
            {params.status && params.status !== 'all' && ` (filtrado por ${params.status})`}
          </p>
        </div>
        <Link
          href="/admin/os/new"
          className="rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 sm:hidden"
        >
          + Nova
        </Link>
      </div>

      <OSFilter />

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          Erro ao carregar OS: {error.message}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">Nenhuma OS encontrada com esses filtros.</p>
          <Link
            href="/admin/os/new"
            className="mt-3 inline-block text-sm font-semibold text-zinc-900 underline hover:text-black"
          >
            Cadastrar a primeira →
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((so) => (
            <OSCard key={so.id} so={so} />
          ))}
        </div>
      )}
    </div>
  );
}
