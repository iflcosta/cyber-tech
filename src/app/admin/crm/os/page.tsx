import Link from 'next/link';
import { createCRMServerClient } from '@/app/admin/crm/lib/supabase/server';
import { OSCard } from '@/app/admin/crm/components/OSCard';
import { OSFilter } from './OSFilter';

export const dynamic = 'force-dynamic';

const ACTIVE_STATUSES = [
  'awaiting_approval', 'approved', 'in_progress', 'waiting_part', 'ready',
];

export default async function OSListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; mine?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createCRMServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const showOnlyMine = params.mine === '1' && profile?.role !== 'owner';

  let query = supabase
    .from('service_orders_with_stale')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(100);

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  } else {
    query = query.in('status', ACTIVE_STATUSES);
  }

  if (showOnlyMine) {
    query = query.eq('assigned_to', user.id);
  }

  const { data: orders, error } = await query;

  let filtered = orders ?? [];
  if (params.q) {
    const q = params.q.toLowerCase().trim();
    // Aceita busca com ou sem prefixo "OS-": "OS-0001" e "0001" dao match
    const qBare = q.replace(/^os-/, '');
    filtered = filtered.filter((o) =>
      o.customer_name?.toLowerCase().includes(q) ||
      o.os_number?.toLowerCase().includes(q) ||
      (o.short_id?.toLowerCase().includes(q) ?? false) ||
      (o.short_id?.toLowerCase().replace(/^os-/, '').includes(qBare) ?? false) ||
      o.customer_phone?.toLowerCase().includes(q) ||
      o.equipment_serial?.toLowerCase().includes(q) ||
      o.equipment_model?.toLowerCase().includes(q) ||
      o.equipment_brand?.toLowerCase().includes(q) ||
      o.reported_defect?.toLowerCase().includes(q)
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ordens de Serviço</h1>
          <p className="text-sm text-slate-500">
            {filtered.length} ativa{filtered.length === 1 ? '' : 's'}
            {showOnlyMine && ' (atribuídas a mim)'}
          </p>
        </div>
        <Link
          href="/admin/crm/os/new"
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:hidden"
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
            href="/admin/crm/os/new"
            className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
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
