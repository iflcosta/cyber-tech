import Link from 'next/link';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { PAYMENT_METHODS } from '@/app/admin/types/database';
import { PixQRButton } from '@/app/admin/components/PixQRButton';
import { SalesChart } from './SalesChart';
import { formatDateTimeBR, startOfDayBR, startOfMonthBR } from '@/app/admin/lib/datetime';

const CHART_DAYS = 14;
const TZ = 'America/Sao_Paulo';

export const dynamic = 'force-dynamic';

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default async function DashboardPage() {
  const { supabase, user } = await getAuthedUser();
  if (!user) return null;

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
      .select('labor_cost')
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
  ]);

  // Numeros de OS
  const osOpenCount = osOpen.count ?? 0;
  const osStaleCount = osStale.count ?? 0;
  const osReadyCount = osReady.count ?? 0;
  const laborRevenueMonth = (osDeliveredMonth.data ?? []).reduce(
    (acc, o) => acc + Number((o as { labor_cost: number }).labor_cost ?? 0),
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Resumo rapido do movimento da loja.
          </p>
        </div>
        <PixQRButton
          buttonLabel="PIX avulso"
          description="Pagamento avulso Cyber Informatica"
          buttonClassName="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        />
      </div>

      {/* Painel "hoje" — o que precisa de atenção, não só contador. Os
          cards de números abaixo já existiam; isso junta o que dá pra
          fazer alguma coisa a respeito agora, num lugar só. */}
      {attentionCount > 0 && (
        <section className="rounded-lg border-2 border-orange-200 bg-orange-50/60 p-4 sm:p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-orange-800">
            ⚠️ Precisa de atenção hoje
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {staleItems.length > 0 && (
              <div className="rounded-lg border border-orange-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  OS parada
                </p>
                <ul className="mt-1.5 space-y-1">
                  {staleItems.map((o) => (
                    <li key={o.id}>
                      <Link href={`/admin/os/${o.id}`} className="flex items-center justify-between gap-2 text-sm hover:text-blue-700">
                        <span className="truncate">
                          <span className="font-mono font-medium">{o.short_id ?? o.os_number}</span>
                          {' '}{o.customer_name}
                        </span>
                        <span className="shrink-0 text-xs text-orange-700">{o.days_since_update}d</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {readyItems.length > 0 && (
              <div className="rounded-lg border border-orange-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Pronta, sem retirada
                </p>
                <ul className="mt-1.5 space-y-1">
                  {readyItems.map((o) => (
                    <li key={o.id}>
                      <Link href={`/admin/os/${o.id}`} className="flex items-center justify-between gap-2 text-sm hover:text-blue-700">
                        <span className="truncate">
                          <span className="font-mono font-medium">{o.short_id ?? o.os_number}</span>
                          {' '}{o.customer_name}
                        </span>
                        <span className="shrink-0 text-xs text-orange-700">{o.daysReady}d</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {unpaidItems.length > 0 && (
              <div className="rounded-lg border border-orange-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Entregue, não pago
                </p>
                <ul className="mt-1.5 space-y-1">
                  {unpaidItems.map((o) => (
                    <li key={o.id}>
                      <Link href={`/admin/os/${o.id}`} className="flex items-center justify-between gap-2 text-sm hover:text-blue-700">
                        <span className="truncate">
                          <span className="font-mono font-medium">{o.short_id ?? o.os_number}</span>
                          {' '}{o.customer_name}
                        </span>
                        <span className="shrink-0 text-xs text-orange-700">{o.daysUnpaid}d</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {partsWaitingItems.length > 0 && (
              <div className="rounded-lg border border-orange-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Peça pedida, sem chegar
                </p>
                <ul className="mt-1.5 space-y-1">
                  {partsWaitingItems.map((p) => (
                    <li key={p.id}>
                      <Link href={`/admin/pecas/${p.id}`} className="flex items-center justify-between gap-2 text-sm hover:text-blue-700">
                        <span className="truncate">
                          {p.part_description} <span className="text-slate-500">· {p.supplier_name}</span>
                        </span>
                        <span className="shrink-0 text-xs text-orange-700">{p.daysWaiting}d</span>
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
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Bancada
        </h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <Link
            href="/admin/os"
            className="block rounded-lg border-2 border-slate-200 bg-white p-4 transition hover:shadow-md"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Abertas</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{osOpenCount}</p>
          </Link>
          <Link
            href="/admin/os?status=all"
            className={`block rounded-lg border-2 p-4 transition hover:shadow-md ${
              osStaleCount > 0 ? 'border-orange-200 bg-orange-50' : 'border-slate-200 bg-white'
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Paradas (≥ 3 dias)
            </p>
            <p className={`mt-1 text-2xl font-bold ${osStaleCount > 0 ? 'text-orange-700' : 'text-slate-900'}`}>
              {osStaleCount}
            </p>
          </Link>
          <Link
            href="/admin/os?status=ready"
            className="block rounded-lg border-2 border-emerald-200 bg-emerald-50 p-4 transition hover:shadow-md"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Prontas p/ retirada
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{osReadyCount}</p>
          </Link>
          <div className="block rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Mão de obra (mês)
            </p>
            <p className="mt-1 text-2xl font-bold text-blue-700">{fmtBRL(laborRevenueMonth)}</p>
          </div>
        </div>
      </section>

      {/* Vendas: gráfico primeiro (visão geral da tendência), cards de
          totais depois (números exatos + comparação vs período anterior).
          Todos os 3 cards usam a mesma cor — são a mesma métrica em 3
          janelas de tempo diferentes, não categorias diferentes; variar a
          cor aqui só criava a impressão de que eram coisas distintas. */}
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Vendas (PDV)
        </h2>
        <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
          <p className="mb-2 text-xs font-medium text-slate-500">Últimos {CHART_DAYS} dias</p>
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

      {/* Peças de fornecedores — SEPARADO de Vendas (PDV) de propósito.
          Isso não é receita nem é venda: é o que a loja encomendou de
          fornecedor pra consertar OS de cliente. O que disso vira venda
          o dono calcula à parte, por fora daqui. */}
      <section>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Peças de fornecedores
          </h2>
          <Link
            href="/admin/pecas"
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Ver todos →
          </Link>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Fluxo de encomendas a fornecedores — não é venda. O que vira venda pro cliente, o dono calcula à parte.
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg border-2 border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Pedido (mês)
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{fmtBRL(partsOrderedTotal)}</p>
            <p className="mt-1 text-xs text-slate-600">
              {partsOrderedCount} pedido{partsOrderedCount === 1 ? '' : 's'}
            </p>
          </div>
          <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Aplicado (mês)
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{fmtBRL(partsAppliedTotal)}</p>
            <p className="mt-1 text-xs text-slate-600">
              {partsAppliedCount} peça{partsAppliedCount === 1 ? '' : 's'} usada{partsAppliedCount === 1 ? '' : 's'}
            </p>
          </div>
          <div className="rounded-lg border-2 border-slate-300 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Devolvido (mês)
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-700">{fmtBRL(partsReturnedTotal)}</p>
            <p className="mt-1 text-xs text-slate-600">
              {partsReturnedCount} devolução{partsReturnedCount === 1 ? '' : 's'}
            </p>
          </div>
          <Link
            href="/admin/pecas"
            className={`block rounded-lg border-2 p-4 transition hover:shadow-md ${
              partsOpenCount > 0 ? 'border-orange-200 bg-orange-50' : 'border-slate-200 bg-white'
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Em aberto agora
            </p>
            <p className={`mt-1 text-2xl font-bold ${partsOpenCount > 0 ? 'text-orange-700' : 'text-slate-900'}`}>
              {fmtBRL(partsOpenTotal)}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {partsOpenCount} pedido{partsOpenCount === 1 ? '' : 's'} não resolvido{partsOpenCount === 1 ? '' : 's'}
            </p>
          </Link>
        </div>

        {supplierTotalsSorted.length > 0 && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Pedido no mês, por fornecedor
            </h3>
            <ul className="mt-2 divide-y divide-slate-200">
              {supplierTotalsSorted.map((s) => (
                <li key={s.name} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                  <span className="text-slate-900">{s.name}</span>
                  <span className="flex items-center gap-3 text-xs">
                    <span className="text-slate-500">
                      {s.count} pedido{s.count === 1 ? '' : 's'}
                    </span>
                    <span className="font-mono font-medium text-slate-900">{fmtBRL(s.total)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Top itens vendidos no mes */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Top 5 itens vendidos (este mês)
          </h2>
          <span className="text-xs text-slate-500">
            {topItemsSorted.length} {topItemsSorted.length === 1 ? 'item' : 'itens'}
          </span>
        </div>
        {topItemsSorted.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Nenhuma venda no mes ainda.
          </p>
        ) : (
          <ol className="mt-3 space-y-2">
            {topItemsSorted.map((item, i) => (
              <li
                key={item.name}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                    {i + 1}
                  </span>
                  <span className="font-medium text-slate-900">{item.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-500">{item.qty} un</span>
                  <span className="font-mono font-medium text-slate-900">
                    {fmtBRL(item.total)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Últimas vendas */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Últimas vendas
          </h2>
          <Link
            href="/admin/vendas"
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Ver todas →
          </Link>
        </div>
        {(lastSales.data ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Nenhuma venda ainda.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-200">
            {(lastSales.data ?? []).map((s) => {
              const payMeta = PAYMENT_METHODS.find((m) => m.value === s.payment_method);
              return (
                <li key={s.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <div className="flex-1">
                    <Link
                      href={`/admin/vendas/${s.id}`}
                      className="font-mono font-medium text-slate-900 hover:text-blue-700"
                    >
                      {s.sale_number}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {formatDateTimeBR(s.created_at)} ·{' '}
                      {s.author?.full_name ?? '—'} · {payMeta?.label ?? s.payment_method}
                      {s.customer_name && ` · ${s.customer_name}`}
                    </p>
                  </div>
                  <span className="font-mono font-medium text-slate-900">
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
      className="block rounded-lg border-2 border-blue-200 bg-blue-50 p-4 transition hover:shadow-md"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
        {title}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{fmtBRL(total)}</p>
      <p className="mt-1 text-xs text-slate-600">
        {count} venda{count === 1 ? '' : 's'}
        {trend && (
          <span className={`ml-2 font-medium ${trend.up ? 'text-emerald-700' : 'text-red-600'}`}>
            {trend.up ? '▲' : '▼'} {Math.abs(trend.pct)}% {trendLabel}
          </span>
        )}
      </p>
    </Link>
  );
}
