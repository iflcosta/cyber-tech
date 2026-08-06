import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { PartOrderStatusBadge } from '@/app/admin/components/PartOrderStatusBadge';
import { PartOrderTimeline } from '@/app/admin/components/PartOrderTimeline';
import { PartOrderActions } from './PartOrderActions';
import type { PartOrder, PartOrderStatusValue, ReturnReasonValue } from '@/app/admin/types/database';
import { formatDateTimeShortBR } from '@/app/admin/lib/datetime';

export const dynamic = 'force-dynamic';

type PartOrderDetailRow = PartOrder & {
  supplier: { id: string; name: string; phone: string | null } | null;
  service_order: {
    id: string;
    short_id: string | null;
    os_number: string | null;
    customer: { name: string; phone: string | null } | null;
  } | null;
};

export default async function PartOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getAuthedUser();
  if (!user) redirect('/admin/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();

  const { data: order } = await supabase
    .from('part_orders')
    .select(`
      *,
      supplier:suppliers(id, name, phone),
      service_order:service_orders(id, short_id, os_number, customer:customers(name, phone))
    `)
    .eq('id', id)
    .single();
  if (!order) notFound();

  const orderRow = order as unknown as PartOrderDetailRow;

  const { data: events } = await supabase
    .from('part_order_events')
    .select('*')
    .eq('part_order_id', id)
    .order('created_at', { ascending: false });

  const { data: requester } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', orderRow.requested_by)
    .maybeSingle();

  const authorIds = Array.from(new Set((events ?? []).map((e) => e.author_id)));
  const { data: authorProfiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', authorIds.length > 0 ? authorIds : ['00000000-0000-0000-0000-000000000000']);
  const authorNames = Object.fromEntries((authorProfiles ?? []).map((p) => [p.id, p.full_name]));

  const supplier = orderRow.supplier;
  const so = orderRow.service_order;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/pecas" className="text-sm text-blue-600 hover:text-blue-700">
          ← Todos os pedidos
        </Link>
        <h1 className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-bold text-slate-900">
          {order.part_description}
          {order.part_variant && <span className="text-lg font-normal text-slate-500">· {order.part_variant}</span>}
          <PartOrderStatusBadge status={order.status} />
        </h1>
        <p className="text-sm text-slate-500">
          {supplier?.name ?? '(fornecedor removido)'}
          {supplier?.phone ? ` · ${supplier.phone}` : ''}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Vínculo</h2>
            {so ? (
              <p className="mt-1 text-slate-900">
                OS{' '}
                <Link href={`/admin/os/${so.id}`} className="font-mono font-semibold text-blue-600 hover:text-blue-700">
                  {so.short_id ?? so.os_number}
                </Link>
                {' · '}{so.customer?.name}
              </p>
            ) : (
              <p className="mt-1 text-slate-700">{order.context_note ?? <span className="text-slate-500">Sem contexto</span>}</p>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Linha do tempo</h2>
            <div className="mt-3">
              <PartOrderTimeline events={events ?? []} authorNames={authorNames} />
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          {profile && (
            <PartOrderActions
              orderId={order.id}
              status={order.status as PartOrderStatusValue}
              returnReason={order.return_reason as ReturnReasonValue | null}
              currentUserId={profile.id}
            />
          )}

          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Valor</h2>
            <p className="mt-1 font-mono text-xl font-bold text-slate-900">
              {Number(order.part_value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pedido por</h2>
            <p className="mt-1 text-sm text-slate-900">{requester?.full_name ?? '—'}</p>
            <p className="text-xs text-slate-500">
              {formatDateTimeShortBR(order.created_at)}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
