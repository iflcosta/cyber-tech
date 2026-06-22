import Link from 'next/link';
import { createCRMServerClient } from '@/app/admin/crm/lib/supabase/server';
import { PAYMENT_METHODS } from '@/app/admin/crm/types/database';

export const dynamic = 'force-dynamic';

export default async function VendasListPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    voided?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createCRMServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  let query = supabase
    .from('sales')
    .select(`
      *,
      author:profiles!sales_author_id_fkey(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(200);

  // Por padrao esconde vendas canceladas
  if (params.voided !== '1') {
    query = query.is('voided_at', null);
  }

  // Filtro de data inicial (YYYY-MM-DD)
  if (params.from) {
    query = query.gte('created_at', `${params.from}T00:00:00`);
  }

  // Filtro de data final (YYYY-MM-DD)
  if (params.to) {
    query = query.lte('created_at', `${params.to}T23:59:59`);
  }

  const { data: sales, error } = await query;

  // Filtragem textual client-side (rapido pq ja vem filtrado do banco)
  let filtered = sales ?? [];
  if (params.q) {
    const q = params.q.toLowerCase().trim();
    filtered = filtered.filter(
      (s: any) =>
        s.sale_number.toLowerCase().includes(q) ||
        (s.customer_name?.toLowerCase().includes(q) ?? false) ||
        (s.customer_phone?.toLowerCase().includes(q) ?? false) ||
        (s.author?.full_name?.toLowerCase().includes(q) ?? false),
    );
  }

  // Totais do periodo filtrado
  const totals = filtered.reduce(
    (acc: { count: number; total: number }, s: any) => {
      acc.count += 1;
      acc.total += Number(s.total) || 0;
      return acc;
    },
    { count: 0, total: 0 },
  );

  // Atalhos de data
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendas</h1>
          <p className="text-sm text-slate-500">
            {totals.count} resultado{totals.count === 1 ? '' : 's'} ·{' '}
            <strong>
              {totals.total.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </strong>
          </p>
        </div>
        <Link
          href="/admin/crm/vender"
          className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          + Nova venda
        </Link>
      </div>

      {/* Filtros */}
      <form className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            name="q"
            defaultValue={params.q ?? ''}
            placeholder="Buscar por número, cliente, operador…"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="rounded-md bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
          >
            Buscar
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1 text-sm">
            <span className="text-slate-600">De:</span>
            <input
              type="date"
              name="from"
              defaultValue={params.from ?? ''}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>
          <label className="flex items-center gap-1 text-sm">
            <span className="text-slate-600">Até:</span>
            <input
              type="date"
              name="to"
              defaultValue={params.to ?? ''}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>

          {/* Atalhos */}
          <div className="ml-auto flex flex-wrap items-center gap-1 text-xs">
            <span className="text-slate-500">Atalhos:</span>
            <Link
              href={`/admin/crm/vendas?from=${today}&to=${today}`}
              className="rounded bg-slate-100 px-2 py-1 text-slate-700 hover:bg-slate-200"
            >
              Hoje
            </Link>
            <Link
              href={`/admin/crm/vendas?from=${weekAgo}`}
              className="rounded bg-slate-100 px-2 py-1 text-slate-700 hover:bg-slate-200"
            >
              Últimos 7 dias
            </Link>
            <Link
              href={`/admin/crm/vendas?from=${monthStartStr}`}
              className="rounded bg-slate-100 px-2 py-1 text-slate-700 hover:bg-slate-200"
            >
              Este mês
            </Link>
            {(params.from || params.to || params.q) && (
              <Link
                href="/admin/crm/vendas"
                className="rounded bg-red-50 px-2 py-1 text-red-700 hover:bg-red-100"
              >
                Limpar filtros
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Link
            href={
              params.voided === '1'
                ? `/admin/crm/vendas?${new URLSearchParams({ ...params, voided: '' }).toString()}`.replace(/voided=/, '')
                : `/admin/crm/vendas?${new URLSearchParams({ ...params, voided: '1' }).toString()}`
            }
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              params.voided === '1'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {params.voided === '1' ? '✓ Canceladas' : 'Mostrar canceladas'}
          </Link>
        </div>
      </form>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          Erro ao carregar vendas: {error.message}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">
            {params.q || params.from || params.to
              ? 'Nenhuma venda encontrada com esses filtros.'
              : 'Nenhuma venda registrada ainda.'}
          </p>
          <Link
            href="/admin/crm/vender"
            className="mt-3 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Fazer primeira venda →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Número</th>
                <th className="hidden px-3 py-2 font-medium sm:table-cell">Data</th>
                <th className="px-3 py-2 font-medium">Cliente</th>
                <th className="px-3 py-2 font-medium">Pagto</th>
                <th className="px-3 py-2 text-right font-medium">Total</th>
                <th className="hidden px-3 py-2 font-medium sm:table-cell">Operador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((s: any) => {
                const payMeta = PAYMENT_METHODS.find((m) => m.value === s.payment_method);
                return (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/crm/vendas/${s.id}`}
                        className="font-mono font-medium text-slate-900 hover:text-blue-700"
                      >
                        {s.sale_number}
                      </Link>
                      {s.voided_at && (
                        <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">
                          Cancelada
                        </span>
                      )}
                    </td>
                    <td className="hidden px-3 py-2 text-slate-600 sm:table-cell">
                      {new Date(s.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {s.customer_name ?? <span className="text-slate-400">Balcão</span>}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{payMeta?.label}</td>
                    <td className="px-3 py-2 text-right font-mono font-medium text-slate-900">
                      {s.total.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                    <td className="hidden px-3 py-2 text-slate-600 sm:table-cell">
                      {s.author?.full_name ?? '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
