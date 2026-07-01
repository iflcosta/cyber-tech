import Link from 'next/link';
import { createCRMServerClient } from '@/app/admin/crm/lib/supabase/server';
import { StockFilter } from './StockFilter';
import { WipeStockButtons } from './WipeStockButtons';

export const dynamic = 'force-dynamic';

export default async function StockListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; low?: string; inactive?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createCRMServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Query de itens
  let itemsQuery = supabase
    .from('stock_items')
    .select('*')
    .order('active', { ascending: false })
    .order('name');

  // Por padrao, esconde inativos (so aparece se filtro explicito)
  if (params.inactive !== '1') {
    itemsQuery = itemsQuery.eq('active', true);
  }

  const { data: items, error } = await itemsQuery;

  // Perfil do user (pra saber se e owner — so owner ve botoes destrutivos)
  const { data: profile } = user
    ? await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    : { data: null };
  const isOwner = profile?.role === 'owner';

  // Alerta de estoque baixo (view)
  const { data: lowItems } = await supabase
    .from('stock_low_alert')
    .select('id, name, current_stock, min_stock')
    .limit(10);

  // Filtragem client-side (busca textual generica)
  let filtered = items ?? [];
  if (params.q) {
    const q = params.q.toLowerCase().trim();
    filtered = filtered.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.brand?.toLowerCase().includes(q) ?? false) ||
        (i.model?.toLowerCase().includes(q) ?? false) ||
        (i.category?.toLowerCase().includes(q) ?? false) ||
        (i.ean13?.toLowerCase().includes(q) ?? false),
    );
  }
  if (params.low === '1') {
    filtered = filtered.filter((i) => i.current_stock <= i.min_stock);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Estoque</h1>
          <p className="text-sm text-slate-500">
            {filtered.length} {filtered.length === 1 ? 'item' : 'itens'}
            {params.q && ` (busca: "${params.q}")`}
            {params.low === '1' && ' · só estoque baixo'}
          </p>
        </div>
        <div className="flex flex-shrink-0 gap-2">
          {isOwner && <WipeStockButtons />}
          <Link
            href="/admin/crm/estoque/new"
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            + Novo item
          </Link>
        </div>
      </div>

      {(lowItems ?? []).length > 0 && params.low !== '1' && (
        <Link
          href="/admin/crm/estoque?low=1"
          className="block rounded-md border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800 hover:bg-orange-100"
        >
          <strong>{lowItems!.length} {lowItems!.length === 1 ? 'item precisa' : 'itens precisam'}</strong> de
          reposição (estoque ≤ mínimo). Clique para ver.
        </Link>
      )}

      <StockFilter />

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          Erro ao carregar estoque: {error.message}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">
            {params.q || params.low === '1'
              ? 'Nenhum item encontrado com esses filtros.'
              : 'Nenhum item cadastrado ainda.'}
          </p>
          <Link
            href="/admin/crm/estoque/new"
            className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Cadastrar primeiro item →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Item</th>
                <th className="hidden px-3 py-2 font-medium sm:table-cell">Categoria</th>
                <th className="px-3 py-2 text-right font-medium">Estoque</th>
                <th className="hidden px-3 py-2 text-right font-medium sm:table-cell">Preço</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((item) => {
                const isLow = item.current_stock <= item.min_stock;
                const isOut = item.current_stock === 0;
                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/crm/estoque/${item.id}`}
                        className="font-medium text-slate-900 hover:text-blue-700"
                      >
                        {item.name}
                      </Link>
                      {item.brand && (
                        <span className="block text-xs text-slate-500">
                          {[item.brand, item.model].filter(Boolean).join(' ')}
                        </span>
                      )}
                      {item.ean13 && (
                        <span className="block font-mono text-xs text-slate-400">
                          {item.ean13}
                        </span>
                      )}
                    </td>
                    <td className="hidden px-3 py-2 text-slate-600 sm:table-cell">
                      {item.category ?? <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span
                        className={
                          isOut
                            ? 'font-semibold text-red-600'
                            : isLow
                              ? 'font-semibold text-orange-600'
                              : 'text-slate-900'
                        }
                      >
                        {item.current_stock}
                      </span>
                      <span className="text-xs text-slate-400"> / {item.min_stock}</span>
                    </td>
                    <td className="hidden px-3 py-2 text-right font-medium text-slate-900 sm:table-cell">
                      {item.unit_price.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                    <td className="px-3 py-2">
                      {!item.active ? (
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          Inativo
                        </span>
                      ) : isOut ? (
                        <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Em falta
                        </span>
                      ) : isLow ? (
                        <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                          Baixo
                        </span>
                      ) : (
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                          OK
                        </span>
                      )}
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
