import { notFound, redirect } from 'next/navigation';
import { createCRMServerClient } from '../../../../lib/supabase/server';
import { ENTRY_CHECKLIST_FIELDS, EQUIPMENT_TYPES, type EquipmentTypeValue } from '../../../../types/database';

export const dynamic = 'force-dynamic';

export default async function PrintOSPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createCRMServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: so } = await supabase
    .from('service_orders_with_stale')
    .select('*')
    .eq('id', id)
    .single();
  if (!so) notFound();

  const typeMeta = EQUIPMENT_TYPES.find((t) => t.value === (so.equipment_type as EquipmentTypeValue));
  const checklist = so.entry_checklist ?? {};

  return (
    <>
      <div className="print:hidden mb-4 flex items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
        <span className="text-blue-800">Esta página é otimizada pra impressão A4.</span>
        <button
          onClick={() => typeof window !== 'undefined' && window.print()}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          🖨️ Imprimir agora
        </button>
      </div>

      <article className="print:bg-white mx-auto max-w-2xl bg-white p-6 shadow print:max-w-none print:shadow-none print:p-8 sm:p-8">
        <header className="border-b border-slate-300 pb-4">
          <div className="flex items-baseline justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Cyber <span className="text-blue-600">Informática</span>
            </h1>
            <p className="font-mono text-lg font-semibold text-slate-700">{so.os_number}</p>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Comprovante de entrada · {new Date(so.created_at).toLocaleString('pt-BR')}
          </p>
        </header>

        <section className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cliente</h2>
            <p className="mt-1 font-semibold text-slate-900">{so.customer_name}</p>
            {so.customer_phone && <p className="text-slate-700">{so.customer_phone}</p>}
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Aparelho</h2>
            <p className="mt-1 font-semibold text-slate-900">
              {typeMeta?.label}
              {so.equipment_brand ? ` · ${so.equipment_brand}` : ''}
              {so.equipment_model ? ` ${so.equipment_model}` : ''}
            </p>
            {so.equipment_color && <p className="text-slate-700">Cor: {so.equipment_color}</p>}
            {so.equipment_serial && <p className="text-slate-700">IMEI/Serial: {so.equipment_serial}</p>}
          </div>
        </section>

        <section className="mt-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Defeito relatado</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">{so.reported_defect}</p>
        </section>

        <section className="mt-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Checklist de entrada</h2>
          <ul className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {ENTRY_CHECKLIST_FIELDS.map((f) => {
              const v = checklist[f.key];
              return (
                <li key={f.key} className="flex items-center gap-2">
                  <span className="font-mono">{v ? '[X]' : '[ ]'}</span>
                  <span>{f.label}</span>
                </li>
              );
            })}
          </ul>
          {so.accessories_in && (
            <p className="mt-2 text-sm">
              <strong>Acessórios:</strong> {so.accessories_in}
            </p>
          )}
        </section>

        <section className="mt-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Previsão</h2>
          <p className="mt-1 text-sm">
            {so.estimated_ready_at
              ? `Pronto em: ${new Date(so.estimated_ready_at).toLocaleDateString('pt-BR')}`
              : 'A definir'}
            {so.assigned_to_name && ` · Técnico: ${so.assigned_to_name}`}
          </p>
        </section>

        <section className="mt-8 grid grid-cols-2 gap-8 text-xs text-slate-500">
          <div className="border-t border-slate-400 pt-1">
            <p>Assinatura do cliente</p>
          </div>
          <div className="border-t border-slate-400 pt-1">
            <p>Responsável Cyber Informática</p>
          </div>
        </section>

        <footer className="mt-6 border-t border-slate-200 pt-3 text-[10px] leading-snug text-slate-500">
          A Cyber Informática não se responsabiliza por objetos não declarados no verso deste documento.
          Equipamentos não retirados em 90 dias podem ser descartados conforme legislação vigente.
          Garantia de serviço: 90 dias para defeitos relacionados ao reparo executado.
        </footer>
      </article>

      <style>{`
        @media print {
          body { background: white; }
          header.sticky, nav, .print-hidden { display: none !important; }
        }
      `}</style>
    </>
  );
}
