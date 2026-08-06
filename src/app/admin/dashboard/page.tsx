import Link from 'next/link';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { PAYMENT_METHODS } from '@/app/admin/types/database';
import { PixQRButton } from '@/app/admin/components/PixQRButton';
import { PIX_CONFIG } from '@/app/admin/lib/pix';
import { formatDateTimeBR, startOfDayBR, startOfMonthBR } from '@/app/admin/lib/datetime';

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
  const weekStart = new Date(todayStart);
  weekStart.setUTCDate(weekStart.getUTCDate() - 7);
  const monthStart = startOfMonthBR();

  // Busca vendas nao canceladas dos periodos + numeros de OS (em paralelo)
  const [
    salesToday,
    salesWeek,
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
  ] = await Promise.all([
    supabase
      .from('sales')
      .select('total')
      .is('voided_at', null)
      .gte('created_at', todayStart.toISOString()),
    supabase
      .from('sales')
      .select('total')
      .is('voided_at', null)
      .gte('created_at', weekStart.toISOString()),
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

  const totalToday = sumTotal(salesToday.data);
  const countToday = salesToday.data?.length ?? 0;
  const totalWeek = sumTotal(salesWeek.data);
  const countWeek = salesWeek.data?.length ?? 0;
  const totalMonth = sumTotal(salesMonth.data);
  const countMonth = salesMonth.data?.length ?? 0;

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Resumo rapido do movimento da loja.
        </p>
      </div>

      {/* PIX da loja (acesso rapido) */}
      <section className="rounded-lg border-2 border-teal-200 bg-teal-50/60 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 min-w-[260px]">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              💰 PIX da loja
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Gere QR Code avulso pra cobrar cliente no balcão, sem precisar abrir OS ou venda.
            </p>
            <p className="mt-2 font-mono text-xs text-slate-700">
              Chave: <strong>{PIX_CONFIG.key}</strong> ·{' '}
              <strong>{PIX_CONFIG.merchantName}</strong> ·{' '}
              {PIX_CONFIG.merchantCity}
            </p>
            <div className="mt-3">
              <PixQRButton
                buttonLabel="Gerar QR do PIX"
                description="Pagamento avulso Cyber Informatica"
              />
            </div>
          </div>
        </div>
      </section>

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
          <div className="block rounded-lg border-2 border-indigo-200 bg-indigo-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Mão de obra (mês)
            </p>
            <p className="mt-1 text-2xl font-bold text-indigo-700">{fmtBRL(laborRevenueMonth)}</p>
          </div>
        </div>
      </section>

      {/* Cards de totais */}
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Vendas (PDV)
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
        <Card
          title="Hoje"
          total={totalToday}
          count={countToday}
          color="emerald"
          href={`/admin/vendas?from=${todayStart.toISOString().slice(0, 10)}&to=${todayStart.toISOString().slice(0, 10)}`}
        />
        <Card
          title="Últimos 7 dias"
          total={totalWeek}
          count={countWeek}
          color="blue"
          href={`/admin/vendas?from=${weekStart.toISOString().slice(0, 10)}`}
        />
        <Card
          title="Este mês"
          total={totalMonth}
          count={countMonth}
          color="indigo"
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
          <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Pedido (mês)
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-800">{fmtBRL(partsOrderedTotal)}</p>
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
            {(lastSales.data ?? []).map((s: any) => {
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
  color,
  href,
}: {
  title: string;
  total: number;
  count: number;
  color: 'emerald' | 'blue' | 'indigo';
  href: string;
}) {
  const colorClass =
    color === 'emerald'
      ? 'border-emerald-200 bg-emerald-50'
      : color === 'blue'
        ? 'border-blue-200 bg-blue-50'
        : 'border-indigo-200 bg-indigo-50';
  return (
    <Link
      href={href}
      className={`block rounded-lg border-2 p-4 transition hover:shadow-md ${colorClass}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
        {title}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{fmtBRL(total)}</p>
      <p className="mt-1 text-xs text-slate-600">
        {count} venda{count === 1 ? '' : 's'}
      </p>
    </Link>
  );
}
