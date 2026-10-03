import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { PAYMENT_METHODS } from '@/app/admin/types/database';
import { formatDateTimeBR } from '@/app/admin/lib/datetime';
import { CancelSaleButton } from './CancelSaleButton';

export const dynamic = 'force-dynamic';

export default async function VendaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await getAuthedUser();
  if (!user) redirect('/admin/login');

  const { data: sale } = await supabase
    .from('sales')
    .select(`
      *,
      author:profiles!sales_author_id_fkey(full_name),
      voided_by_user:profiles!sales_voided_by_fkey(full_name)
    `)
    .eq('id', id)
    .single();

  if (!sale) notFound();

  const { data: items } = await supabase
    .from('sale_items')
    .select(`
      *,
      stock_item:stock_items(id, internal_sku, ean13)
    `)
    .eq('sale_id', id)
    .order('created_at');

  const payMeta = PAYMENT_METHODS.find((m) => m.value === sale.payment_method);

  return (
    <div className="space-y-6">
      {sale.voided_at && (
        <div className="border-2 border-red-600 bg-red-50 p-3 font-mono text-xs font-bold uppercase text-red-800">
          <strong>Venda cancelada</strong> em{' '}
          {formatDateTimeBR(sale.voided_at)} por{' '}
          {sale.voided_by_user?.full_name ?? '—'}.
          {sale.voided_reason && (
            <p className="mt-1">Motivo: {sale.voided_reason}</p>
          )}
        </div>
      )}

      <div className="border-b-2 border-zinc-950 pb-4">
        <Link href="/admin/vendas" className="font-mono text-xs font-bold uppercase text-zinc-600 hover:text-zinc-950 hover:underline">
          ← Todas as vendas
        </Link>
        <h1 className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-black uppercase tracking-tight text-zinc-950">
          <span className="font-mono">{sale.sale_number}</span>
          {sale.voided_at && (
            <span className="border border-red-400 bg-red-50 px-2 py-0.5 font-mono text-xs font-bold uppercase text-red-700">
              Cancelada
            </span>
          )}
        </h1>
        <p className="text-xs font-mono uppercase text-zinc-600">
          {formatDateTimeBR(sale.created_at)} ·{' '}
          Operador: <strong>{sale.author?.full_name ?? '—'}</strong>
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/vendas/${sale.id}/nota`}
          target="_blank"
          className="border-2 border-zinc-950 bg-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-zinc-800 transition"
        >
          📄 Nota / Comprovante (PDF)
        </Link>
        <Link
          href={`/admin/vendas/${sale.id}/recibo`}
          target="_blank"
          className="border-2 border-zinc-950 bg-white px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition"
        >
          🧾 {sale.voided_at ? 'Reimprimir cupom 58mm' : 'Cupom 58mm'}
        </Link>
        {!sale.voided_at && (
          <CancelSaleButton saleId={sale.id} saleNumber={sale.sale_number} />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="border-2 border-zinc-950 bg-white p-4 sm:p-5 lg:col-span-2 shadow-sm">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-200 pb-2">
            Itens ({items?.length ?? 0})
          </h2>
          <ul className="mt-3 divide-y divide-zinc-200 font-mono text-xs">
            {(items ?? []).map((item) => {
              const stockItem = (item as never as { stock_item?: { id?: string; internal_sku?: string | null; ean13?: string | null } })?.stock_item;
              const sku = stockItem?.internal_sku || stockItem?.ean13 || (item.stock_item_id ? `CY-${item.stock_item_id.replace(/-/g, '').slice(0, 6).toUpperCase()}` : null);
              return (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="font-bold text-zinc-950">{item.item_name}</p>
                      {sku && (
                        <span className="font-mono text-[10px] bg-zinc-100 text-zinc-600 border border-zinc-300 px-1.5 py-0.2 rounded-xs font-semibold">
                          {sku}
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-500">
                      {item.quantity}x ·{' '}
                      {item.unit_price.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}{' '}
                      cada
                    </p>
                  </div>
                  <span className="font-bold text-zinc-950">
                    {item.subtotal.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <aside className="space-y-4">
          <section className="border-2 border-zinc-950 bg-white p-4 sm:p-5 shadow-sm">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-200 pb-2">
              Totais
            </h2>
            <dl className="mt-2 space-y-1.5 font-mono text-xs">
              <Row label="Subtotal" value={fmtBRL(sale.subtotal)} />
              {sale.discount > 0 && (
                <Row label="Desconto" value={`− ${fmtBRL(sale.discount)}`} accent="red" />
              )}
              <div className="border-t border-zinc-300 pt-2">
                <Row
                  label="Total"
                  value={<strong className="text-base font-black text-zinc-950">{fmtBRL(sale.total)}</strong>}
                />
              </div>
            </dl>
          </section>

          <section className="border-2 border-zinc-950 bg-white p-4 sm:p-5 shadow-sm">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-200 pb-2">
              Pagamento e cliente
            </h2>
            <dl className="mt-2 space-y-1.5 font-mono text-xs">
              <Row label="Forma" value={payMeta?.label ?? sale.payment_method} />
              {sale.customer_name && <Row label="Cliente" value={sale.customer_name} />}
              {sale.customer_phone && <Row label="Telefone" value={sale.customer_phone} />}
              {sale.notes && <Row label="Obs" value={sale.notes} />}
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: 'red';
}) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-zinc-500 uppercase">{label}</dt>
      <dd
        className={`text-right font-bold ${
          accent === 'red' ? 'text-red-600' : 'text-zinc-950'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
