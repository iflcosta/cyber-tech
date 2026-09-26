import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { StatusBadge } from '@/app/admin/components/StatusBadge';
import { StaleBadge } from '@/app/admin/components/StaleBadge';
import { WhatsAppButton } from '@/app/admin/components/WhatsAppButton';
import { OSDetailActions } from './OSDetailActions';
import { StatusQuickActions } from './StatusQuickActions';
import { OSDeleteButton } from './OSDeleteButton';
import { OSTimeline } from '@/app/admin/components/OSTimeline';
import { RepairNotesEditor } from './RepairNotesEditor';
import { ChecklistEditor } from './ChecklistEditor';
import { EstimatedValueEditor } from './EstimatedValueEditor';
import { PaymentStatusEditor } from './PaymentStatusEditor';
import { PartOrderStatusBadge } from '@/app/admin/components/PartOrderStatusBadge';
import { UsePartForm } from './UsePartForm';
import UpsellPromptPanel from './UpsellPromptPanel'
import { EQUIPMENT_TYPES, type EquipmentTypeValue } from '@/app/admin/types/database';
import { formatDateOnlyBR } from '@/app/admin/lib/datetime';

export const dynamic = 'force-dynamic';

export default async function OSDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getAuthedUser();
  if (!user) redirect('/admin/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, can_delete')
    .eq('id', user.id)
    .single();

  // Busca direto da tabela (nao da view) pra OSs finalizadas
  // (delivered/cancelled) nao darem 404. A view filtra essas fora.
  const { data: so } = await supabase
    .from('service_orders')
    .select(`
      *,
      customer:customers(name, phone)
    `)
    .eq('id', id)
    .single();
  if (!so) notFound();

  // Normalizar campos que a view fornecia
  const soWithCustomer = so as typeof so & { customer: { name: string; phone: string | null } | null };
  const customerName = soWithCustomer.customer?.name ?? '(cliente removido)';
  const customerPhone = soWithCustomer.customer?.phone ?? null;
  // Server Component, lido uma vez por request — Date.now() aqui é
  // seguro, o linter de pureza só não distingue Server de Client.
  // eslint-disable-next-line react-hooks/purity
  const nowForStale = Date.now();
  const daysSinceUpdate = Math.max(
    0,
    Math.floor((nowForStale - new Date(so.updated_at).getTime()) / 86400000),
  );
  const normalizedSo = {
    ...so,
    customer_name: customerName,
    customer_phone: customerPhone,
    days_since_update: daysSinceUpdate,
  };

  const { data: events } = await supabase
    .from('service_order_events')
    .select('*')
    .eq('service_order_id', id)
    .order('created_at', { ascending: false });

  // Pecas usadas (vinculo real via service_order_id, nao mais texto)
  type PartUsed = {
    id: string;
    quantity: number;
    unit_price: number;
    total_amount: number | null;
    created_at: string;
    stock_item: { name: string; ean13: string | null } | null;
  };
  const { data: partsUsedRaw } = await supabase
    .from('stock_movements')
    .select(`
      id, quantity, unit_price, total_amount, created_at,
      stock_item:stock_items(name, ean13)
    `)
    .eq('service_order_id', id)
    .in('movement_type', ['out', 'sale'])
    .order('created_at', { ascending: true });
  // Select com join via string-template: o supabase-js não consegue
  // inferir a cardinalidade (1:1) de stock_item a partir da string só —
  // sem isso ele tipa como array. Mesmo padrão de cast já usado mais
  // abaixo pra partOrders.
  const partsUsed = partsUsedRaw as unknown as PartUsed[] | null;

  const partsTotal = (partsUsed ?? []).reduce(
    (acc, p) => acc + Number(p.total_amount ?? 0),
    0,
  );
  const laborCost = Number(so.labor_cost ?? 0);
  const grandTotal = laborCost + partsTotal;

  const { data: payments } = await supabase
    .from('service_order_payments')
    .select('id, amount, payment_method, paid_at')
    .eq('service_order_id', id)
    .order('paid_at', { ascending: false });

  // Itens de estoque ativos pro mini-formulario "usar peca do estoque"
  const { data: stockItemsForUse } = await supabase
    .from('stock_items')
    .select('id, name, ean13, internal_sku, unit_price, current_stock')
    .eq('active', true)
    .gt('current_stock', 0)
    .order('name');

  // Pedidos de peça vinculados a esta OS (fornecedor, não estoque)
  type LinkedPartOrder = {
    id: string;
    part_description: string;
    part_variant: string | null;
    status: string;
    part_value: number;
    supplier: { name: string } | null;
  };
  const { data: partOrdersRaw } = await supabase
    .from('part_orders')
    .select('id, part_description, part_variant, status, part_value, supplier:suppliers(name)')
    .eq('service_order_id', id)
    .order('created_at', { ascending: false });
  const partOrders = partOrdersRaw as unknown as LinkedPartOrder[] | null;

  const authorIds = Array.from(new Set((events ?? []).map((e) => e.author_id)));
  const { data: authorProfiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', authorIds);
  const authorNames = Object.fromEntries(
    (authorProfiles ?? []).map((p) => [p.id, p.full_name]),
  );

  const canEdit =
    profile?.role === 'owner' || profile?.role === 'technician';
  const typeMeta = EQUIPMENT_TYPES.find((t) => t.value === (so.equipment_type as EquipmentTypeValue));
  const isFinal = so.status === 'delivered' || so.status === 'cancelled';

  return (
    <div className="space-y-6">
      {isFinal && (
        <div className="rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-700">
          <strong>OS finalizada</strong> — status <em>{so.status === 'delivered' ? 'entregue' : 'cancelada'}</em>.
          A OS nao aparece na lista de ativas mas pode ser consultada por este link.
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/admin/os" className="text-sm text-blue-600 hover:text-blue-700">
            ← Todas as OS
          </Link>
          <h1 className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-bold text-slate-900">
            <span className="font-mono text-2xl font-bold tracking-tight text-slate-900">
              {normalizedSo.short_id ?? normalizedSo.os_number ?? normalizedSo.id.slice(0, 8)}
            </span>
            {normalizedSo.os_number && (
              <span className="font-mono text-sm font-medium text-slate-500">
                {normalizedSo.os_number}
              </span>
            )}
            <StatusBadge status={normalizedSo.status} />
            <StaleBadge days={normalizedSo.days_since_update} />
          </h1>
          <p className="text-sm text-slate-500">
            {normalizedSo.customer_name} · {typeMeta?.label}
            {normalizedSo.equipment_brand ? ` · ${normalizedSo.equipment_brand}` : ''}
            {normalizedSo.equipment_model ? ` ${normalizedSo.equipment_model}` : ''}
          </p>
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <Link
            href={`/admin/os/${normalizedSo.id}/label`}
            target="_blank"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            🏷️ Etiqueta
          </Link>
          <Link
            href={`/admin/os/${normalizedSo.id}/print`}
            target="_blank"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            🖨️ Imprimir
          </Link>
          <Link
            href={`/admin/os/${normalizedSo.id}/recibo`}
            target="_blank"
            className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
          >
            🧾 Recibo
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Defeito relatado</h2>
            <p className="mt-1 whitespace-pre-wrap text-slate-900">{normalizedSo.reported_defect}</p>
            {normalizedSo.blocking_reason && (
              <div className="mt-3 rounded-md bg-orange-50 p-3 text-sm text-orange-800 ring-1 ring-orange-200">
                <strong>Travado em:</strong> {normalizedSo.blocking_reason}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-blue-200 bg-blue-50/30 p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Diagnóstico e reparo
            </h2>
            <div className="mt-3">
              <RepairNotesEditor
                osId={normalizedSo.id}
                initialNotes={normalizedSo.repair_notes ?? ''}
                initialLaborCost={Number(normalizedSo.labor_cost ?? 0)}
                canEdit={canEdit}
              />
            </div>

            {(partsUsed && partsUsed.length > 0) ? (
              <div className="mt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Peças usadas ({partsUsed.length})
                </h3>
                <ul className="mt-2 divide-y divide-slate-200 text-sm">
                  {partsUsed.map((p) => (
                    <li key={p.id} className="flex items-center justify-between py-1.5">
                      <span className="text-slate-900">
                        {p.stock_item?.name ?? '(item removido)'}
                        <span className="ml-2 font-mono text-slate-500">×{p.quantity}</span>
                      </span>
                      <span className="font-mono text-slate-900">
                        R$ {Number(p.total_amount ?? 0).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 space-y-1 border-t border-slate-300 pt-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Peças</span>
                    <span className="font-mono text-slate-900">R$ {partsTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Mão de obra</span>
                    <span className="font-mono text-slate-900">R$ {laborCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-400 pt-1.5 text-base font-bold">
                    <span className="text-slate-900">Total</span>
                    <span className="font-mono text-slate-900">R$ {grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : null}

            {canEdit && !isFinal && (
              <div className="mt-4 border-t border-blue-200 pt-3">
                <UsePartForm
                  serviceOrderId={normalizedSo.id}
                  currentUserId={profile?.id ?? ''}
                  items={stockItemsForUse ?? []}
                />
              </div>
            )}
          </section>

          {(partOrders && partOrders.length > 0) && (
            <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Pedidos de peça (fornecedor)
                </h2>
                <Link href="/admin/pecas/new" className="text-xs text-blue-600 hover:text-blue-700">
                  + Novo pedido
                </Link>
              </div>
              <ul className="mt-2 divide-y divide-slate-200 text-sm">
                {partOrders.map((po) => (
                  <li key={po.id} className="py-1.5">
                    <Link href={`/admin/pecas/${po.id}`} className="flex items-center justify-between gap-2 hover:text-blue-700">
                      <span className="text-slate-900">
                        {po.part_description}
                        {po.part_variant ? ` · ${po.part_variant}` : ''}
                        <span className="ml-2 text-xs text-slate-500">{po.supplier?.name}</span>
                      </span>
                      <PartOrderStatusBadge status={po.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Checklist de entrada</h2>
            <ChecklistEditor
              osId={normalizedSo.id}
              initialChecklist={normalizedSo.entry_checklist}
              canEdit={canEdit}
            />
            {normalizedSo.accessories_in && (
              <p className="mt-3 text-sm text-slate-600">
                <strong>Acessórios:</strong> {normalizedSo.accessories_in}
              </p>
            )}
            {normalizedSo.equipment_photos && normalizedSo.equipment_photos.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Foto na entrada ({normalizedSo.equipment_photos.length})
                </p>
                <div className="mt-1.5 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {normalizedSo.equipment_photos.map((url: string) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt="Foto do aparelho na entrada"
                        className="aspect-square w-full rounded-md border border-slate-200 object-cover hover:opacity-90"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Linha do tempo</h2>
            <div className="mt-3">
              <OSTimeline events={events ?? []} authorNames={authorNames} />
            </div>
          </section>

          <UpsellPromptPanel
            defect={normalizedSo.reported_defect ?? ""}
            equipmentType={normalizedSo.equipment_type ?? ""}
            status={normalizedSo.status ?? ""}
          />
        </div>

        <aside className="space-y-4">
          {profile && !isFinal && (
            <StatusQuickActions
              osId={normalizedSo.id}
              currentStatus={normalizedSo.status}
              currentUserId={profile.id}
              currentUserName={profile.full_name}
              customerPhone={normalizedSo.customer_phone}
              customerName={normalizedSo.customer_name}
              osLabel={normalizedSo.short_id ?? normalizedSo.os_number ?? undefined}
              canEdit={canEdit}
              currentEstimatedValue={normalizedSo.estimated_value}
            />
          )}

          <section id="orcamento-section" className="scroll-mt-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Orçamento</h2>
            <div className="mt-1">
              <EstimatedValueEditor
                osId={normalizedSo.id}
                initialValue={normalizedSo.estimated_value}
                canEdit={canEdit}
              />
            </div>
            <div className="mt-3 border-t border-slate-100 pt-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pagamento</h3>
              <div className="mt-1">
                <PaymentStatusEditor
                  osId={normalizedSo.id}
                  grandTotal={grandTotal}
                  payments={(payments ?? []) as never}
                  canEdit={canEdit}
                  canDelete={profile?.can_delete === true}
                />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Cliente</h2>
            <p className="mt-1 font-medium text-slate-900">{normalizedSo.customer_name}</p>
            {normalizedSo.customer_phone && (
              <p className="text-sm text-slate-600">
                <a href={`tel:${normalizedSo.customer_phone}`} className="text-blue-600 hover:underline">
                  📞 {normalizedSo.customer_phone}
                </a>
              </p>
            )}
            <div className="mt-3 border-t border-slate-100 pt-3">
              <WhatsAppButton
                phone={normalizedSo.customer_phone}
                customerName={normalizedSo.customer_name}
                context="os"
              />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Aparelho</h2>
            <dl className="mt-1 space-y-1 text-sm">
              <Row label="Tipo" value={typeMeta?.label} />
              {normalizedSo.equipment_brand && <Row label="Marca" value={normalizedSo.equipment_brand} />}
              {normalizedSo.equipment_model && <Row label="Modelo" value={normalizedSo.equipment_model} />}
              {normalizedSo.equipment_color && <Row label="Cor" value={normalizedSo.equipment_color} />}
              {normalizedSo.equipment_serial && <Row label="IMEI / Serial" value={normalizedSo.equipment_serial} />}
              {normalizedSo.equipment_password && (
                <Row label="Senha" value={<code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{normalizedSo.equipment_password}</code>} />
              )}
            </dl>
          </section>

          {normalizedSo.estimated_ready_at && (
            <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Previsão</h2>
              <p className="mt-1 text-sm"><strong>{formatDateOnlyBR(normalizedSo.estimated_ready_at)}</strong></p>
            </section>
          )}

          {profile && !isFinal && (
            <OSDetailActions
              osId={normalizedSo.id}
              currentBlocking={normalizedSo.blocking_reason}
              canEdit={canEdit}
              currentUserId={profile.id}
              isOwner={profile.role === 'owner'}
            />
          )}
          {profile && (
            <OSDeleteButton
              osId={normalizedSo.id}
              osShortId={normalizedSo.short_id ?? normalizedSo.os_number ?? normalizedSo.id.slice(0, 8)}
              canDelete={profile.can_delete === true}
            />
          )}
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

