import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { PrintButton } from './PrintButton';
import { ENTRY_CHECKLIST_FIELDS, EQUIPMENT_TYPES, type EquipmentTypeValue } from '@/app/admin/types/database';
import { formatDateOnlyBR, formatDateTimeBR } from '@/app/admin/lib/datetime';
import { brand } from '@/lib/brand';

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

  const soWithCustomer = so as typeof so & { customer: { name: string; phone: string | null } | null };
  const customerName = soWithCustomer.customer?.name ?? '(cliente não informado)';
  const customerPhone = soWithCustomer.customer?.phone ?? null;

  const typeMeta = EQUIPMENT_TYPES.find((t) => t.value === (so.equipment_type as EquipmentTypeValue));
  const checklist = (so.entry_checklist ?? {}) as Record<string, boolean>;

  // QR Code de rastreio e autenticidade da entrada
  const trackingQuery = so.short_id || so.os_number || so.id;
  const trackingUrl = `${brand.url}/status?q=${encodeURIComponent(trackingQuery)}`;
  const qrDataUrl = await QRCode.toDataURL(trackingUrl, {
    width: 120,
    margin: 1,
    errorCorrectionLevel: 'M',
  });

  return (
    <>
      {/* Barra de Controle Stealth Carbono (Oculta na Impressão) */}
      <div className="print:hidden mx-auto mb-6 max-w-2xl rounded-xl border border-zinc-800 bg-[#111114]/90 p-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                Termo Formal de Recebimento de Equipamento
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Check-in pericial de entrada com checklist e ciência do cliente.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PrintButton />
            <Link
              href={`/admin/os/${so.id}`}
              className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-mono text-zinc-400 hover:text-white transition"
            >
              ← Voltar p/ OS
            </Link>
          </div>
        </div>
      </div>

      {/* ============ TERMO FORMAL PARA IMPRESSÃO A4 ============ */}
      <article className="print:bg-white print:text-black mx-auto max-w-2xl bg-white p-8 shadow-2xl rounded-lg font-sans text-black print:max-w-none print:shadow-none print:p-8">
        <header className="border-b-2 border-black pb-4">
          <div className="flex items-baseline justify-between">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-black">
                Cyber Informática
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                Termo de Recebimento & Check-in Pericial de Entrada
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-xl font-black text-black">
                {so.short_id ? `#${so.short_id}` : so.os_number}
              </p>
              <p className="text-xs font-mono text-zinc-500">OS: {so.os_number}</p>
            </div>
          </div>
          <p className="mt-1 text-xs text-zinc-600">
            Emitido em: {formatDateTimeBR(so.created_at)}
          </p>
        </header>

        <section className="mt-4 grid grid-cols-2 gap-4 text-sm border-b border-zinc-200 pb-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Dados do Cliente</h2>
            <p className="mt-1 font-bold text-base text-black">{customerName}</p>
            {customerPhone && <p className="text-zinc-700 text-sm">Tel: {customerPhone}</p>}
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Dados do Equipamento</h2>
            <p className="mt-1 font-bold text-base text-black">
              {typeMeta?.label}
              {so.equipment_brand ? ` · ${so.equipment_brand}` : ''}
              {so.equipment_model ? ` ${so.equipment_model}` : ''}
            </p>
            {so.equipment_color && <p className="text-zinc-700 text-xs">Cor: {so.equipment_color}</p>}
            {so.equipment_serial && <p className="text-zinc-700 font-mono text-xs">Serial/IMEI: {so.equipment_serial}</p>}
            {so.equipment_password && <p className="text-zinc-700 font-mono text-xs">Senha teste: {so.equipment_password}</p>}
          </div>
        </section>

        <section className="mt-3 border-b border-zinc-200 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Defeito Relatado pelo Cliente</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm text-black font-medium">{so.reported_defect}</p>
        </section>

        {/* Checklist Pericial Completo com Caixa Marcada */}
        <section className="mt-3 border-b border-zinc-200 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Checklist Pericial de Entrada
          </h2>
          <ul className="mt-2 grid grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
            {ENTRY_CHECKLIST_FIELDS.map((f) => {
              const v = checklist[f.key];
              return (
                <li key={f.key} className="flex items-center gap-2">
                  <span className={`font-mono font-bold px-1 rounded border ${v ? 'bg-black text-white border-black' : 'border-zinc-400 text-zinc-400'}`}>
                    {v ? 'SIM' : 'NÃO'}
                  </span>
                  <span className="text-black">{f.label}</span>
                </li>
              );
            })}
          </ul>

          {so.accessories_in && (
            <p className="mt-2 text-xs bg-zinc-100 p-2 rounded text-zinc-800">
              <strong>Acessórios que entraram com a máquina:</strong> {so.accessories_in}
            </p>
          )}
        </section>

        <section className="mt-3 flex items-center justify-between border-b border-zinc-200 pb-3 text-xs">
          <div>
            <span className="font-bold uppercase text-zinc-500">Previsão Inicial de Diagnóstico: </span>
            <span className="font-bold text-black">
              {so.estimated_ready_at ? formatDateOnlyBR(so.estimated_ready_at) : 'Conforme fila da bancada'}
            </span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 text-right">Rastreie o status<br />em tempo real</span>
            <img src={qrDataUrl} alt="QR Code Rastreio" className="w-10 h-10 object-contain" />
          </div>
        </section>

        {/* Assinaturas */}
        <section className="mt-8 grid grid-cols-2 gap-8 text-xs text-center text-zinc-800">
          <div className="border-t border-black pt-1">
            <p className="font-bold">Assinatura do Cliente</p>
            <p className="text-[10px] text-zinc-500">Concordo com os dados do checklist e termos abaixo</p>
          </div>
          <div className="border-t border-black pt-1">
            <p className="font-bold">Cyber Informática</p>
            <p className="text-[10px] text-zinc-500">Técnico Receptor</p>
          </div>
        </section>

        {/* Termos Legais CDC no Rodapé */}
        <footer className="mt-6 border-t border-zinc-300 pt-3 text-[9px] leading-snug text-zinc-600 space-y-1">
          <p>
            1. <strong>Responsabilidade de Dados:</strong> O cliente declara ter efetuado cópia de segurança (backup) de todos os seus dados e arquivos. A Cyber Informática não se responsabiliza por perdas de dados decorrentes de falhas de hardware ou procedimentos de reparo e formatação autorizados.
          </p>
          <p>
            2. <strong>Acessórios:</strong> A loja se responsabiliza exclusivamente pelos itens e acessórios expressamente descritos neste termo no momento da triagem inicial.
          </p>
          <p>
            3. <strong>Garantia Legal CDC:</strong> Os serviços executados e componentes aplicados possuem garantia de 90 dias (Artigo 26, Inciso II da Lei nº 8.078/1990 - CDC). A garantia cessa em casos de mau uso, quedas, contato com umidade ou intervenção de terceiros.
          </p>
          <p>
            4. <strong>Abandono:</strong> Equipamentos não retirados em até 90 (noventa) dias após a notificação de conclusão serão considerados abandonados, facultando à loja sua destinação para ressarcimento de custos (Art. 1.275, III do Código Civil).
          </p>
        </footer>
      </article>

      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
        @media print {
          html, body { background: white !important; color: black !important; }
          article { background: white !important; color: black !important; }
          article * { color: black !important; }
          header.sticky, nav, .print-hidden { display: none !important; }
        }
      `}</style>
    </>
  );
}
