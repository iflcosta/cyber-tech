import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthedProfile } from '@/app/admin/lib/auth';
import { PAYMENT_METHODS, getEquipmentTypeLabel } from '@/app/admin/types/database';
import { PixQRButton } from '@/app/admin/components/PixQRButton';
import { StatusBadge } from '@/app/admin/components/StatusBadge';
import { SalesChart } from './SalesChart';
import { formatDateTimeBR, startOfDayBR, startOfMonthBR } from '@/app/admin/lib/datetime';

const CHART_DAYS = 14;
const TZ = 'America/Sao_Paulo';

export const dynamic = 'force-dynamic';

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default async function DashboardPage() {
  const { supabase, user, profile } = await getAuthedProfile();
  if (!user) redirect('/admin/login');

  // Janelas de tempo — sempre no fuso de Brasília, não no fuso do
  // servidor (Vercel roda em UTC, o que fazia "hoje" começar 3h adiantado).
  const todayStart = startOfDayBR();
  const chartStart = new Date(todayStart.getTime() - (CHART_DAYS - 1) * 86400000);
  const monthStart = startOfMonthBR();

  // Busca vendas nao canceladas dos periodos + numeros de OS (em paralelo)
  const [
    salesLast14Days,
    salesMonth,
    lastSales,
    topItems,
    osOpen,
    osStale,
    osReady,
    osDeliveredMonth,
    partsOrderedMonth,
    partsAppliedMonth,
    partsReturnedMonth,
    partsOpenNow,
    staleList,
    readyList,
    unpaidList,
    partsWaitingList,
    activeBenchOS,
  ] = await Promise.all([
    // Uma query só cobre o gráfico E os cards "Hoje"/"Últimos 7 dias" —
    // ambos derivados por agregação em memória dos mesmos buckets diários
    // (ver abaixo), pra garantir que o número do card bate exatamente com
    // as barras do gráfico (antes eram duas queries com janelas de tempo
    // levemente diferentes).
    supabase
      .from('sales')
      .select('total, created_at')
      .is('voided_at', null)
      .gte('created_at', chartStart.toISOString()),
    supabase
      .from('sales')
      .select('total')
      .is('voided_at', null)
      .gte('created_at', monthStart.toISOString()),
    supabase
      .from('sales')
      .select(`
        *,
        author:profiles!sales_author_id_fkey(full_name)
      `)
      .is('voided_at', null)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('sale_items')
      .select('item_name, quantity, subtotal, sale:sales!inner(created_at, voided_at)')
      .gte('sale.created_at', monthStart.toISOString())
      .is('sale.voided_at', null)
      .limit(500),
    supabase
      .from('service_orders_with_stale')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('service_orders_with_stale')
      .select('id', { count: 'exact', head: true })
      .gte('days_since_update', 3),
    supabase
      .from('service_orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'ready'),
    supabase
      .from('service_orders')
      .select('labor_cost, estimated_value')
      .eq('status', 'delivered')
      .gte('delivered_at', monthStart.toISOString()),
    // Peças de fornecedores — fluxo TOTALMENTE separado de Vendas (PDV).
    // O que disso vira venda pro cliente é calculado à parte pelo dono.
    supabase
      .from('part_orders')
      .select('part_value, supplier:suppliers(name)')
      .neq('status', 'cancelled')
      .gte('created_at', monthStart.toISOString()),
    supabase
      .from('part_orders')
      .select('part_value')
      .eq('status', 'applied')
      .gte('updated_at', monthStart.toISOString()),
    supabase
      .from('part_orders')
      .select('part_value')
      .eq('status', 'returned')
      .gte('updated_at', monthStart.toISOString()),
    supabase
      .from('part_orders')
      .select('part_value, status')
      .in('status', ['ordered', 'received', 'return_pending', 'awaiting_exchange']),
    // Painel "hoje" — o que precisa de atenção, não só contador.
    supabase
      .from('service_orders_with_stale')
      .select('id, short_id, os_number, customer_name, days_since_update')
      .gte('days_since_update', 3)
      .order('days_since_update', { ascending: false })
      .limit(5),
    supabase
      .from('service_orders')
      .select('id, short_id, os_number, customer:customers(name), updated_at')
      .eq('status', 'ready')
      .order('updated_at', { ascending: true })
      .limit(5),
    supabase
      .from('service_orders')
      .select('id, short_id, os_number, customer:customers(name), delivered_at, labor_cost, estimated_value')
      .eq('status', 'delivered')
      .in('payment_status', ['pending', 'partial'])
      .order('delivered_at', { ascending: true })
      .limit(5),
    supabase
      .from('part_orders')
      .select('id, part_description, created_at, supplier:suppliers(name)')
      .eq('status', 'ordered')
      .order('created_at', { ascending: true })
      .limit(5),
    supabase
      .from('service_orders')
      .select('id, short_id, os_number, status, equipment_type, equipment_brand, equipment_model, estimated_value, labor_cost, technician_id, customer:customers(name)')
      .in('status', ['awaiting_approval', 'approved', 'in_progress', 'waiting_part', 'ready'])
      .order('updated_at', { ascending: false }),
  ]);

  // Numeros de OS
  const osOpenCount = osOpen.count ?? 0;
  const osStaleCount = osStale.count ?? 0;
  const osReadyCount = osReady.count ?? 0;
  const laborRevenueMonth = (osDeliveredMonth.data ?? []).reduce(
    (acc, o) => {
      const row = o as { labor_cost: number | null; estimated_value: number | null };
      const labor = Number(row.labor_cost ?? 0);
      const est = Number(row.estimated_value ?? 0);
      return acc + (labor > 0 ? labor : est);
    },
    0,
  );

  // Calcula totais
  const sumTotal = (rows: { total: number }[] | null) =>
    (rows ?? []).reduce((acc, r) => acc + Number(r.total), 0);

  const totalMonth = sumTotal(salesMonth.data);
  const countMonth = salesMonth.data?.length ?? 0;

  // Buckets diários (fuso de Brasília) — index 0 = há CHART_DAYS-1 dias,
  // index CHART_DAYS-1 = hoje. Alimenta o gráfico E os cards de "Hoje"/
  // "Últimos 7 dias" (ver comentário na query acima).
  const dayBuckets = Array.from({ length: CHART_DAYS }, (_, i) => {
    const start = new Date(chartStart.getTime() + i * 86400000);
    return {
      start,
      weekday: new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, weekday: 'short' })
        .format(start)
        .replace('.', ''),
      dateLabel: new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit' }).format(start),
      total: 0,
      count: 0,
    };
  });
  for (const row of salesLast14Days.data ?? []) {
    const idx = Math.round((new Date(row.created_at).getTime() - chartStart.getTime()) / 86400000);
    if (idx >= 0 && idx < CHART_DAYS) {
      dayBuckets[idx].total += Number(row.total);
      dayBuckets[idx].count += 1;
    }
  }
  const todayBucket = dayBuckets[CHART_DAYS - 1];
  const yesterdayBucket = dayBuckets[CHART_DAYS - 2];
  const last7 = dayBuckets.slice(CHART_DAYS - 7);
  const prev7 = dayBuckets.slice(CHART_DAYS - 14, CHART_DAYS - 7);

  const totalToday = todayBucket.total;
  const countToday = todayBucket.count;
  const totalWeek = last7.reduce((acc, d) => acc + d.total, 0);
  const countWeek = last7.reduce((acc, d) => acc + d.count, 0);
  const totalPrevWeek = prev7.reduce((acc, d) => acc + d.total, 0);

  // Variação % vs período anterior — só mostra se o período anterior teve
  // alguma venda (senão a % "explode" pra um número sem sentido tipo
  // +∞% quando ontem foi 0 e hoje não).
  const trend = (curr: number, prev: number): { pct: number; up: boolean } | null => {
    if (prev <= 0) return null;
    const pct = Math.round(((curr - prev) / prev) * 100);
    return { pct, up: pct >= 0 };
  };
  const todayTrend = trend(totalToday, yesterdayBucket.total);
  const weekTrend = trend(totalWeek, totalPrevWeek);

  const chartData = dayBuckets.map((d, i) => ({
    weekday: d.weekday,
    dateLabel: d.dateLabel,
    total: d.total,
    isToday: i === CHART_DAYS - 1,
  }));

  // Top 5 itens vendidos no mes
  const itemAgg = new Map<string, { name: string; qty: number; total: number }>();
  for (const row of topItems.data ?? []) {
    const key = row.item_name;
    const existing = itemAgg.get(key);
    if (existing) {
      existing.qty += row.quantity;
      existing.total += Number(row.subtotal);
    } else {
      itemAgg.set(key, {
        name: row.item_name,
        qty: row.quantity,
        total: Number(row.subtotal),
      });
    }
  }
  const topItemsSorted = Array.from(itemAgg.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Peças de fornecedores — totais do mês + em aberto agora.
  const sumPartValue = (rows: { part_value: number }[] | null) =>
    (rows ?? []).reduce((acc, r) => acc + Number(r.part_value), 0);

  const partsOrderedTotal = sumPartValue(partsOrderedMonth.data);
  const partsOrderedCount = partsOrderedMonth.data?.length ?? 0;
  const partsAppliedTotal = sumPartValue(partsAppliedMonth.data);
  const partsAppliedCount = partsAppliedMonth.data?.length ?? 0;
  const partsReturnedTotal = sumPartValue(partsReturnedMonth.data);
  const partsReturnedCount = partsReturnedMonth.data?.length ?? 0;
  const partsOpenTotal = sumPartValue(partsOpenNow.data);
  const partsOpenCount = partsOpenNow.data?.length ?? 0;

  // Pedido no mês, por fornecedor (pra reconciliação — quanto foi
  // encomendado de cada um, sem misturar com venda nenhuma).
  const supplierAgg = new Map<string, { name: string; total: number; count: number }>();
  for (const row of (partsOrderedMonth.data ?? []) as unknown as {
    part_value: number;
    supplier: { name: string } | null;
  }[]) {
    const name = row.supplier?.name ?? '(fornecedor removido)';
    const existing = supplierAgg.get(name);
    if (existing) {
      existing.total += Number(row.part_value);
      existing.count += 1;
    } else {
      supplierAgg.set(name, { name, total: Number(row.part_value), count: 1 });
    }
  }
  const supplierTotalsSorted = Array.from(supplierAgg.values()).sort((a, b) => b.total - a.total);

  // Painel "hoje" — normaliza cada lista (join vira campo direto) e
  // calcula "há quantos dias" onde faz sentido. "agora" lido uma vez só
  // (Server Component, sem re-render no cliente) — Date.now() aqui é
  // seguro, o linter de pureza só não distingue Server de Client.
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  const daysAgo = (dateStr: string) =>
    Math.max(0, Math.floor((nowMs - new Date(dateStr).getTime()) / 86400000));

  // Selects com join via string (não a sintaxe de query builder tipado)
  // fazem o supabase-js inferir a cardinalidade errada (array em vez de
  // 1:1) — cast pro formato real, mesmo padrão já usado alhures no ERP
  // pra esse mesmo tipo de select.
  type ReadyRow = { id: string; short_id: string | null; os_number: string | null; customer: { name: string } | null; updated_at: string };
  type UnpaidRow = { id: string; short_id: string | null; os_number: string | null; customer: { name: string } | null; delivered_at: string | null; labor_cost: number; estimated_value: number | null };
  type PartWaitingRow = { id: string; part_description: string; created_at: string; supplier: { name: string } | null };

  const readyItems = ((readyList.data ?? []) as unknown as ReadyRow[]).map((o) => ({
    ...o,
    customer_name: o.customer?.name ?? '(cliente removido)',
    daysReady: daysAgo(o.updated_at),
  }));
  const unpaidItems = ((unpaidList.data ?? []) as unknown as UnpaidRow[]).map((o) => ({
    ...o,
    customer_name: o.customer?.name ?? '(cliente removido)',
    daysUnpaid: o.delivered_at ? daysAgo(o.delivered_at) : 0,
  }));
  const partsWaitingItems = ((partsWaitingList.data ?? []) as unknown as PartWaitingRow[]).map((p) => ({
    ...p,
    supplier_name: p.supplier?.name ?? '(fornecedor removido)',
    daysWaiting: daysAgo(p.created_at),
  }));
  const staleItems = staleList.data ?? [];

  const attentionCount =
    staleItems.length + readyItems.length + unpaidItems.length + partsWaitingItems.length;

  type BenchRow = {
    id: string;
    short_id: string | null;
    os_number: string | null;
    status: string;
    equipment_type: string | null;
    equipment_brand: string | null;
    equipment_model: string | null;
    estimated_value: number | null;
    labor_cost: number;
    technician_id: string | null;
    customer: { name: string } | null;
  };

  const allBenchItems = ((activeBenchOS.data ?? []) as unknown as BenchRow[]).map((o) => ({
    ...o,
    customer_name: o.customer?.name ?? '(cliente removido)',
  }));

  const myBenchItems = allBenchItems.filter((o) => o.technician_id === user.id);
  const unassignedBenchCount = allBenchItems.filter((o) => !o.technician_id).length;

  const myTriagemCount = myBenchItems.filter(
    (o) =>
      o.status === 'awaiting_approval' &&
      (o.estimated_value === null || Number(o.estimated_value) <= 0) &&
      Number(o.labor_cost ?? 0) <= 0,
  ).length;
  const myOrcamentoCount = myBenchItems.filter(
    (o) => o.status === 'awaiting_approval',
  ).length - myTriagemCount;
  const myManutencaoCount = myBenchItems.filter(
    (o) => o.status === 'approved' || o.status === 'in_progress' || o.status === 'waiting_part',
  ).length;
  const myProntasCount = myBenchItems.filter((o) => o.status === 'ready').length;

  const currentUserName =
    profile?.full_name || user.email?.split('@')[0] || 'Técnico';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-zinc-950 pb-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-950">Dashboard</h1>
          <p className="text-xs font-mono uppercase text-zinc-600">
            Resumo da operação e telemetria de bancada.
          </p>
        </div>
        <PixQRButton
          buttonLabel="PIX avulso"
          description="Pagamento avulso Cyber Informática"
          buttonClassName="inline-flex items-center gap-2 border border-zinc-300 bg-white px-3 py-2 font-mono text-xs font-bold uppercase text-zinc-950 hover:border-zinc-950 hover:bg-zinc-100 transition shadow-sm"
        />
      </div>

      {/* Minha Bancada — atalho rápido para as OS atribuídas ao usuário logado */}
      <section className="border-2 border-zinc-950 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center border border-zinc-950 bg-zinc-950 text-sm text-white">
              🔧
            </span>
            <div>
              <h2 className="text-sm font-black uppercase tracking-tight text-zinc-950">
                Minha Bancada ({currentUserName})
              </h2>
              <p className="text-xs font-mono uppercase text-zinc-600">
                OS ativas atribuídas diretamente a você
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {unassignedBenchCount > 0 && (
              <Link
                href="/admin/os?tech=unassigned"
                className="inline-flex items-center gap-1.5 border border-amber-400 bg-amber-50 px-3 py-1.5 font-mono text-xs font-bold uppercase text-amber-900 hover:bg-amber-100"
              >
                ⚠️ {unassignedBenchCount} sem técnico
              </Link>
            )}
            <Link
              href="/admin/os?tech=me"
              className="inline-flex items-center gap-1.5 border border-zinc-950 bg-zinc-950 px-3 py-1.5 font-mono text-xs font-bold uppercase text-white hover:bg-zinc-800 transition"
            >
              Ver minhas OS ({myBenchItems.length}) →
            </Link>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Link
            href="/admin/os?tech=me&status=awaiting_diagnosis"
            className="border border-zinc-300 bg-zinc-50 p-3 transition hover:border-zinc-950 hover:bg-zinc-100"
          >
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-600">
              Em Triagem
            </p>
            <p className="mt-1 text-xl font-black font-mono text-zinc-950">{myTriagemCount}</p>
          </Link>
          <Link
            href="/admin/os?tech=me&status=awaiting_approval"
            className="border border-zinc-300 bg-zinc-50 p-3 transition hover:border-zinc-950 hover:bg-zinc-100"
          >
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-600">
              Aguard. Aprovação
            </p>
            <p className="mt-1 text-xl font-black font-mono text-zinc-950">{myOrcamentoCount}</p>
          </Link>
          <Link
            href="/admin/os?tech=me&status=in_progress"
            className="border border-zinc-300 bg-zinc-50 p-3 transition hover:border-zinc-950 hover:bg-zinc-100"
          >
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-600">
              Em Reparo / Peça
            </p>
            <p className="mt-1 text-xl font-black font-mono text-zinc-950">{myManutencaoCount}</p>
          </Link>
          <Link
            href="/admin/os?tech=me&status=ready"
            className="border border-zinc-300 bg-zinc-50 p-3 transition hover:border-zinc-950 hover:bg-zinc-100"
          >
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-600">
              Prontas
            </p>
            <p className="mt-1 text-xl font-black font-mono text-emerald-700">{myProntasCount}</p>
          </Link>
        </div>

        {myBenchItems.length > 0 ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {myBenchItems.slice(0, 4).map((o) => {
              const eqLabel = [
                getEquipmentTypeLabel(o.equipment_type),
                o.equipment_brand,
                o.equipment_model,
              ]
                .filter(Boolean)
                .join(' ');
              const isTriagem =
                o.status === 'awaiting_approval' &&
                (o.estimated_value === null || Number(o.estimated_value) <= 0) &&
                Number(o.labor_cost ?? 0) <= 0;
              return (
                <Link
                  key={o.id}
                  href={`/admin/os/${o.id}`}
                  className="flex items-center justify-between gap-2 border border-zinc-300 bg-white px-3 py-2 text-xs transition hover:border-zinc-950 hover:bg-zinc-50"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-zinc-950">
                        {o.short_id ?? o.os_number}
                      </span>
                      <span className="truncate font-medium text-zinc-800">
                        {o.customer_name}
                      </span>
                    </div>
                    <p className="truncate text-[11px] font-mono text-zinc-500">
                      {eqLabel || 'Equipamento'}
                    </p>
                  </div>
                  <StatusBadge
                    status={o.status}
                    hasQuote={!isTriagem}
                  />
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-xs font-mono text-zinc-500">
            Nenhuma OS ativa atribuída a você no momento.{' '}
            {unassignedBenchCount > 0 && (
              <Link
                href="/admin/os?tech=unassigned"
                className="font-bold text-amber-700 underline hover:text-amber-800"
              >
                Ver {unassignedBenchCount} OS aguardando atribuição →
              </Link>
            )}
          </p>
        )}
      </section>

      {/* Painel "hoje" — o que precisa de atenção */}
      {attentionCount > 0 && (
        <section className="border-2 border-amber-500 bg-amber-50/60 p-4 sm:p-5">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-900">
            ⚠️ Precisa de atenção hoje
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {staleItems.length > 0 && (
              <div className="border border-amber-300 bg-white p-3 font-mono">
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-700">
                  OS parada
                </p>
                <ul className="mt-1.5 space-y-1">
                  {staleItems.map((o) => (
                    <li key={o.id}>
                      <Link href={`/admin/os/${o.id}`} className="flex items-center justify-between gap-2 text-xs hover:underline">
                        <span className="truncate">
                          <span className="font-bold text-zinc-950">{o.short_id ?? o.os_number}</span>
                          {' '}{o.customer_name}
                        </span>
                        <span className="shrink-0 text-xs font-bold text-amber-700">{o.days_since_update}d</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {readyItems.length > 0 && (
              <div className="border border-amber-300 bg-white p-3 font-mono">
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-700">
                  Pronta, sem retirada
                </p>
                <ul className="mt-1.5 space-y-1">
                  {readyItems.map((o) => (
                    <li key={o.id}>
                      <Link href={`/admin/os/${o.id}`} className="flex items-center justify-between gap-2 text-xs hover:underline">
                        <span className="truncate">
                          <span className="font-bold text-zinc-950">{o.short_id ?? o.os_number}</span>
                          {' '}{o.customer_name}
                        </span>
                        <span className="shrink-0 text-xs font-bold text-amber-700">{o.daysReady}d</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {unpaidItems.length > 0 && (
              <div className="border border-amber-300 bg-white p-3 font-mono">
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-700">
                  Entregue, não pago
                </p>
                <ul className="mt-1.5 space-y-1">
                  {unpaidItems.map((o) => (
                    <li key={o.id}>
                      <Link href={`/admin/os/${o.id}`} className="flex items-center justify-between gap-2 text-xs hover:underline">
                        <span className="truncate">
                          <span className="font-bold text-zinc-950">{o.short_id ?? o.os_number}</span>
                          {' '}{o.customer_name}
                        </span>
                        <span className="shrink-0 text-xs font-bold text-amber-700">{o.daysUnpaid}d</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {partsWaitingItems.length > 0 && (
              <div className="border border-amber-300 bg-white p-3 font-mono">
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-700">
                  Peça pedida, sem chegar
                </p>
                <ul className="mt-1.5 space-y-1">
                  {partsWaitingItems.map((p) => (
                    <li key={p.id}>
                      <Link href={`/admin/pecas/${p.id}`} className="flex items-center justify-between gap-2 text-xs hover:underline">
                        <span className="truncate">
                          {p.part_description} <span className="text-zinc-500">· {p.supplier_name}</span>
                        </span>
                        <span className="shrink-0 text-xs font-bold text-amber-700">{p.daysWaiting}d</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Numeros da bancada (OS) */}
      <section>
        <h2 className="mb-2 text-xs font-mono font-bold uppercase tracking-wider text-zinc-600">
          Bancada
        </h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <Link
            href="/admin/os"
            className="block border-2 border-zinc-950 bg-white p-4 transition hover:bg-zinc-50 shadow-sm"
          >
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-600">Abertas</p>
            <p className="mt-1 text-2xl font-black font-mono text-zinc-950">{osOpenCount}</p>
          </Link>
          <Link
            href="/admin/os?status=all"
            className={`block border-2 p-4 transition hover:bg-zinc-50 shadow-sm ${
              osStaleCount > 0 ? 'border-amber-500 bg-amber-50' : 'border-zinc-950 bg-white'
            }`}
          >
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-600">
              Paradas (≥ 3 dias)
            </p>
            <p className={`mt-1 text-2xl font-black font-mono ${osStaleCount > 0 ? 'text-amber-800' : 'text-zinc-950'}`}>
              {osStaleCount}
            </p>
          </Link>
          <Link
            href="/admin/os?status=ready"
            className="block border-2 border-zinc-950 bg-white p-4 transition hover:bg-zinc-50 shadow-sm"
          >
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-600">
              Prontas p/ retirada
            </p>
            <p className="mt-1 text-2xl font-black font-mono text-zinc-950">{osReadyCount}</p>
          </Link>
          <div className="block border-2 border-zinc-950 bg-zinc-50 p-4 shadow-sm">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-600">
              Serviços / Mão de obra (mês)
            </p>
            <p className="mt-1 text-2xl font-black font-mono text-zinc-950">{fmtBRL(laborRevenueMonth)}</p>
          </div>
        </div>
      </section>

      {/* Vendas */}
      <section>
        <h2 className="mb-2 text-xs font-mono font-bold uppercase tracking-wider text-zinc-600">
          Vendas (PDV)
        </h2>
        <div className="border-2 border-zinc-950 bg-white p-4 sm:p-5 shadow-sm">
          <p className="mb-2 text-xs font-mono uppercase text-zinc-600">Últimos {CHART_DAYS} dias</p>
          <SalesChart data={chartData} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Card
            title="Hoje"
            total={totalToday}
            count={countToday}
            trend={todayTrend}
            trendLabel="vs. ontem"
            href={`/admin/vendas?from=${todayStart.toISOString().slice(0, 10)}&to=${todayStart.toISOString().slice(0, 10)}`}
          />
          <Card
            title="Últimos 7 dias"
            total={totalWeek}
            count={countWeek}
            trend={weekTrend}
            trendLabel="vs. 7 dias anteriores"
            href={`/admin/vendas?from=${dayBuckets[CHART_DAYS - 7].start.toISOString().slice(0, 10)}`}
          />
          <Card
            title="Este mês"
            total={totalMonth}
            count={countMonth}
            href={`/admin/vendas?from=${monthStart.toISOString().slice(0, 10)}`}
          />
        </div>
      </section>

      {/* Peças de fornecedores */}
      <section>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-600">
            Peças de fornecedores
          </h2>
          <Link
            href="/admin/pecas"
            className="text-xs font-mono font-bold uppercase text-zinc-950 hover:underline"
          >
            Ver todos →
          </Link>
        </div>
        <p className="mt-1 text-xs font-mono text-zinc-500">
          Fluxo de encomendas a fornecedores — não é venda direta.
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-4">
          <div className="border-2 border-zinc-950 bg-zinc-50 p-4 shadow-sm">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-600">
              Pedido (mês)
            </p>
            <p className="mt-1 text-2xl font-black font-mono text-zinc-950">{fmtBRL(partsOrderedTotal)}</p>
            <p className="mt-1 text-xs font-mono text-zinc-600">
              {partsOrderedCount} pedido{partsOrderedCount === 1 ? '' : 's'}
            </p>
          </div>
          <div className="border-2 border-zinc-950 bg-zinc-50 p-4 shadow-sm">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-600">
              Aplicado (mês)
            </p>
            <p className="mt-1 text-2xl font-black font-mono text-zinc-950">{fmtBRL(partsAppliedTotal)}</p>
            <p className="mt-1 text-xs font-mono text-zinc-600">
              {partsAppliedCount} peça{partsAppliedCount === 1 ? '' : 's'} usada{partsAppliedCount === 1 ? '' : 's'}
            </p>
          </div>
          <div className="border-2 border-zinc-950 bg-zinc-50 p-4 shadow-sm">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-600">
              Devolvido (mês)
            </p>
            <p className="mt-1 text-2xl font-black font-mono text-zinc-700">{fmtBRL(partsReturnedTotal)}</p>
            <p className="mt-1 text-xs font-mono text-zinc-600">
              {partsReturnedCount} devolução{partsReturnedCount === 1 ? '' : 's'}
            </p>
          </div>
          <Link
            href="/admin/pecas"
            className={`block border-2 p-4 transition hover:bg-zinc-50 shadow-sm ${
              partsOpenCount > 0 ? 'border-amber-500 bg-amber-50' : 'border-zinc-950 bg-white'
            }`}
          >
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-600">
              Em aberto agora
            </p>
            <p className={`mt-1 text-2xl font-black font-mono ${partsOpenCount > 0 ? 'text-amber-800' : 'text-zinc-950'}`}>
              {fmtBRL(partsOpenTotal)}
            </p>
            <p className="mt-1 text-xs font-mono text-zinc-600">
              {partsOpenCount} pedido{partsOpenCount === 1 ? '' : 's'} não resolvido{partsOpenCount === 1 ? '' : 's'}
            </p>
          </Link>
        </div>

        {supplierTotalsSorted.length > 0 && (
          <div className="mt-3 border-2 border-zinc-950 bg-white p-4 sm:p-5 shadow-sm">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-600">
              Pedido no mês, por fornecedor
            </h3>
            <ul className="mt-2 divide-y divide-zinc-200">
              {supplierTotalsSorted.map((s) => (
                <li key={s.name} className="flex items-center justify-between gap-3 py-1.5 text-sm font-mono">
                  <span className="font-bold text-zinc-950">{s.name}</span>
                  <span className="flex items-center gap-3 text-xs">
                    <span className="text-zinc-500">
                      {s.count} pedido{s.count === 1 ? '' : 's'}
                    </span>
                    <span className="font-bold text-zinc-950">{fmtBRL(s.total)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Top itens vendidos no mes */}
      <section className="border-2 border-zinc-950 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-950">
            Top 5 itens vendidos (este mês)
          </h2>
          <span className="font-mono text-xs text-zinc-500">
            {topItemsSorted.length} {topItemsSorted.length === 1 ? 'item' : 'itens'}
          </span>
        </div>
        {topItemsSorted.length === 0 ? (
          <p className="mt-3 font-mono text-xs text-zinc-500">
            Nenhuma venda no mês ainda.
          </p>
        ) : (
          <ol className="mt-3 divide-y divide-zinc-100">
            {topItemsSorted.map((item, i) => (
              <li
                key={item.name}
                className="flex items-center justify-between gap-3 py-2 text-sm font-mono"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center border border-zinc-950 bg-zinc-950 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="font-bold text-zinc-950">{item.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-zinc-500">{item.qty} un</span>
                  <span className="font-bold text-zinc-950">
                    {fmtBRL(item.total)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Últimas vendas */}
      <section className="border-2 border-zinc-950 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-950">
            Últimas vendas
          </h2>
          <Link
            href="/admin/vendas"
            className="text-xs font-mono font-bold uppercase text-zinc-950 hover:underline"
          >
            Ver todas →
          </Link>
        </div>
        {(lastSales.data ?? []).length === 0 ? (
          <p className="mt-3 font-mono text-xs text-zinc-500">Nenhuma venda ainda.</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-200">
            {(lastSales.data ?? []).map((s) => {
              const payMeta = PAYMENT_METHODS.find((m) => m.value === s.payment_method);
              return (
                <li key={s.id} className="flex items-center justify-between gap-2 py-2 text-sm font-mono">
                  <div className="flex-1">
                    <Link
                      href={`/admin/vendas/${s.id}`}
                      className="font-bold text-zinc-950 hover:underline"
                    >
                      {s.sale_number}
                    </Link>
                    <p className="text-xs text-zinc-500">
                      {formatDateTimeBR(s.created_at)} ·{' '}
                      {s.author?.full_name ?? '—'} · {payMeta?.label ?? s.payment_method}
                      {s.customer_name && ` · ${s.customer_name}`}
                    </p>
                  </div>
                  <span className="font-bold text-zinc-950">
                    {fmtBRL(s.total)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Card({
  title,
  total,
  count,
  trend,
  trendLabel,
  href,
}: {
  title: string;
  total: number;
  count: number;
  /** null = sem período anterior pra comparar (não mostra nada) */
  trend?: { pct: number; up: boolean } | null;
  trendLabel?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block border-2 border-zinc-950 bg-white p-4 transition hover:bg-zinc-50 shadow-sm"
    >
      <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-600">
        {title}
      </p>
      <p className="mt-1 text-2xl font-black font-mono text-zinc-950">{fmtBRL(total)}</p>
      <p className="mt-1 text-xs font-mono text-zinc-600">
        {count} venda{count === 1 ? '' : 's'}
        {trend && (
          <span className={`ml-2 font-bold ${trend.up ? 'text-emerald-700' : 'text-red-600'}`}>
            {trend.up ? '▲' : '▼'} {Math.abs(trend.pct)}% {trendLabel}
          </span>
        )}
      </p>
    </Link>
  );
}
