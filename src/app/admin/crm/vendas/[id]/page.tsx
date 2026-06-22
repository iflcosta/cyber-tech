import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createCRMServerClient } from '@/app/admin/crm/lib/supabase/server';
import { PAYMENT_METHODS } from '@/app/admin/crm/types/database';
import { CancelSaleButton } from './CancelSaleButton';

export const dynamic = 'force-dynamic';

export default async function VendaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createCRMServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/crm/login');

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
    .select('*')
    .eq('sale_id', id)
    .order('created_at');

  const payMeta = PAYMENT_METHODS.find((m) => m.value === sale.payment_method);

  return (
    <div className="space-y-6">
      {sale.voided_at && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          <strong>Venda cancelada</strong> em{' '}
          {new Date(sale.voided_at).toLocaleString('pt-BR')} por{' '}
          {sale.voided_by_user?.full_name ?? '—'}.
          {sale.voided_reason && (
            <p className="mt-1">Motivo: {sale.voided_reason}</p>
          )}
        </div>
      )}

      <div>
        <Link href="/admin/crm/vendas" className="text-sm text-blue-600 hover:text-blue-700">
          ← Todas as vendas
        </Link>
        <h1 className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-bold text-slate-900">
          <span className="font-mono">{sale.sale_number}</span>
          {sale.voided_at && (
            <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
              Cancelada
            </span>
          )}
        </h1>
        <p className="text-sm text-slate-500">
          {new Date(sale.created_at).toLocaleString('pt-BR')} ·{' '}
          Operador: <strong>{sale.author?.full_name ?? '—'}</strong>
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/crm/vendas/${sale.id}/recibo`}
          target="_blank"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          🖨️ {sale.voided_at ? 'Reimprimir recibo' : 'Imprimir recibo'}
        </Link>
        {!sale.voided_at && (
          <CancelSaleButton saleId={sale.id} saleNumber={sale.sale_number} />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Itens ({items?.length ?? 0})
          </h2>
          <ul className="mt-3 divide-y divide-slate-200">
            {(items ?? []).map((item: any) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{item.item_name}</p>
                  <p className="text-xs text-slate-500">
                    {item.quantity}x ·{' '}
                    {item.unit_price.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}{' '}
                    cada
                  </p>
                </div>
                <span className="font-mono font-medium text-slate-900">
                  {item.subtotal.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Totais
            </h2>
            <dl className="mt-2 space-y-1.5 text-sm">
              <Row label="Subtotal" value={fmtBRL(sale.subtotal)} />
              {sale.discount > 0 && (
                <Row label="Desconto" value={`− ${fmtBRL(sale.discount)}`} accent="red" />
              )}
              <div className="border-t border-slate-200 pt-2">
                <Row
                  label="Total"
                  value={<strong className="text-lg">{fmtBRL(sale.total)}</strong>}
                />
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Pagamento e cliente
            </h2>
            <dl className="mt-2 space-y-1.5 text-sm">
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
      <dt className="text-slate-500">{label}</dt>
      <dd
        className={`text-right ${
          accent === 'red' ? 'font-medium text-red-600' : 'text-slate-900'
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
