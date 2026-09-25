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
import { PaymentStatusEditor } from './PaymentStatusEditor';
import { PartOrderStatusBadge } from '@/app/admin/components/PartOrderStatusBadge';
import { UsePartForm } from './UsePartForm';
import { EquipmentEditor } from './EquipmentEditor';
import { getEquipmentTypeLabel } from '@/app/admin/types/database';

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

  // Peças usadas (vínculo real via service_order_id)
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
  const partsUsed = partsUsedRaw as unknown as PartUsed[] | null;

  const partsTotal = (partsUsed ?? []).reduce(
    (acc, p) => acc + Number(p.total_amount ?? 0),
    0,
  );
  const laborCost = Number(so.labor_cost ?? 0);
  const estimatedVal = Number(so.estimated_value ?? 0);
  // Fonte única de verdade: Serviço (Mão de Obra) + Peças = Total da OS.
  // Retrocompatibilidade: se uma OS antiga tinha só estimated_value preenchido e labor_cost = 0,
  // derivamos o valor de serviço efetivo a partir de estimated_value.
  const effectiveLaborCost = laborCost > 0 ? laborCost : Math.max(0, estimatedVal - partsTotal);
  const grandTotal = effectiveLaborCost + partsTotal;

  const { data: payments } = await supabase
    .from('service_order_payments')
    .select('id, amount, payment_method, paid_at')
    .eq('service_order_id', id)
    .order('paid_at', { ascending: false });

  // Itens de estoque ativos pro mini-formulário "usar peça do estoque"
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
  const typeLabel = getEquipmentTypeLabel(so.equipment_type);
  const isFinal = so.status === 'delivered' || so.status === 'cancelled';

  return (
    <div className="space-y-6">
      {isFinal && (
        <div className="rounded-lg border border-zinc-300 bg-zinc-50 p-3 text-sm text-zinc-700">
          <strong>OS finalizada</strong> — status <em>{so.status === 'delivered' ? 'entregue' : 'cancelada'}</em>.
          A OS não aparece na lista de ativas mas pode ser consultada por este link.
        </div>
      )}

      {so.status === 'delivered' && normalizedSo.payment_status !== 'paid' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <div>
            <p className="font-semibold flex items-center gap-1.5">
              ⚠️ OS entregue com pagamento pendente
            </p>
            <p className="mt-0.5 text-xs text-amber-800">
              O aparelho já foi retirado pelo cliente, mas o valor total ainda não foi quitado no sistema.
            </p>
          </div>
          <a
            href="#pagamento-section"
            className="flex-shrink-0 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-black transition-colors"
          >
            Registrar pagamento agora ↓
          </a>
        </div>
      )}

      {/* Cabeçalho da OS */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/os" className="text-sm text-zinc-600 hover:text-black">
            ← Todas as OS
          </Link>
          <h1 className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-bold text-zinc-950">
            <span className="font-mono text-2xl font-bold tracking-tight text-zinc-950">
              {normalizedSo.short_id ?? normalizedSo.os_number ?? normalizedSo.id.slice(0, 8)}
            </span>
            {normalizedSo.os_number && (
              <span className="font-mono text-sm font-medium text-zinc-500">
                {normalizedSo.os_number}
              </span>
            )}
            <StatusBadge status={normalizedSo.status} />
            <StaleBadge days={normalizedSo.days_since_update} />
          </h1>
          <p className="text-sm text-zinc-500">
            {normalizedSo.customer_name} · {typeLabel}
            {normalizedSo.equipment_brand ? ` · ${normalizedSo.equipment_brand}` : ''}
            {normalizedSo.equipment_model ? ` ${normalizedSo.equipment_model}` : ''}
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-wrap gap-2">
          <Link
            href={`/admin/os/${normalizedSo.id}/label`}
            target="_blank"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            🏷️ Etiqueta
          </Link>
          <Link
            href={`/admin/os/${normalizedSo.id}/print`}
            target="_blank"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            🖨️ Entrada (A4)
          </Link>
          <Link
            href={`/admin/os/${normalizedSo.id}/recibo`}
            target="_blank"
            className="rounded-md bg-black px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 transition-colors"
          >
            📄 Nota / Recibo (PDF)
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Coluna Principal (2/3): 3 blocos coesos */}
        <div className="space-y-4 lg:col-span-2">
          {/* BLOCO 1: Entrada & Inspeção do Aparelho */}
          <section className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                1. Entrada & Defeito Relatado
              </h2>
              <p className="mt-1.5 whitespace-pre-wrap text-base text-zinc-950">
                {normalizedSo.reported_defect}
              </p>
              {normalizedSo.blocking_reason && (
                <div className="mt-3 rounded-md bg-orange-50 p-3 text-sm text-orange-800 ring-1 ring-orange-200">
                  <strong>⚠️ Travado em:</strong> {normalizedSo.blocking_reason}
                </div>
              )}
            </div>

            <div className="border-t border-zinc-100 pt-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Checklist de entrada
              </h3>
              <ChecklistEditor
                osId={normalizedSo.id}
                initialChecklist={normalizedSo.entry_checklist}
                canEdit={canEdit}
              />
              {normalizedSo.accessories_in && (
                <p className="mt-3 text-sm text-zinc-700">
                  <strong>Acessórios deixados:</strong> {normalizedSo.accessories_in}
                </p>
              )}
            </div>

            {normalizedSo.equipment_photos && normalizedSo.equipment_photos.length > 0 && (
              <div className="border-t border-zinc-100 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Fotos na entrada ({normalizedSo.equipment_photos.length})
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {normalizedSo.equipment_photos.map((url: string) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt="Foto do aparelho na entrada"
                        className="aspect-square w-full rounded-md border border-zinc-200 object-cover hover:opacity-90"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* BLOCO 2: Bancada — Diagnóstico, Peças & Valores */}
          <section className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                2. Bancada — Diagnóstico, Serviço & Peças
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Defina o laudo técnico, o valor do serviço (mão de obra) e as peças utilizadas. O total da OS é calculado automaticamente.
              </p>
            </div>

            <RepairNotesEditor
              osId={normalizedSo.id}
              initialNotes={normalizedSo.repair_notes ?? ''}
              initialLaborCost={effectiveLaborCost}
              partsTotal={partsTotal}
              canEdit={canEdit}
            />

            {(partsUsed && partsUsed.length > 0) && (
              <div className="border-t border-zinc-200 pt-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Peças aplicadas do estoque ({partsUsed.length})
                </h3>
                <ul className="mt-2 divide-y divide-zinc-100 text-sm">
                  {partsUsed.map((p) => (
                    <li key={p.id} className="flex items-center justify-between py-1.5">
                      <span className="text-zinc-900">
                        {p.stock_item?.name ?? '(item removido)'}
                        <span className="ml-2 font-mono text-zinc-500">×{p.quantity}</span>
                      </span>
                      <span className="font-mono font-medium text-zinc-900">
                        R$ {Number(p.total_amount ?? 0).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {canEdit && !isFinal && (
              <div className="border-t border-zinc-200 pt-3">
                <UsePartForm
                  serviceOrderId={normalizedSo.id}
                  currentUserId={profile?.id ?? ''}
                  items={stockItemsForUse ?? []}
                />
              </div>
            )}

            <div className="border-t border-zinc-200 pt-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Encomendas a fornecedor {partOrders && partOrders.length > 0 ? `(${partOrders.length})` : ''}
                </h3>
                <Link
                  href="/admin/pecas/new"
                  className="text-xs font-semibold text-zinc-900 underline hover:text-black"
                >
                  + Encomendar peça externa
                </Link>
              </div>
              {partOrders && partOrders.length > 0 ? (
                <ul className="mt-2 divide-y divide-zinc-100 text-sm">
                  {partOrders.map((po) => (
                    <li key={po.id} className="py-1.5">
                      <Link
                        href={`/admin/pecas/${po.id}`}
                        className="flex items-center justify-between gap-2 hover:text-black"
                      >
                        <span className="text-zinc-900">
                          {po.part_description}
                          {po.part_variant ? ` · ${po.part_variant}` : ''}
                          <span className="ml-2 text-xs text-zinc-500">{po.supplier?.name}</span>
                        </span>
                        <PartOrderStatusBadge status={po.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs text-zinc-400">
                  Nenhuma peça encomendada de fornecedor para esta OS.
                </p>
              )}
            </div>
          </section>

          {/* BLOCO 3: Linha do Tempo & Anotações */}
          <section className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                3. Linha do Tempo & Histórico
              </h2>
              {profile && !isFinal && (
                <OSDetailActions
                  osId={normalizedSo.id}
                  currentBlocking={normalizedSo.blocking_reason}
                  canEdit={canEdit}
                  currentUserId={profile.id}
                />
              )}
            </div>
            <div className="mt-3">
              <OSTimeline events={events ?? []} authorNames={authorNames} />
            </div>
          </section>
        </div>

        {/* Barra Lateral (1/3): 3 blocos operacionais */}
        <aside className="space-y-4">
          {/* BLOCO 4: Fluxo da OS (StatusQuickActions) */}
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
              currentLaborCost={effectiveLaborCost}
              partsTotal={partsTotal}
              currentEstimatedValue={normalizedSo.estimated_value}
              grandTotal={grandTotal}
              reportedDefect={normalizedSo.reported_defect}
              repairNotes={normalizedSo.repair_notes}
              payments={(payments ?? []) as never}
              paymentStatus={normalizedSo.payment_status}
            />
          )}

          {/* BLOCO 5: Financeiro & Pagamento */}
          <section
            id="pagamento-section"
            className="scroll-mt-4 rounded-lg border border-zinc-200 bg-white p-4 sm:p-5"
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Financeiro & Pagamento
            </h2>
            <div className="mt-2.5">
              <PaymentStatusEditor
                osId={normalizedSo.id}
                serviceCost={effectiveLaborCost}
                partsTotal={partsTotal}
                grandTotal={grandTotal}
                payments={(payments ?? []) as never}
                canEdit={canEdit}
                canDelete={profile?.can_delete === true}
              />
            </div>
          </section>

          {/* BLOCO 6: Ficha do Cliente & Aparelho */}
          <section className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Cliente
              </h2>
              <p className="mt-1 font-semibold text-zinc-950">{normalizedSo.customer_name}</p>
              {normalizedSo.customer_phone && (
                <p className="text-xs font-mono text-zinc-600 mt-0.5">
                  {normalizedSo.customer_phone}
                </p>
              )}
              <div className="mt-2.5">
                <WhatsAppButton
                  phone={normalizedSo.customer_phone}
                  customerName={normalizedSo.customer_name}
                  context="os"
                />
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-3">
              <EquipmentEditor
                osId={normalizedSo.id}
                initialType={normalizedSo.equipment_type}
                initialBrand={normalizedSo.equipment_brand}
                initialModel={normalizedSo.equipment_model}
                initialColor={normalizedSo.equipment_color}
                initialSerial={normalizedSo.equipment_serial}
                initialPassword={normalizedSo.equipment_password}
                initialEstimatedReadyAt={normalizedSo.estimated_ready_at}
                canEdit={canEdit}
              />
            </div>
          </section>

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
