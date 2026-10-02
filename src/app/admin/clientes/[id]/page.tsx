import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { StatusBadge } from '@/app/admin/components/StatusBadge';
import { WhatsAppButton } from '@/app/admin/components/WhatsAppButton';
import { WARRANTY_DAYS, PAYMENT_METHODS } from '@/app/admin/types/database';
import { formatDateBR, formatDateTimeBR } from '@/app/admin/lib/datetime';
import { EditCustomerForm } from './EditCustomerForm';

export const dynamic = 'force-dynamic';

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await getAuthedUser();
  if (!user) redirect('/admin/login');

  const { data: customer } = await supabase.from('customers').select('*').eq('id', id).single();
  if (!customer) notFound();

  const [{ data: orders }, { data: sales }] = await Promise.all([
    supabase
      .from('service_orders')
      .select('id, short_id, os_number, status, equipment_type, equipment_brand, equipment_model, reported_defect, created_at, delivered_at')
      .eq('customer_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('sales')
      .select('id, sale_number, total, payment_method, voided_at, created_at')
      .eq('customer_id', id)
      .order('created_at', { ascending: false }),
  ]);

  // Server Component, lido uma vez por request — Date.now() aqui é
  // seguro, o linter de pureza só não distingue Server de Client.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const ordersWithWarranty = (orders ?? []).map((o) => {
    const warrantyEnd = o.delivered_at
      ? new Date(new Date(o.delivered_at).getTime() + WARRANTY_DAYS * 86400000)
      : null;
    return {
      ...o,
      warrantyActive: warrantyEnd !== null && warrantyEnd.getTime() > now,
      warrantyEnd,
    };
  });

  const activeSales = (sales ?? []).filter((s) => !s.voided_at);
  const totalSpent = activeSales.reduce((acc, s) => acc + Number(s.total), 0);

  return (
    <div className="space-y-4">
      <div className="border-b-2 border-zinc-950 pb-4">
        <Link href="/admin/clientes" className="font-mono text-xs font-bold uppercase text-zinc-600 hover:text-zinc-950 hover:underline">
          ← Todos os clientes
        </Link>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-950">{customer.name}</h1>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/os/new?customer=${customer.id}`}
              className="border-2 border-zinc-950 bg-zinc-950 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition shadow-sm"
            >
              + Nova OS
            </Link>
            <Link
              href={`/admin/vender?customer=${customer.id}`}
              className="border-2 border-zinc-950 bg-white px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition shadow-sm"
            >
              + Nova venda
            </Link>
            {customer.phone && <WhatsAppButton phone={customer.phone} />}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="border-2 border-zinc-950 bg-white p-4 sm:col-span-1 shadow-sm">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-200 pb-2">Contato</h2>
          <EditCustomerForm
            customerId={customer.id}
            initialName={customer.name}
            initialPhone={customer.phone ?? ''}
            initialEmail={customer.email ?? ''}
            initialNotes={customer.notes ?? ''}
          />
          <p className="mt-3 font-mono text-[11px] text-zinc-500">
            Cliente desde {formatDateBR(customer.created_at)}
          </p>
        </div>

        <div className="border-2 border-zinc-950 bg-zinc-50 p-4 shadow-sm">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-600">Ordens de serviço</p>
          <p className="mt-1 text-2xl font-black font-mono text-zinc-950">{ordersWithWarranty.length}</p>
          {ordersWithWarranty.some((o) => o.warrantyActive) && (
            <p className="mt-1 text-xs font-mono font-bold uppercase text-emerald-700">
              {ordersWithWarranty.filter((o) => o.warrantyActive).length} em garantia
            </p>
          )}
        </div>

        <div className="border-2 border-zinc-950 bg-zinc-50 p-4 shadow-sm">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-600">Total em compras</p>
          <p className="mt-1 text-2xl font-black font-mono text-zinc-950">{fmtBRL(totalSpent)}</p>
          <p className="mt-1 text-xs font-mono text-zinc-600">
            {activeSales.length} venda{activeSales.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <section className="border-2 border-zinc-950 bg-white p-4 sm:p-5 shadow-sm">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-200 pb-2">
          Histórico de OS
        </h2>
        {ordersWithWarranty.length === 0 ? (
          <p className="mt-3 font-mono text-xs text-zinc-500">Nenhuma OS ainda.</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-200 font-mono text-xs">
            {ordersWithWarranty.map((o) => (
              <li key={o.id} className="py-2.5">
                <Link
                  href={`/admin/os/${o.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 hover:bg-zinc-50 transition p-1"
                >
                  <div>
                    <span className="font-bold text-zinc-950">
                      {o.short_id ?? o.os_number}
                    </span>
                    <span className="ml-2 font-medium text-zinc-700">
                      {[o.equipment_brand, o.equipment_model].filter(Boolean).join(' ') || o.equipment_type}
                    </span>
                    <p className="text-xs text-zinc-500">{o.reported_defect}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {o.warrantyActive && (
                      <span className="border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-xs font-bold text-emerald-800">
                        Garantia até {formatDateBR(o.warrantyEnd!.toISOString())}
                      </span>
                    )}
                    <StatusBadge status={o.status} />
                    <span className="text-xs text-zinc-500">{formatDateBR(o.created_at)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-2 border-zinc-950 bg-white p-4 sm:p-5 shadow-sm">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-200 pb-2">
          Histórico de compras (PDV)
        </h2>
        {(sales ?? []).length === 0 ? (
          <p className="mt-3 font-mono text-xs text-zinc-500">Nenhuma compra ainda.</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-200 font-mono text-xs">
            {(sales ?? []).map((s) => {
              const payMeta = PAYMENT_METHODS.find((m) => m.value === s.payment_method);
              return (
                <li key={s.id} className="py-2.5">
                  <Link
                    href={`/admin/vendas/${s.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 hover:bg-zinc-50 transition p-1"
                  >
                    <div>
                      <span className="font-bold text-zinc-950">
                        {s.sale_number}
                      </span>
                      {s.voided_at && (
                        <span className="ml-2 border border-red-300 bg-red-50 px-1.5 py-0.5 text-xs font-bold text-red-700">
                          Cancelada
                        </span>
                      )}
                      <p className="text-xs text-zinc-500">
                        {formatDateTimeBR(s.created_at)} · {payMeta?.label ?? s.payment_method}
                      </p>
                    </div>
                    <span className="font-bold text-zinc-950">{fmtBRL(s.total)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
