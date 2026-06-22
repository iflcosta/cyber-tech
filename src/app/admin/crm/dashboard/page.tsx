import Link from 'next/link';
import { createCRMServerClient } from '@/app/admin/crm/lib/supabase/server';
import { PAYMENT_METHODS } from '@/app/admin/crm/types/database';

export const dynamic = 'force-dynamic';

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default async function DashboardPage() {
  const supabase = await createCRMServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Janelas de tempo
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Busca vendas nao canceladas dos periodos (em paralelo)
  const [salesToday, salesWeek, salesMonth, lastSales, topItems] = await Promise.all([
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
  ]);

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

      {/* Cards de totais */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card
          title="Hoje"
          total={totalToday}
          count={countToday}
          color="emerald"
          href={`/admin/crm/vendas?from=${todayStart.toISOString().slice(0, 10)}&to=${todayStart.toISOString().slice(0, 10)}`}
        />
        <Card
          title="Últimos 7 dias"
          total={totalWeek}
          count={countWeek}
          color="blue"
          href={`/admin/crm/vendas?from=${weekStart.toISOString().slice(0, 10)}`}
        />
        <Card
          title="Este mês"
          total={totalMonth}
          count={countMonth}
          color="indigo"
          href={`/admin/crm/vendas?from=${monthStart.toISOString().slice(0, 10)}`}
        />
      </div>

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
            href="/admin/crm/vendas"
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
                      href={`/admin/crm/vendas/${s.id}`}
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
