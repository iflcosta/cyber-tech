import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createCRMServerClient } from '@/app/admin/crm/lib/supabase/server';
import { StatusBadge } from '@/app/admin/crm/components/StatusBadge';
import { StaleBadge } from '@/app/admin/crm/components/StaleBadge';
import { OSDetailActions } from './OSDetailActions';
import { OSTimeline } from '@/app/admin/crm/components/OSTimeline';
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

  const { data: so } = await supabase
    .from('service_orders_with_stale')
    .select('*')
    .eq('id', id)
    .single();
  if (!so) notFound();

  const { data: events } = await supabase
    .from('service_order_events')
    .select('*')
    .eq('service_order_id', id)
    .order('created_at', { ascending: false });

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

  // Qualquer tecnico logado pode editar qualquer OS (regra do Felipe 2026-06-18).
  // Owner tambem pode tudo. Isso permite Iago/Jefferson redistribuirem entre si
  // sem depender do Felipe. A timeline registra toda mudanca.
  const canEdit =
    profile?.role === 'owner' || profile?.role === 'technician';
  const typeMeta = EQUIPMENT_TYPES.find((t) => t.value === (so.equipment_type as EquipmentTypeValue));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/admin/crm/os" className="text-sm text-blue-600 hover:text-blue-700">
            ← Todas as OS
          </Link>
          <h1 className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-bold text-slate-900">
            <span className="font-mono text-2xl font-bold tracking-tight text-slate-900">
              {so.short_id}
            </span>
            <span className="font-mono text-sm font-medium text-slate-400">
              {so.os_number}
            </span>
            <StatusBadge status={so.status} />
            <StaleBadge days={so.days_since_update} />
          </h1>
          <p className="text-sm text-slate-500">
            {so.customer_name} · {typeMeta?.label}
            {so.equipment_brand ? ` · ${so.equipment_brand}` : ''}
            {so.equipment_model ? ` ${so.equipment_model}` : ''}
          </p>
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <Link
            href={`/admin/crm/os/${so.id}/label`}
            target="_blank"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            🏷️ Etiqueta
          </Link>
          <Link
            href={`/admin/crm/os/${so.id}/print`}
            target="_blank"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            🖨️ Imprimir
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Defeito relatado</h2>
            <p className="mt-1 whitespace-pre-wrap text-slate-900">{so.reported_defect}</p>
            {so.blocking_reason && (
              <div className="mt-3 rounded-md bg-orange-50 p-3 text-sm text-orange-800 ring-1 ring-orange-200">
                <strong>Travado em:</strong> {so.blocking_reason}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Checklist de entrada</h2>
            <ul className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              {ENTRY_CHECKLIST_FIELDS.map((f) => {
                const val = so.entry_checklist?.[f.key];
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
            {so.accessories_in && (
              <p className="mt-3 text-sm text-slate-600">
                <strong>Acessórios:</strong> {so.accessories_in}
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
          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Cliente</h2>
            <p className="mt-1 font-medium text-slate-900">{so.customer_name}</p>
            {so.customer_phone && (
              <p className="text-sm text-slate-600">
                <a href={`tel:${so.customer_phone}`} className="text-blue-600 hover:underline">
                  📞 {so.customer_phone}
                </a>
              </p>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Aparelho</h2>
            <dl className="mt-1 space-y-1 text-sm">
              <Row label="Tipo" value={typeMeta?.label} />
              {so.equipment_brand && <Row label="Marca" value={so.equipment_brand} />}
              {so.equipment_model && <Row label="Modelo" value={so.equipment_model} />}
              {so.equipment_color && <Row label="Cor" value={so.equipment_color} />}
              {so.equipment_serial && <Row label="IMEI / Serial" value={so.equipment_serial} />}
              {so.equipment_password && (
                <Row label="Senha" value={<code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{so.equipment_password}</code>} />
              )}
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Atribuição</h2>
            <p className="mt-1 text-sm">
              {so.assigned_to_name ? (
                <>Técnico: <strong>{so.assigned_to_name}</strong></>
              ) : (
                <span className="text-slate-500">Sem técnico atribuído</span>
              )}
            </p>
            {so.estimated_ready_at && (
              <p className="mt-1 text-sm">Previsão: <strong>{new Date(so.estimated_ready_at).toLocaleDateString('pt-BR')}</strong></p>
            )}
          </section>

          <OSDetailActions
            osId={so.id}
            currentStatus={so.status}
            currentAssignedTo={so.assigned_to}
            currentBlocking={so.blocking_reason}
            canEdit={canEdit}
            currentUserId={profile!.id}
            currentUserName={profile!.full_name}
            technicians={(technicians ?? []).filter((t) => t.role === 'technician')}
            owners={(technicians ?? []).filter((t) => t.role === 'owner')}
            isOwner={profile!.role === 'owner'}
          />
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
