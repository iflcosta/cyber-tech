import Link from 'next/link';
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
  if (!user) return null;

  let query = supabase
    .from('service_orders')
    .select(`
      *,
      customer:customers(name, phone)
    `)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (params.status === 'warranty') {
    // eslint-disable-next-line react-hooks/purity
    const warrantyLimit = new Date(Date.now() - WARRANTY_DAYS * 86400000).toISOString();
    query = query.eq('status', 'delivered').gte('delivered_at', warrantyLimit);
  } else if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  } else {
    query = query.in('status', ACTIVE_STATUSES);
  }

  if (params.q) {
    const q = sanitizeSearchTerm(params.q);
    const customerIds = await findMatchingCustomerIds(supabase, q);
    const orParts = [
      `os_number.ilike.%${q}%`,
      `short_id.ilike.%${q}%`,
      `equipment_serial.ilike.%${q}%`,
      `equipment_model.ilike.%${q}%`,
      `equipment_brand.ilike.%${q}%`,
      `reported_defect.ilike.%${q}%`,
    ];
    if (customerIds.length > 0) orParts.push(`customer_id.in.(${customerIds.join(',')})`);
    query = query.or(orParts.join(','));
  }

  const { data: orders, error } = await query;

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
      <div className="flex items-center justify-between gap-2 border-b-2 border-zinc-950 pb-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-950">
            Ordens de Serviço
          </h1>
          <p className="font-mono text-xs text-zinc-600">
            {filtered.length} resultado{filtered.length === 1 ? '' : 's'}
            {params.status && params.status !== 'all' && ` // filtro: ${params.status}`}
          </p>
        </div>
        <Link
          href="/admin/os/new"
          className="bg-zinc-950 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 sm:hidden"
        >
          + Nova OS
        </Link>
      </div>

      <OSFilter />

      {error && (
        <div className="border-2 border-zinc-950 bg-zinc-100 p-3 font-mono text-xs font-bold text-zinc-950">
          [ERRO] Falha ao carregar OS: {error.message}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="border-2 border-dashed border-zinc-300 bg-white p-12 text-center">
          <p className="font-mono text-sm text-zinc-600">Nenhuma OS encontrada com esses filtros.</p>
          <Link
            href="/admin/os/new"
            className="mt-3 inline-block bg-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800"
          >
            Cadastrar Ordem de Serviço →
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
