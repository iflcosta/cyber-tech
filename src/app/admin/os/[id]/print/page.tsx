import { notFound, redirect } from 'next/navigation';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { PrintButton } from './PrintButton';
import { getChecklistFieldsForEquipment, getEquipmentTypeLabel } from '@/app/admin/types/database';
import { formatDateOnlyBR, formatDateTimeBR } from '@/app/admin/lib/datetime';

export const dynamic = 'force-dynamic';

export default async function PrintOSPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getAuthedUser();
  if (!user) redirect('/admin/login');

  const { data: so } = await supabase
    .from('service_orders')
    .select(`
      *,
      customer:customers(name, phone)
    `)
    .eq('id', id)
    .single();
  if (!so) notFound();

  // Normalizar campos que vinham da view. Select com join via string faz
  // o supabase-js inferir array em vez de objeto único — cast pro
  // formato real (mesmo padrão usado em outras páginas de OS).
  const soWithCustomer = so as typeof so & { customer: { name: string; phone: string | null } | null };
  const customerName = soWithCustomer.customer?.name ?? '(cliente removido)';
  const customerPhone = soWithCustomer.customer?.phone ?? null;

  const typeLabel = getEquipmentTypeLabel(so.equipment_type, so.equipment_brand, so.equipment_model);
  const checklistFields = getChecklistFieldsForEquipment(
    so.equipment_type,
    so.equipment_brand,
    so.equipment_model,
  );
  const checklist = so.entry_checklist ?? {};

  return (
    <>
      <div className="print:hidden mb-4 flex items-center justify-between gap-2 border-2 border-zinc-950 bg-zinc-50 p-3 font-mono text-xs font-bold uppercase">
        <span className="text-zinc-950">Esta página é otimizada para impressão A4.</span>
        <PrintButton />
      </div>

      <article className="print:bg-white print:text-zinc-950 mx-auto max-w-2xl border-2 border-zinc-950 bg-white p-6 shadow-xs print:border-none print:max-w-none print:shadow-none print:p-8 sm:p-8 font-mono">
        <header className="border-b-2 border-zinc-950 pb-4">
          <div className="flex items-baseline justify-between">
            <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-950">
              Cyber <span className="text-zinc-950 underline">Informática</span>
            </h1>
            <p className="text-xl font-black text-zinc-950">{so.os_number}</p>
          </div>
          <p className="mt-1 text-xs text-zinc-500 uppercase tracking-wider">
            Comprovante de entrada · {formatDateTimeBR(so.created_at)}
          </p>
        </header>

        <section className="mt-4 grid grid-cols-2 gap-4 text-xs">
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Cliente</h2>
            <p className="mt-1 font-bold text-zinc-950 text-sm">{customerName}</p>
            {customerPhone && <p className="text-zinc-700">{customerPhone}</p>}
          </div>
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Aparelho</h2>
            <p className="mt-1 font-bold text-zinc-950 text-sm">
              {typeLabel}
              {so.equipment_brand ? ` · ${so.equipment_brand}` : ''}
              {so.equipment_model ? ` ${so.equipment_model}` : ''}
            </p>
            {so.equipment_color && <p className="text-zinc-700">Cor: {so.equipment_color}</p>}
            {so.equipment_serial && <p className="text-zinc-700">IMEI/Serial: {so.equipment_serial}</p>}
          </div>
        </section>

        <section className="mt-4">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Defeito relatado</h2>
          <p className="mt-1 whitespace-pre-wrap text-xs text-zinc-950 bg-zinc-50 p-2.5 border border-zinc-200">{so.reported_defect}</p>
        </section>

        <section className="mt-4">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Checklist de entrada ({typeLabel})
          </h2>
          <ul className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {checklistFields.map((f) => {
              const v = checklist[f.key];
              return (
                <li key={f.key} className="flex items-center gap-2 text-zinc-950">
                  <span className="font-bold">{v ? '[X]' : '[ ]'}</span>
                  <span>{f.label}</span>
                </li>
              );
            })}
          </ul>
          {so.accessories_in && (
            <p className="mt-2 text-xs">
              <strong>Acessórios:</strong> {so.accessories_in}
            </p>
          )}
        </section>

        <section className="mt-4">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Previsão</h2>
          <p className="mt-1 text-xs text-zinc-950 font-bold">
            {so.estimated_ready_at
              ? `Pronto em: ${formatDateOnlyBR(so.estimated_ready_at)}`
              : 'A definir'}
          </p>
        </section>

        <section className="mt-8 grid grid-cols-2 gap-8 text-[11px] text-zinc-700 uppercase">
          <div className="border-t-2 border-zinc-950 pt-1.5">
            <p className="font-bold">Assinatura do cliente</p>
          </div>
          <div className="border-t-2 border-zinc-950 pt-1.5">
            <p className="font-bold">Responsável Cyber Informática</p>
          </div>
        </section>

        <footer className="mt-6 border-t border-zinc-300 pt-3 text-[10px] leading-snug text-zinc-500">
          A Cyber Informática não se responsabiliza por objetos não declarados no verso deste documento.
          Equipamentos não retirados em 90 dias podem ser descartados conforme legislação vigente (CDC Art. 26).
          Garantia de serviço: 90 dias para defeitos relacionados ao reparo executado.
        </footer>
      </article>

      <style>{`
        @media print {
          html, body { background: white !important; color: #09090b !important; }
          article { background: white !important; color: #09090b !important; border: none !important; }
          article * { color: #09090b !important; }
          header.sticky, nav, .print-hidden { display: none !important; }
        }
      `}</style>
    </>
  );
}
