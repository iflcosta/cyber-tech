import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createCRMServerClient } from '@/app/admin/crm/lib/supabase/server';
import { StatusBadge } from '@/app/admin/crm/components/StatusBadge';
import { StaleBadge } from '@/app/admin/crm/components/StaleBadge';
import { OSDetailActions } from './OSDetailActions';
import { StatusQuickActions } from './StatusQuickActions';
import { OSDeleteButton } from './OSDeleteButton';
import { OSTimeline } from '@/app/admin/crm/components/OSTimeline';
import { RepairNotesEditor } from './RepairNotesEditor';
import { ENTRY_CHECKLIST_FIELDS, EQUIPMENT_TYPES, type EquipmentTypeValue } from '@/app/admin/crm/types/database';

export const dynamic = 'force-dynamic';

export default async function OSDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createCRMServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/crm/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();

  // Busca direto da tabela (nao da view) pra OSs finalizadas
  // (delivered/cancelled) nao darem 404. A view filtra essas fora.
  const { data: so } = await supabase
    .from('service_orders')
    .select(`
      *,
      customer:customers(name, phone),
      assigned:profiles!service_orders_assigned_to_fkey(full_name)
    `)
    .eq('id', id)
    .single();
  if (!so) notFound();

  // Normalizar campos que a view fornecia
  const customerName = (so as any).customer?.name ?? '(cliente removido)';
  const customerPhone = (so as any).customer?.phone ?? null;
  const assignedToName = (so as any).assigned?.full_name ?? null;
  const daysSinceUpdate = Math.max(
    0,
    Math.floor((Date.now() - new Date(so.updated_at).getTime()) / 86400000),
  );
  const normalizedSo = {
    ...so,
    customer_name: customerName,
    customer_phone: customerPhone,
    assigned_to_name: assignedToName,
    days_since_update: daysSinceUpdate,
  };

  const { data: events } = await supabase
    .from('service_order_events')
    .select('*')
    .eq('service_order_id', id)
    .order('created_at', { ascending: false });

  // Pecas usadas (referenciadas via os_number em stock_movements)
  const { data: partsUsed } = await supabase
    .from('stock_movements')
    .select(`
      id, quantity, unit_price, total_amount, created_at,
      stock_item:stock_items(name, ean13)
    `)
    .eq('reference', so.os_number)
    .in('movement_type', ['out', 'sale'])
    .order('created_at', { ascending: true });

  const partsTotal = (partsUsed ?? []).reduce(
    (acc, p) => acc + Number(p.total_amount ?? 0),
    0,
  );
  const laborCost = Number(so.labor_cost ?? 0);
  const grandTotal = laborCost + partsTotal;

  const { data: technicians } = await supabase
    .from('profiles')
    .select('id, full_name, role, active')
    .eq('active', true);

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
          <Link href="/admin/crm/os" className="text-sm text-blue-600 hover:text-blue-700">
            ← Todas as OS
          </Link>
          <h1 className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-bold text-slate-900">
            <span className="font-mono text-2xl font-bold tracking-tight text-slate-900">
              {normalizedSo.short_id ?? normalizedSo.os_number ?? normalizedSo.id.slice(0, 8)}
            </span>
            {normalizedSo.os_number && (
              <span className="font-mono text-sm font-medium text-slate-400">
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
            href={`/admin/crm/os/${normalizedSo.id}/label`}
            target="_blank"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            🏷️ Etiqueta
          </Link>
          <Link
            href={`/admin/crm/os/${normalizedSo.id}/print`}
            target="_blank"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            🖨️ Imprimir
          </Link>
          <Link
            href={`/admin/crm/os/${normalizedSo.id}/recibo`}
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
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Diagnóstico e reparo
              </h2>
              <Link
                href={`/admin/crm/estoque`}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                + Adicionar peça (use referência {normalizedSo.os_number})
              </Link>
            </div>
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
                        {(p as any).stock_item?.name ?? '(item removido)'}
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
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Checklist de entrada</h2>
            <ul className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              {ENTRY_CHECKLIST_FIELDS.map((f) => {
                const val = normalizedSo.entry_checklist?.[f.key];
                return (
                  <li key={f.key} className="flex items-center gap-2">
                    <span className={val ? 'text-emerald-600' : 'text-red-500'}>
                      {val ? '✓' : '✗'}
                    </span>
                    <span className="text-slate-700">{f.label}</span>
                  </li>
                );
              })}
            </ul>
            {normalizedSo.accessories_in && (
              <p className="mt-3 text-sm text-slate-600">
                <strong>Acessórios:</strong> {normalizedSo.accessories_in}
              </p>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Linha do tempo</h2>
            <div className="mt-3">
              <OSTimeline events={events ?? []} authorNames={authorNames} />
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          {profile && !isFinal && (
            <StatusQuickActions
              osId={normalizedSo.id}
              currentStatus={normalizedSo.status}
              currentUserId={profile.id}
              currentUserName={profile.full_name}
              canEdit={canEdit}
            />
          )}
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

          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Atribuição</h2>
            <p className="mt-1 text-sm">
              {normalizedSo.assigned_to_name ? (
                <>Técnico: <strong>{normalizedSo.assigned_to_name}</strong></>
              ) : (
                <span className="text-slate-500">Sem técnico atribuído</span>
              )}
            </p>
            {normalizedSo.estimated_ready_at && (
              <p className="mt-1 text-sm">Previsão: <strong>{new Date(normalizedSo.estimated_ready_at).toLocaleDateString('pt-BR')}</strong></p>
            )}
          </section>

          {profile && !isFinal && (
            <OSDetailActions
              osId={normalizedSo.id}
              currentStatus={normalizedSo.status}
              currentAssignedTo={normalizedSo.assigned_to}
              currentBlocking={normalizedSo.blocking_reason}
              canEdit={canEdit}
              currentUserId={profile.id}
              currentUserName={profile.full_name}
              technicians={(technicians ?? []).filter((t) => t.role === 'technician')}
              owners={(technicians ?? []).filter((t) => t.role === 'owner')}
              isOwner={profile.role === 'owner'}
            />
          )}
          {profile && (
            <OSDeleteButton
              osId={normalizedSo.id}
              osShortId={normalizedSo.short_id ?? normalizedSo.os_number ?? normalizedSo.id.slice(0, 8)}
              isOwner={profile.role === 'owner'}
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
