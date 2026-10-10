import Link from 'next/link';
import { getAuthedProfile } from '@/app/admin/lib/auth';
import { OSCard } from '@/app/admin/components/OSCard';
import { OSFilter } from './OSFilter';
import { WARRANTY_DAYS } from '@/app/admin/types/database';
import { sanitizeSearchTerm, findMatchingCustomerIds } from '@/app/admin/lib/search';
import { getFridayCycleBounds } from '@/app/admin/lib/datetime';

export const dynamic = 'force-dynamic';

const ACTIVE_STATUSES = [
  'awaiting_approval',
  'approved',
  'in_progress',
  'waiting_part',
  'ready',
];

export default async function OSListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; tech?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user, profile } = await getAuthedProfile();
  if (!user) return null;

  const isTechnicianRole = profile?.role === 'technician';
  // Default inteligente: Técnico vê "Minhas OS" por padrão; Dono vê "Todas"
  const activeTech = params.tech ?? (isTechnicianRole ? 'me' : 'all');

  let query = supabase
    .from('service_orders')
    .select(`
      *,
      customer:customers(name, phone),
      technician:profiles!service_orders_technician_id_fkey(id, full_name)
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

  // Filtro de bancada / técnico
  if (activeTech === 'me') {
    query = query.eq('technician_id', user.id);
  } else if (activeTech === 'unassigned') {
    query = query.is('technician_id', null);
  } else if (activeTech && activeTech !== 'all') {
    query = query.eq('technician_id', activeTech);
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

  const isIago = (profile?.full_name || '').toLowerCase().includes('iago');
  const isJefferson = (profile?.full_name || '').toLowerCase().includes('jefferson');
  const fridayBounds = getFridayCycleBounds(new Date(), 0);

  // Executa query principal + contadores de bancada + lista de técnicos em paralelo
  const [
    { data: orders, error },
    { data: activeForCounts },
    { data: allTechProfiles },
    weekOrdersRes,
  ] = await Promise.all([
    query,
    supabase
      .from('service_orders')
      .select('id, technician_id')
      .in('status', ACTIVE_STATUSES),
    supabase
      .from('profiles')
      .select('id, full_name, role, active')
      .order('full_name'),
    (isIago || isJefferson)
      ? supabase
          .from('commission_ledger')
          .select('labor_amount, commission_rate, commission_amount, status, created_at')
          .eq('technician_id', user.id)
          .eq('status', 'pending')
      : Promise.resolve({ data: [] }),
  ]);

  let myFridayCommission: {
    total: number;
    osComm: number;
    fixedRate: number;
  } | null = null;

  if (isIago || isJefferson) {
    const rate = isIago ? 0.30 : 0.50;
    const ledgerRows = ((weekOrdersRes as { data?: Array<{ commission_amount: number | null }> })?.data ?? []);

    let osComm = 0;
    if (ledgerRows.length > 0) {
      osComm = ledgerRows.reduce(
        (acc, row) => acc + Number(row.commission_amount || 0),
        0,
      );
    } else {
      // Fallback para cálculo direto em service_orders caso o ledger ainda não tenha sido populado
      const { data: fallbackOrders } = await supabase
        .from('service_orders')
        .select('labor_cost, status, delivered_at, updated_at')
        .eq('technician_id', user.id)
        .in('status', ['ready', 'delivered']);

      const startMs = fridayBounds.start.getTime();
      const endMs = fridayBounds.end.getTime();

      const weekDeliveredOrders = (fallbackOrders ?? []).filter((row) => {
        const finishDateStr = row.delivered_at || row.updated_at;
        if (!finishDateStr) return false;
        const t = new Date(finishDateStr).getTime();
        return t >= startMs && t <= endMs;
      });

      osComm = weekDeliveredOrders.reduce(
        (acc, row) => {
          const labor = Number(row.labor_cost || 0);
          return acc + Math.round(labor * rate * 100) / 100;
        },
        0,
      );
    }

    const fixedRate = isIago ? 100 : 0;
    myFridayCommission = {
      total: Math.round((osComm + fixedRate) * 100) / 100,
      osComm: Math.round(osComm * 100) / 100,
      fixedRate,
    };
  }

  const activeRows = activeForCounts ?? [];
  const mineCount = activeRows.filter((r) => r.technician_id === user.id).length;
  const unassignedCount = activeRows.filter((r) => !r.technician_id).length;
  const allActiveCount = activeRows.length;

  const activeProfiles = (allTechProfiles ?? []).filter((p) => p.active !== false);
  const otherTechnicians = activeProfiles
    .filter((p) => p.id !== user.id)
    .map((p) => ({
      id: p.id,
      full_name: p.full_name,
      count: activeRows.filter((r) => r.technician_id === p.id).length,
    }));

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const filtered = (orders ?? []).map((o) => {
    const techObj = Array.isArray(o.technician) ? o.technician[0] : o.technician;
    return {
      ...o,
      customer_name: o.customer?.name ?? '(cliente removido)',
      customer_phone: o.customer?.phone ?? null,
      technician_name: techObj?.full_name ?? null,
      technician_commission_rate: null,
      days_since_update: Math.max(
        0,
        Math.floor((now - new Date(o.updated_at).getTime()) / 86400000),
      ),
    };
  });

  const activeTechLabel =
    activeTech === 'me'
      ? `Minha Bancada (${profile?.full_name ?? 'Você'})`
      : activeTech === 'unassigned'
        ? 'Sem Técnico Atribuído'
        : activeTech === 'all'
          ? 'Todas da Loja'
          : activeProfiles.find((p) => p.id === activeTech)?.full_name ?? 'Técnico';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-zinc-950 pb-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-950">
            Ordens de Serviço
          </h1>
          <p className="font-mono text-xs text-zinc-600">
            <strong>{activeTechLabel}</strong> · {filtered.length} resultado
            {filtered.length === 1 ? '' : 's'}
            {params.status && params.status !== 'all' && ` // status: ${params.status}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {myFridayCommission && (
            <Link
              href="/admin/comissoes"
              className="flex items-center gap-2 border-2 border-emerald-600 bg-emerald-50 px-3 py-1.5 font-mono text-xs font-bold text-emerald-950 hover:bg-emerald-100 transition shadow-xs"
              title="Clique para abrir o painel detalhado de Comissões"
            >
              <span className="text-sm">💰</span>
              <div>
                <span className="uppercase text-[10px] text-emerald-700 block leading-tight">
                  Minha Comissão (A Receber):
                </span>
                <span className="text-sm font-black text-emerald-950">
                  {myFridayCommission.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                {myFridayCommission.fixedRate > 0 && (
                  <span className="text-[10px] text-emerald-700 font-normal ml-1 hidden sm:inline">
                    ({myFridayCommission.osComm.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} OS + R$ {myFridayCommission.fixedRate} Fixo)
                  </span>
                )}
              </div>
              <span className="text-emerald-700 font-bold ml-0.5">→</span>
            </Link>
          )}
          <Link
            href="/admin/os/new"
            className="bg-zinc-950 px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800"
          >
            + Nova OS
          </Link>
        </div>
      </div>

      <OSFilter
        currentUserId={user.id}
        currentUserName={profile?.full_name ?? 'Você'}
        activeTech={activeTech}
        counts={{
          mine: mineCount,
          all: allActiveCount,
          unassigned: unassignedCount,
        }}
        otherTechnicians={otherTechnicians}
      />

      {error && (
        <div className="border-2 border-zinc-950 bg-zinc-100 p-3 font-mono text-xs font-bold text-zinc-950">
          [ERRO] Falha ao carregar OS: {error.message}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="border-2 border-dashed border-zinc-300 bg-white p-10 text-center space-y-3">
          {activeTech === 'me' && allActiveCount > 0 ? (
            <>
              <p className="font-mono text-sm font-bold text-zinc-800">
                Você não tem nenhuma OS atribuída à sua bancada neste filtro.
              </p>
              <p className="font-mono text-xs text-zinc-500">
                No momento existem <strong>{allActiveCount} OS ativas na loja</strong>
                {unassignedCount > 0 ? ` (sendo ${unassignedCount} aguardando técnico)` : ''}.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {unassignedCount > 0 && (
                  <Link
                    href="/admin/os?tech=unassigned"
                    className="inline-block border-2 border-amber-500 bg-amber-50 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-amber-950 hover:bg-amber-100"
                  >
                    ⚠️ Ver OS Sem Técnico ({unassignedCount})
                  </Link>
                )}
                <Link
                  href="/admin/os?tech=all"
                  className="inline-block bg-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800"
                >
                  🌐 Ver Todas da Loja ({allActiveCount}) →
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="font-mono text-sm text-zinc-600">
                Nenhuma OS encontrada com esses filtros.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {activeTech !== 'all' && (
                  <Link
                    href="/admin/os?tech=all"
                    className="inline-block border border-zinc-300 bg-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-800 hover:bg-zinc-100"
                  >
                    Ver Todas da Loja ({allActiveCount})
                  </Link>
                )}
                <Link
                  href="/admin/os/new"
                  className="inline-block bg-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800"
                >
                  Cadastrar Ordem de Serviço →
                </Link>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((so) => (
            <OSCard key={so.id} so={so} currentUserId={user.id} />
          ))}
        </div>
      )}
    </div>
  );
}
