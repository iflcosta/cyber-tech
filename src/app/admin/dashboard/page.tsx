import Link from 'next/link';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { PAYMENT_METHODS } from '@/app/admin/types/database';
import { PixQRButton } from '@/app/admin/components/PixQRButton';
import { PIX_CONFIG } from '@/app/admin/lib/pix';

export const dynamic = 'force-dynamic';

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default async function DashboardPage() {
  const { supabase, user } = await getAuthedUser();
  if (!user) return null;

  // Janelas de tempo
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Busca vendas nao canceladas dos periodos + numeros de OS (em paralelo)
  const [salesToday, salesWeek, salesMonth, lastSales, topItems, osOpen, osStale, osReady, osDeliveredMonth] = await Promise.all([
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

      {/* Top itens vendidos no mes */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Top 5 itens vendidos (este mês)
          </h2>
          <span className="text-xs text-slate-400">
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
                      {new Date(s.created_at).toLocaleString('pt-BR')} ·{' '}
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
