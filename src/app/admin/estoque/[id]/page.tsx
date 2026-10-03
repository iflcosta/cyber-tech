import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { STOCK_MOVEMENT_TYPES } from '@/app/admin/types/database';
import { DeleteStockItemButton } from './DeleteStockItemButton';
import { ToggleActiveButton } from './ToggleActiveButton';
import { StockItemEditor } from './StockItemEditor';
import { formatDateBR, formatDateTimeBR } from '@/app/admin/lib/datetime';

export const dynamic = 'force-dynamic';

export default async function StockItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await getAuthedUser();
  if (!user) redirect('/admin/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('can_delete')
    .eq('id', user.id)
    .single();
  // Ativar/inativar e apagar item ficam juntos no mesmo bloco de
  // "ações perigosas" — só quem tem can_delete=true (independente de
  // role) vê essas ações, já que quem controla o estoque é quem
  // assume a responsabilidade por elas.
  const canDelete = profile?.can_delete === true;

  const { data: item } = await supabase
    .from('stock_items')
    .select('*')
    .eq('id', id)
    .single();
  if (!item) notFound();

  // Historico de movimentacoes (com nome do autor)
  const { data: movements } = await supabase
    .from('stock_movements')
    .select('*, author:profiles!stock_movements_author_id_fkey(full_name)')
    .eq('stock_item_id', id)
    .order('created_at', { ascending: false })
    .limit(50);

  // Checar se item ja foi vendido (impede DELETE hard por FK)
  const { count: salesCount } = await supabase
    .from('sale_items')
    .select('id', { count: 'exact', head: true })
    .eq('stock_item_id', id);
  const hasSales = (salesCount ?? 0) > 0;

  const isLow = item.current_stock <= item.min_stock;
  const isOut = item.current_stock === 0;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/estoque" className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-600 underline hover:text-zinc-950">
          ← Todo o estoque
        </Link>
        <h1 className="mt-2 flex flex-wrap items-center gap-2 font-mono text-2xl font-black uppercase tracking-tight text-zinc-950">
          <span>{item.name}</span>
          {!item.active && (
            <span className="border border-zinc-400 bg-zinc-200 px-2 py-0.5 font-mono text-xs font-bold uppercase text-zinc-800">Inativo</span>
          )}
        </h1>
        <p className="font-mono text-xs uppercase tracking-wider text-zinc-500">
          {[item.brand, item.model].filter(Boolean).join(' ') || 'Sem marca/modelo'}
        </p>
      </div>

      {/* Acoes perigosas (so quem tem can_delete) */}
      {canDelete && (
        <div className="flex flex-wrap items-center gap-2 border-2 border-zinc-950 bg-zinc-50 p-3">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-600">
            Ações:
          </span>
          <ToggleActiveButton
            itemId={item.id}
            itemName={item.name}
            active={item.active}
          />
          <DeleteStockItemButton
            itemId={item.id}
            itemName={item.name}
            hasSales={hasSales}
            salesCount={salesCount ?? 0}
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="border-2 border-zinc-950 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">
                Estoque atual
              </h2>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/estoque/${item.id}/label`}
                  target="_blank"
                  className="border-2 border-zinc-950 bg-white px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition"
                >
                  🏷️ Etiqueta (Térmica)
                </Link>
                <Link
                  href={`/admin/estoque/${item.id}/movimentar`}
                  className="border-2 border-zinc-950 bg-zinc-950 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition"
                >
                  + Movimentar
                </Link>
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <span
                className={`font-mono text-4xl font-black ${
                  isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-zinc-950'
                }`}
              >
                {item.current_stock}
              </span>
              <span className="font-mono text-xs text-zinc-500">
                / mínimo {item.min_stock}
              </span>
              {isOut ? (
                <span className="border border-red-500 bg-red-100 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-red-900">
                  Em falta
                </span>
              ) : isLow ? (
                <span className="border border-amber-500 bg-amber-100 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-900">
                  Estoque baixo
                </span>
              ) : (
                <span className="border border-emerald-500 bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                  OK
                </span>
              )}
            </div>
          </section>

          <section className="border-2 border-zinc-950 bg-white p-4 sm:p-5">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">
              Histórico de movimentações
            </h2>
            {(movements ?? []).length === 0 ? (
              <p className="mt-3 font-mono text-xs text-zinc-500">
                Nenhuma movimentação registrada. Use o botão <strong>+ Movimentar</strong> acima
                para registrar entrada inicial ou saída.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-zinc-200">
                {(movements ?? []).map((m) => {
                  const meta = STOCK_MOVEMENT_TYPES.find((t) => t.value === m.movement_type);
                  const sign =
                    m.movement_type === 'in'
                      ? '+'
                      : m.movement_type === 'adjust'
                        ? m.quantity > 0
                          ? '+'
                          : ''
                        : '-';
                  const signColor =
                    m.movement_type === 'in'
                      ? 'text-emerald-700'
                      : m.movement_type === 'sale'
                        ? 'text-zinc-950 font-black'
                        : m.movement_type === 'out'
                          ? 'text-amber-700'
                          : 'text-zinc-600';
                  return (
                    <li key={m.id} className="flex items-start justify-between gap-3 py-2.5 font-mono text-xs">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold ${signColor}`}>
                            {sign}
                            {m.quantity}
                          </span>
                          <span
                            className={`border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                              meta?.color === 'emerald'
                                ? 'border-emerald-700 bg-emerald-100 text-emerald-950'
                                : meta?.color === 'orange'
                                  ? 'border-amber-700 bg-amber-100 text-amber-950'
                                  : meta?.color === 'blue'
                                    ? 'border-zinc-950 bg-zinc-950 text-white'
                                    : 'border-zinc-300 bg-zinc-100 text-zinc-700'
                            }`}
                          >
                            {meta?.label}
                          </span>
                          {m.reference && (
                            <span className="font-mono text-xs text-zinc-500">
                              {m.reference}
                            </span>
                          )}
                        </div>
                        {m.notes && <p className="mt-1 font-mono text-xs text-zinc-700">{m.notes}</p>}
                        <p className="mt-1 font-mono text-[11px] text-zinc-500">
                          {formatDateTimeBR(m.created_at)} ·{' '}
                          {m.author?.full_name ?? '—'}
                        </p>
                      </div>
                      {m.total_amount !== null && (
                        <div className="text-right font-mono text-xs font-bold text-zinc-950">
                          {m.total_amount.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="border-2 border-zinc-950 bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">
                Dados do item
              </h2>
              <StockItemEditor
                item={{
                  id: item.id,
                  name: item.name,
                  category: item.category,
                  brand: item.brand,
                  model: item.model,
                  ean13: item.ean13,
                  unit_price: item.unit_price,
                  unit_cost: item.unit_cost,
                  min_stock: item.min_stock,
                  notes: item.notes,
                }}
              />
            </div>
            <dl className="mt-3 space-y-2 font-mono text-xs">
              {item.internal_sku && (
                <Row label="SKU Interno" value={<span className="font-bold text-zinc-950">{item.internal_sku}</span>} />
              )}
              {item.ean13 && (
                <Row label="EAN-13" value={<span>{item.ean13}</span>} />
              )}
              {item.category && <Row label="Categoria" value={item.category} />}
              {item.shelf_location && (
                <Row label="Localização" value={<span className="border border-zinc-300 bg-zinc-100 px-1.5 py-0.5">📍 {item.shelf_location}</span>} />
              )}
              {item.brand && <Row label="Marca" value={item.brand} />}
              {item.model && <Row label="Modelo" value={item.model} />}
              {typeof item.reserved_stock === 'number' && item.reserved_stock > 0 && (
                <Row label="Reservado em OS" value={`${item.reserved_stock} un`} />
              )}
              <Row
                label="Preço"
                value={<span className="font-bold text-zinc-950">{item.unit_price.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}</span>}
              />
              {item.unit_cost !== null && (
                <Row
                  label="Custo"
                  value={item.unit_cost.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                />
              )}
              {item.unit_cost !== null && item.unit_price > 0 && (
                <Row
                  label="Margem"
                  value={`${(((item.unit_price - item.unit_cost) / item.unit_price) * 100).toFixed(1)}%`}
                />
              )}
              {item.notes && <Row label="Obs" value={item.notes} />}
            </dl>
          </section>

          <section className="border-2 border-zinc-950 bg-white p-4 sm:p-5 font-mono text-xs text-zinc-500">
            <p>
              <strong className="text-zinc-950">Criado em:</strong>{' '}
              {formatDateBR(item.created_at)}
            </p>
            <p className="mt-1">
              <strong className="text-zinc-950">Atualizado em:</strong>{' '}
              {formatDateBR(item.updated_at)}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2 border-b border-zinc-100 pb-1">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-right text-zinc-950">{value}</dd>
    </div>
  );
}
