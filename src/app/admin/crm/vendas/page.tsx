import Link from 'next/link';
import { createCRMServerClient } from '@/app/admin/crm/lib/supabase/server';
import { PAYMENT_METHODS } from '@/app/admin/crm/types/database';

export const dynamic = 'force-dynamic';

export default async function VendasListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; voided?: string }>;
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
    .limit(100);

  // Por padrao esconde vendas canceladas
  if (params.voided !== '1') {
    query = query.is('voided_at', null);
  }

  const { data: sales, error } = await query;

  // Filtragem textual
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendas</h1>
          <p className="text-sm text-slate-500">
            {filtered.length} resultado{filtered.length === 1 ? '' : 's'}
            {params.q && ` (busca: "${params.q}")`}
          </p>
        </div>
        <Link
          href="/admin/crm/vender"
          className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          + Nova venda
        </Link>
      </div>

      <form className="flex flex-wrap items-center gap-2">
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
        <Link
          href="/admin/crm/vendas?voided=1"
          className="rounded-md bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
        >
          {params.voided === '1' ? '✓ Canceladas' : 'Mostrar canceladas'}
        </Link>
      </form>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          Erro ao carregar vendas: {error.message}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">
            {params.q ? 'Nenhuma venda encontrada.' : 'Nenhuma venda registrada ainda.'}
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
