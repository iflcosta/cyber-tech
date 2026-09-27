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
  searchParams: Promise<{ q?: string; status?: string; tech?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user } = await getAuthedUser();
  if (!user) return null;

  // Busca perfis para resolver os IDs do Iago e do Jefferson
  const { data: techProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, commission_rate, role')
    .eq('active', true);

  const iagoProfile = techProfiles?.find(
    (p) => p.full_name?.toLowerCase().includes('iago')
  );
  const jeffersonProfile = techProfiles?.find(
    (p) => p.full_name?.toLowerCase().includes('jefferson')
  );

  let query = supabase
    .from('service_orders')
    .select(`
      *,
      customer:customers(name, phone),
      technician:profiles!service_orders_technician_id_fkey(id, full_name, commission_rate)
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

  // Filtro por Técnico / Bancada
  if (params.tech === 'unassigned') {
    query = query.is('technician_id', null);
  } else if (params.tech === 'iago' && iagoProfile) {
    query = query.eq('technician_id', iagoProfile.id);
  } else if (params.tech === 'jefferson' && jeffersonProfile) {
    query = query.eq('technician_id', jeffersonProfile.id);
  } else if (params.tech === 'me') {
    query = query.eq('technician_id', user.id);
  } else if (params.tech && params.tech !== 'all') {
    query = query.eq('technician_id', params.tech);
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

  // Executa query principal e contadores em paralelo
  const [ordersRes, allActiveRes, iagoActiveRes, jeffersonActiveRes, unassignedActiveRes] =
    await Promise.all([
      query,
      supabase.from('service_orders').select('id', { count: 'exact', head: true }).in('status', ACTIVE_STATUSES),
      iagoProfile
        ? supabase.from('service_orders').select('id', { count: 'exact', head: true }).in('status', ACTIVE_STATUSES).eq('technician_id', iagoProfile.id)
        : Promise.resolve({ count: 0 }),
      jeffersonProfile
        ? supabase.from('service_orders').select('id', { count: 'exact', head: true }).in('status', ACTIVE_STATUSES).eq('technician_id', jeffersonProfile.id)
        : Promise.resolve({ count: 0 }),
      supabase.from('service_orders').select('id', { count: 'exact', head: true }).in('status', ACTIVE_STATUSES).is('technician_id', null),
    ]);

  const orders = ordersRes.data;
  const error = ordersRes.error;

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const filtered = (orders ?? []).map((o) => ({
    ...o,
    customer_name: o.customer?.name ?? '(cliente removido)',
    customer_phone: o.customer?.phone ?? null,
    technician_name: o.technician?.full_name ?? null,
    technician_commission_rate: o.technician?.commission_rate ?? null,
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
            {params.status && params.status !== 'all' && ` // status: ${params.status}`}
            {params.tech && ` // bancada: ${params.tech}`}
          </p>
        </div>
        <Link
          href="/admin/os/new"
          className="bg-zinc-950 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 sm:hidden"
        >
          + Nova OS
        </Link>
      </div>

      {/* Placar Tático de Bancadas (Quem está com o quê) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border border-zinc-200 bg-zinc-50 p-3 rounded-lg font-mono text-xs shadow-2xs">
        <Link
          href="/admin/os"
          className={`flex flex-col p-2 rounded transition ${
            !params.tech || params.tech === 'all' ? 'bg-white border border-zinc-950 shadow-xs' : 'hover:bg-white'
          }`}
        >
          <span className="text-[10px] text-zinc-500 uppercase font-bold">Total Ativas</span>
          <span className="text-lg font-black text-zinc-950">{allActiveRes.count ?? 0}</span>
        </Link>
        <Link
          href="/admin/os?tech=iago"
          className={`flex flex-col p-2 rounded transition ${
            params.tech === 'iago' ? 'bg-emerald-50 border border-emerald-600 shadow-xs' : 'hover:bg-white'
          }`}
        >
          <span className="text-[10px] text-emerald-700 uppercase font-bold">💻 Térreo (Iago)</span>
          <span className="text-lg font-black text-emerald-950">{iagoActiveRes.count ?? 0}</span>
        </Link>
        <Link
          href="/admin/os?tech=jefferson"
          className={`flex flex-col p-2 rounded transition ${
            params.tech === 'jefferson' ? 'bg-purple-50 border border-purple-600 shadow-xs' : 'hover:bg-white'
          }`}
        >
          <span className="text-[10px] text-purple-700 uppercase font-bold">🔬 Mezanino (Jefferson)</span>
          <span className="text-lg font-black text-purple-950">{jeffersonActiveRes.count ?? 0}</span>
        </Link>
        <Link
          href="/admin/os?tech=unassigned"
          className={`flex flex-col p-2 rounded transition ${
            params.tech === 'unassigned' ? 'bg-amber-50 border border-amber-600 shadow-xs' : 'hover:bg-white'
          }`}
        >
          <span className="text-[10px] text-amber-700 uppercase font-bold">⚡ Livres (Puxar)</span>
          <span className="text-lg font-black text-amber-950">{unassignedActiveRes.count ?? 0}</span>
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
