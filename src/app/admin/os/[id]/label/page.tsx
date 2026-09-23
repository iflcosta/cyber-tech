import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { LabelPrintButton } from './LabelPrintButton';
import { EscPosLabelButton } from './EscPosLabelButton';
import { EQUIPMENT_TYPES, type EquipmentTypeValue } from '@/app/admin/types/database';
import { formatDateBR } from '@/app/admin/lib/datetime';
import { brand } from '@/lib/brand';

export const dynamic = 'force-dynamic';

const WIDTH = 32; // Chars por linha (bobina 58mm)

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
  const created = formatDateBR(so.created_at);
  const defectNorm = norm(so.reported_defect ?? '');

  // Gera o QR Code com a URL do portal público de rastreio pericial
  const trackingQuery = so.short_id || so.os_number || so.id;
  const trackingUrl = `${brand.url}/status?q=${encodeURIComponent(trackingQuery)}`;
  const qrDataUrl = await QRCode.toDataURL(trackingUrl, {
    width: 130,
    margin: 1,
    errorCorrectionLevel: 'M',
  });

  // Linhas para o modo texto ESC/POS
  const lineSep = '='.repeat(WIDTH);
  const dashSep = '-'.repeat(WIDTH);
  const lines: string[] = [];
  lines.push('.', '.');
  lines.push(padBoth('CYBER INFORMATICA', created));
  lines.push(lineSep);
  lines.push(shortId);
  lines.push('[CLIENTE]');
  lines.push(customerName);
  if (customerPhone) lines.push('Tel: ' + customerPhone);
  lines.push('', '');
  if (typeLabel || equipNorm) {
    lines.push('[APARELHO]');
    lines.push(`${typeLabel} ${equipNorm}`.trim().slice(0, WIDTH));
    lines.push('', '');
  }
  if (defectNorm) {
    lines.push('[DEFEITO]');
    lines.push(defectNorm.slice(0, WIDTH * 2));
  }
  lines.push(dashSep);
  const plainText = lines.join('\n') + '\n.\n.\n.';

  return (
    <>
      {/* Controles de Impressão na Barra Superior (Ocultos na Impressão) */}
      <div className="print:hidden mx-auto mb-6 max-w-xl rounded-xl border border-zinc-800 bg-[#111114]/90 p-5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              Etiqueta Térmica 58mm Chassi
            </span>
          </div>
          <Link
            href={`/admin/os/${so.id}`}
            className="text-xs font-mono text-zinc-400 hover:text-white transition"
          >
            ← Voltar para OS
          </Link>
        </div>

        <p className="mt-2 text-sm text-zinc-300">
          Etiqueta de chassi com <strong>QR Code pericial</strong> para rastreamento instantâneo da bancada e balcão.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <LabelPrintButton />
          <EscPosLabelButton
            createdStr={created}
            shortId={shortId}
            customerName={customerName}
            customerPhone={customerPhone || undefined}
            equipmentLine={typeLabel || equipNorm ? `${typeLabel}${equipNorm ? ' - ' + equipNorm : ''}` : undefined}
            defect={defectNorm || undefined}
          />
        </div>
      </div>

      {/* ============ ETIQUETA TÉRMICA 58MM COM QR CODE ============ */}
      <div className="flex justify-center print:block print:m-0">
        <div
          className="label-thermal bg-white text-black font-mono shadow-2xl print:shadow-none"
          style={{
            width: '58mm',
            minHeight: '65mm',
            padding: '2mm 3mm',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
        >
          {/* Margem de corte/rasgo */}
          <div className="text-center text-[9px] tracking-widest text-zinc-500 font-bold border-b border-dashed border-zinc-400 pb-1 mb-1">
            CYBER INFORMÁTICA · {created}
          </div>

          {/* Destaque da OS */}
          <div className="text-center my-1">
            <div className="text-base font-black tracking-tight">{shortId}</div>
            <div className="text-[10px] text-zinc-600 font-bold">OS: {so.os_number}</div>
          </div>

          {/* QR Code de Rastreio */}
          <div className="flex flex-col items-center justify-center my-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="QR Code da OS"
              className="w-24 h-24 object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
            <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-700 mt-0.5">
              Escaneie p/ Rastrear
            </span>
          </div>

          {/* Dados do Aparelho */}
          <div className="border-t border-b border-black py-1 my-1 text-[11px] leading-tight">
            <div className="font-bold uppercase text-[9px] text-zinc-700">Aparelho:</div>
            <div className="font-bold truncate">
              {typeLabel} {equipNorm}
            </div>
            {so.equipment_serial && (
              <div className="text-[10px] text-zinc-800">S/N: {so.equipment_serial}</div>
            )}
          </div>

          {/* Dados do Cliente */}
          <div className="text-[11px] leading-tight my-1">
            <div className="font-bold uppercase text-[9px] text-zinc-700">Cliente:</div>
            <div className="font-bold truncate">{customerName}</div>
            {customerPhone && <div className="text-[10px] text-zinc-800">Tel: {customerPhone}</div>}
          </div>

          {/* Defeito Relatado */}
          {defectNorm && (
            <div className="border-t border-dashed border-zinc-400 pt-1 mt-1 text-[10px] leading-tight">
              <span className="font-bold uppercase text-[9px] text-zinc-700">Defeito: </span>
              <span className="break-words">{defectNorm}</span>
            </div>
          )}

          {/* Rodapé / Picote */}
          <div className="mt-2 pt-1 border-t border-black text-center text-[8px] text-zinc-600 font-bold uppercase tracking-widest">
            Bancada & Balcão Cyber
          </div>
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
            padding: 2mm 3mm !important;
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
