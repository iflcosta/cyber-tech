import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createCRMServerClient } from '@/app/admin/crm/lib/supabase/server';
import { STOCK_MOVEMENT_TYPES } from '@/app/admin/crm/types/database';

export const dynamic = 'force-dynamic';

export default async function StockItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createCRMServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/crm/login');

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

  const isLow = item.current_stock <= item.min_stock;
  const isOut = item.current_stock === 0;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/crm/estoque" className="text-sm text-blue-600 hover:text-blue-700">
          ← Todo o estoque
        </Link>
        <h1 className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-bold text-slate-900">
          <span>{item.name}</span>
          {!item.active && (
            <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-700">Inativo</span>
          )}
        </h1>
        <p className="text-sm text-slate-500">
          {[item.brand, item.model].filter(Boolean).join(' ') || 'Sem marca/modelo'}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Estoque atual
              </h2>
              <Link
                href={`/admin/crm/estoque/${item.id}/movimentar`}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                + Movimentar
              </Link>
            </div>
            <div className="mt-3 flex items-baseline gap-3">
              <span
                className={`text-4xl font-bold ${
                  isOut ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-slate-900'
                }`}
              >
                {item.current_stock}
              </span>
              <span className="text-sm text-slate-500">
                / mínimo {item.min_stock}
              </span>
              {isOut ? (
                <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  Em falta
                </span>
              ) : isLow ? (
                <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                  Estoque baixo
                </span>
              ) : (
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                  OK
                </span>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Histórico de movimentações
            </h2>
            {(movements ?? []).length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                Nenhuma movimentação registrada. Use o botão <strong>+ Movimentar</strong> acima
                para registrar entrada inicial ou saída.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-200">
                {(movements ?? []).map((m: any) => {
                  const meta = STOCK_MOVEMENT_TYPES.find((t) => t.value === m.movement_type);
                  const sign = m.movement_type === 'in' || m.movement_type === 'adjust' ? '+' : '-';
                  const signColor =
                    m.movement_type === 'in'
                      ? 'text-emerald-600'
                      : m.movement_type === 'sale'
                        ? 'text-blue-600'
                        : m.movement_type === 'out'
                          ? 'text-orange-600'
                          : 'text-slate-600';
                  return (
                    <li key={m.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-semibold ${signColor}`}>
                            {sign}
                            {m.quantity}
                          </span>
                          <span
                            className={`rounded px-2 py-0.5 text-xs ${
                              meta?.color === 'emerald'
                                ? 'bg-emerald-100 text-emerald-700'
                                : meta?.color === 'orange'
                                  ? 'bg-orange-100 text-orange-700'
                                  : meta?.color === 'blue'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {meta?.label}
                          </span>
                          {m.reference && (
                            <span className="font-mono text-xs text-slate-500">
                              {m.reference}
                            </span>
                          )}
                        </div>
                        {m.notes && <p className="mt-1 text-slate-600">{m.notes}</p>}
                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(m.created_at).toLocaleString('pt-BR')} ·{' '}
                          {m.author?.full_name ?? '—'}
                        </p>
                      </div>
                      {m.total_amount !== null && (
                        <div className="text-right text-sm font-medium text-slate-900">
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
          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Dados do item
            </h2>
            <dl className="mt-2 space-y-1.5 text-sm">
              {item.ean13 && (
                <Row label="EAN-13" value={<span className="font-mono">{item.ean13}</span>} />
              )}
              {item.category && <Row label="Categoria" value={item.category} />}
              {item.brand && <Row label="Marca" value={item.brand} />}
              {item.model && <Row label="Modelo" value={item.model} />}
              <Row
                label="Preço"
                value={item.unit_price.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
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
              {item.unit_cost !== null && (
                <Row
                  label="Margem"
                  value={`${(((item.unit_price - item.unit_cost) / item.unit_price) * 100).toFixed(1)}%`}
                />
              )}
              {item.notes && <Row label="Obs" value={item.notes} />}
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 text-xs text-slate-500">
            <p>
              <strong>Criado em:</strong>{' '}
              {new Date(item.created_at).toLocaleDateString('pt-BR')}
            </p>
            <p className="mt-1">
              <strong>Atualizado em:</strong>{' '}
              {new Date(item.updated_at).toLocaleDateString('pt-BR')}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right text-slate-900">{value}</dd>
    </div>
  );
}
