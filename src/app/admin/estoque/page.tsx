import Link from 'next/link';
import { getAuthedProfile } from '@/app/admin/lib/auth';
import { StockFilter } from './StockFilter';
import { WipeStockButtons } from './WipeStockButtons';
import { sanitizeSearchTerm } from '@/app/admin/lib/search';

export const dynamic = 'force-dynamic';

export default async function StockListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; low?: string; inactive?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user, profile } = await getAuthedProfile();
  if (!user) return null;

  let itemsQuery = supabase
    .from('stock_items')
    .select('*')
    .order('active', { ascending: false })
    .order('name');

  if (params.inactive !== '1') {
    itemsQuery = itemsQuery.eq('active', true);
  }

  if (params.q) {
    const q = sanitizeSearchTerm(params.q);
    itemsQuery = itemsQuery.or(
      `name.ilike.%${q}%,brand.ilike.%${q}%,model.ilike.%${q}%,category.ilike.%${q}%,ean13.ilike.%${q}%,internal_sku.ilike.%${q}%,shelf_location.ilike.%${q}%`,
    );
  }

  let { data: items, error } = await itemsQuery;

  // Fallback resiliente caso a migration 0036 ainda não tenha sido rodada no Supabase SQL Editor
  if (error && params.q) {
    const q = sanitizeSearchTerm(params.q);
    let fallbackQuery = supabase
      .from('stock_items')
      .select('*')
      .order('active', { ascending: false })
      .order('name');
    if (params.inactive !== '1') {
      fallbackQuery = fallbackQuery.eq('active', true);
    }
    fallbackQuery = fallbackQuery.or(
      `name.ilike.%${q}%,brand.ilike.%${q}%,model.ilike.%${q}%,category.ilike.%${q}%,ean13.ilike.%${q}%`,
    );
    const fb = await fallbackQuery;
    items = fb.data;
    error = fb.error;
  }

  const canDelete = profile?.can_delete === true;

  const { data: lowItems } = await supabase
    .from('stock_low_alert')
    .select('id, name, current_stock, min_stock')
    .limit(10);

  let filtered = items ?? [];
  if (params.low === '1') {
    filtered = filtered.filter((i) => i.current_stock <= i.min_stock);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-zinc-950 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-950">
              Catálogo &amp; Estoque (Eduardo)
            </h1>
            <span className="border border-zinc-950 bg-zinc-100 px-2 py-0.5 font-mono text-[11px] font-bold uppercase text-zinc-950">
              Pronta-Entrega
            </span>
          </div>
          <p className="mt-0.5 font-mono text-xs text-zinc-600">
            {filtered.length} {filtered.length === 1 ? 'item cadastrado' : 'itens cadastrados'}
            {params.q && ` (busca: "${params.q}")`}
            {params.low === '1' && ' · filtrando estoque baixo'}
          </p>
        </div>
        <div className="flex flex-wrap shrink-0 gap-2">
          {canDelete && <WipeStockButtons />}
          <Link
            href="/admin/estoque/new?showroom=1"
            className="border-2 border-zinc-950 bg-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition"
          >
            + Publicar PC no Showroom
          </Link>
          <Link
            href="/admin/estoque/new"
            className="bg-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition"
          >
            + Novo Item
          </Link>
        </div>
      </div>

      {(lowItems ?? []).length > 0 && params.low !== '1' && (
        <Link
          href="/admin/estoque?low=1"
          className="block border-2 border-zinc-950 bg-zinc-100 p-3.5 font-mono text-xs text-zinc-950 hover:bg-zinc-200 transition"
        >
          <strong>
            [ALERTA DE REPOSIÇÃO] {lowItems!.length} {lowItems!.length === 1 ? 'item está' : 'itens estão'}
          </strong>{' '}
          com saldo abaixo ou igual ao mínimo. Clique para filtrar →
        </Link>
      )}

      <StockFilter />

      {error && (
        <div className="border-2 border-zinc-950 bg-zinc-100 p-3 font-mono text-xs font-bold text-zinc-950">
          [ERRO] Falha ao carregar estoque: {error.message}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="border-2 border-dashed border-zinc-300 bg-white p-10 text-center">
          <p className="font-mono text-sm text-zinc-600">
            {params.q || params.low === '1'
              ? 'Nenhum item encontrado com esses filtros.'
              : 'Nenhum item cadastrado ainda.'}
          </p>
          <Link
            href="/admin/estoque/new"
            className="mt-3 inline-block bg-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800"
          >
            Cadastrar Primeiro Item →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto border-2 border-zinc-950 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-zinc-950 bg-zinc-100 text-left font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-700">
              <tr>
                <th className="px-4 py-3">Item / SKU</th>
                <th className="hidden px-4 py-3 sm:table-cell">Categoria / Local</th>
                <th className="px-4 py-3 text-right">Estoque</th>
                <th className="hidden px-4 py-3 text-right sm:table-cell">Preço</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-xs text-zinc-800">
              {filtered.map((item) => {
                const isLow = item.current_stock <= item.min_stock;
                const isOut = item.current_stock === 0;
                const reserved = item.reserved_stock ?? 0;
                return (
                  <tr key={item.id} className="hover:bg-zinc-50 transition">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/estoque/${item.id}`}
                        className="font-bold text-zinc-950 hover:underline transition text-sm"
                      >
                        {item.name}
                      </Link>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        {item.internal_sku && (
                          <span className="border border-zinc-950 bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-zinc-950">
                            {item.internal_sku}
                          </span>
                        )}
                        {item.ean13 && (
                          <span className="font-mono text-[11px] text-zinc-500">
                            EAN: {item.ean13}
                          </span>
                        )}
                      </div>
                      {item.brand && (
                        <span className="mt-0.5 block text-xs text-zinc-500">
                          {[item.brand, item.model].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-zinc-700 sm:table-cell">
                      <div>{item.category ?? <span className="text-zinc-400">—</span>}</div>
                      {item.shelf_location && (
                        <span className="mt-0.5 inline-block border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-zinc-700">
                          {item.shelf_location}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      <span className="font-bold text-zinc-950">
                        {item.current_stock}
                      </span>
                      <span className="text-xs text-zinc-400"> / {item.min_stock}</span>
                      {reserved > 0 && (
                        <span className="block text-[10px] text-zinc-600 font-mono">
                          ({reserved} reserv. em OS)
                        </span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-right font-mono font-bold text-zinc-950 sm:table-cell">
                      {item.unit_price.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {!item.active ? (
                        <span className="border border-zinc-300 bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-500">
                          Inativo
                        </span>
                      ) : isOut ? (
                        <span className="bg-zinc-950 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                          Em Falta
                        </span>
                      ) : isLow ? (
                        <span className="border border-zinc-950 bg-zinc-200 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-950">
                          Baixo
                        </span>
                      ) : (
                        <span className="border border-zinc-950 bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-950">
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
