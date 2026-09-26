import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { LabelPrintButton } from './LabelPrintButton';
import { EscPosLabelButton } from './EscPosLabelButton';
import { EQUIPMENT_TYPES, type EquipmentTypeValue } from '@/app/admin/types/database';
import { formatDateBR } from '@/app/admin/lib/datetime';

export const dynamic = 'force-dynamic';

const WIDTH = 32; // Chars por linha (bobina 58mm MPT-II)

function ljust(text: string, width: number = WIDTH): string {
  const t = text.slice(0, width);
  return t + ' '.repeat(Math.max(0, width - t.length));
}

function padBoth(left: string, right: string): string {
  const space = WIDTH - left.length - right.length;
  if (space < 1) return ljust(left + ' ' + right);
  return left + ' '.repeat(space) + right;
}

const norm = (s: string) => (s ?? '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^\x20-\x7E]/g, '?')
  .trim();

export default async function OSLabelPage({ params }: { params: Promise<{ id: string }> }) {
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
  const customerName = norm(soWithCustomer.customer?.name ?? '(cliente removido)');
  const customerPhone = norm(soWithCustomer.customer?.phone ?? '');
  const equipRaw = [so.equipment_brand, so.equipment_model, so.equipment_color]
    .filter(Boolean).join(' ');
  const equipNorm = norm(equipRaw);
  const typeMeta = EQUIPMENT_TYPES.find((t) => t.value === (so.equipment_type as EquipmentTypeValue));
  const typeLabel = norm(typeMeta?.label ?? '');
  const shortId = norm(so.short_id ?? `OS-${so.os_number}`);
  const osNumberStr = String(so.os_number ?? shortId);
  const created = formatDateBR(so.created_at);
  const defectNorm = norm(so.reported_defect ?? '');

  // Texto puro 32 colunas para MPT-II (Generic / Text Only ou ESC/POS)
  const lineSep = '='.repeat(WIDTH);
  const dashSep = '-'.repeat(WIDTH);
  const lines: string[] = [];
  lines.push(padBoth('CYBER INFORMATICA', created));
  lines.push(lineSep);
  lines.push(`OS: ${shortId} (#${osNumberStr})`);
  lines.push(lineSep);
  lines.push('[CLIENTE]');
  lines.push(customerName.slice(0, WIDTH));
  if (customerPhone) lines.push('Tel: ' + customerPhone);
  lines.push(dashSep);
  if (typeLabel || equipNorm) {
    lines.push('[EQUIPAMENTO]');
    lines.push(`${typeLabel} ${equipNorm}`.trim().slice(0, WIDTH));
    if (so.equipment_serial) lines.push(`S/N: ${norm(so.equipment_serial)}`.slice(0, WIDTH));
    lines.push(dashSep);
  }
  if (defectNorm) {
    lines.push('[SERVICO / DEFEITO]');
    lines.push(defectNorm.slice(0, WIDTH * 3));
    lines.push(dashSep);
  }
  lines.push('RASTREIO: cyberinformatica.tech');
  lines.push(`DIGITE O CODIGO: ${osNumberStr}`);
  lines.push(lineSep);
  const plainText = lines.join('\n') + '\n.\n.\n.';

  return (
    <>
      {/* Controles de Impressão na Barra Superior (Ocultos na Impressão) */}
      <div className="print:hidden mx-auto mb-6 max-w-xl border-2 border-zinc-950 bg-white p-5">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="bg-zinc-950 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
              MPT-II 58mm
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-950">
              Etiqueta de Chassi (Texto Puro / Sem QR)
            </span>
          </div>
          <Link
            href={`/admin/os/${so.id}`}
            className="font-mono text-xs font-bold text-zinc-950 underline underline-offset-4"
          >
            ← Voltar para OS
          </Link>
        </div>

        <p className="mt-3 font-mono text-xs text-zinc-600">
          Layout otimizado em <strong>32 colunas (58mm)</strong> para a sua <strong>MPT-II</strong>: sem depender de QR Code gráfico, com o número da OS em destaque para colar no gabinete/notebook.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <LabelPrintButton />
          <EscPosLabelButton
            createdStr={created}
            shortId={shortId}
            osNumber={osNumberStr}
            customerName={customerName}
            customerPhone={customerPhone || undefined}
            equipmentLine={typeLabel || equipNorm ? `${typeLabel}${equipNorm ? ' - ' + equipNorm : ''}` : undefined}
            defect={defectNorm || undefined}
          />
        </div>
      </div>

      {/* ============ ETIQUETA TÉRMICA 58MM (MPT-II TEXTO PURO) ============ */}
      <div className="flex justify-center print:block print:m-0">
        <div
          className="label-thermal border-2 border-zinc-950 bg-white text-black font-mono print:border-0"
          style={{
            width: '58mm',
            padding: '2mm 3mm',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
        >
          <div className="text-center text-[10px] tracking-widest font-bold border-b border-black pb-1 mb-1">
            CYBER INFORMATICA · {created}
          </div>

          {/* Destaque Gigante da OS em Texto (Legível a distância na bancada) */}
          <div className="text-center py-1.5 border-b-2 border-black my-1">
            <div className="text-xl font-black tracking-tight leading-none">{shortId}</div>
            <div className="text-xs font-bold mt-0.5">CODIGO OS: #{osNumberStr}</div>
          </div>

          {/* Dados do Cliente */}
          <div className="border-b border-dashed border-black py-1 my-1 text-[11px] leading-tight">
            <div className="font-bold uppercase text-[9px]">[CLIENTE]</div>
            <div className="font-bold truncate">{customerName}</div>
            {customerPhone && <div className="text-[10px]">Tel: {customerPhone}</div>}
          </div>

          {/* Dados do Aparelho */}
          <div className="border-b border-dashed border-black py-1 my-1 text-[11px] leading-tight">
            <div className="font-bold uppercase text-[9px]">[EQUIPAMENTO]</div>
            <div className="font-bold break-words">
              {typeLabel} {equipNorm}
            </div>
            {so.equipment_serial && (
              <div className="text-[10px]">S/N: {so.equipment_serial}</div>
            )}
          </div>

          {/* Defeito Relatado */}
          {defectNorm && (
            <div className="border-b border-dashed border-black py-1 my-1 text-[10px] leading-tight">
              <div className="font-bold uppercase text-[9px]">[SERVICO / DEFEITO]</div>
              <div className="break-words">{defectNorm}</div>
            </div>
          )}

          {/* Rastreio em Texto Puro (Sem QR Code) */}
          <div className="pt-1 text-center text-[9px] leading-tight font-bold uppercase">
            <div>RASTREIO: cyberinformatica.tech</div>
            <div className="text-[10px] font-black mt-0.5">DIGITE A OS: {osNumberStr}</div>
          </div>

          <pre className="sr-only">{plainText}</pre>
        </div>
      </div>

      <style>{`
        @page {
          size: 58mm auto;
          margin: 0;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
          }
          body * {
            visibility: hidden;
          }
          .label-thermal, .label-thermal * {
            visibility: visible;
          }
          .label-thermal {
            position: absolute;
            top: 0;
            left: 0;
            margin: 0 !important;
            padding: 2mm 2mm !important;
            background: white !important;
            color: black !important;
            width: 58mm !important;
            box-shadow: none !important;
            border: 0 !important;
          }
        }
      `}</style>
    </>
  );
}
