import { notFound, redirect } from 'next/navigation';
import { createCRMServerClient } from '@/app/admin/crm/lib/supabase/server';
import { EQUIPMENT_TYPES, type EquipmentTypeValue } from '@/app/admin/crm/types/database';

export const dynamic = 'force-dynamic';

// Impressora alvo: Bematech MPT-II (termica fiscal) via Bluetooth COM9.
// Outras opcoes compativeis: qualquer termica 58mm (Elgin i9, Daruma, GENXP).
//
// IMPORTANTE: driver Generic / Text Only NAO renderiza HTML/CSS.
// Ele so' imprime texto puro (chars ASCII). O navegador ignora
// margins/padding/borders quando imprime em impressora de texto.
//
// Estrategia: gerar a etiqueta como TEXTO PURO com quebras de linha
// explicitas (\n) e colunas alinhadas manualmente com espacos.
// Largura util de 32 chars (bobina 58mm com fonte 12cpi).
//
// Formato:
//   <linha em branco>           <- margem de rasgo
//   <linha em branco>
//   <linha em branco>
//   <linha em branco>
//   CYBER INFORMATICA   DD/MM/YYYY
//   ====================================
//   OS-0001  (OS-2026-0001)
//   CLIENTE
//   Joao Silva
//   Tel: (11) 99999-9999
//   APARELHO
//   Notebook - Dell Inspiron Cinza
//   ------------------------------------
//   Formatação / defeito relatado
//   <espaço extra pra puxar>
//
// Total: ~20 linhas de 32 chars = ~62mm de altura.

const WIDTH = 32; // chars por linha (58mm @ 12cpi)

// Centraliza texto dentro de WIDTH chars
function center(text: string): string {
  const t = text.slice(0, WIDTH);
  const pad = Math.max(0, Math.floor((WIDTH - t.length) / 2));
  return ' '.repeat(pad) + t;
}

// Esquerda e direita (data/hora na direita)
function ljust(text: string, width: number = WIDTH): string {
  const t = text.slice(0, width);
  return t + ' '.repeat(Math.max(0, width - t.length));
}

function rjust(text: string, width: number = WIDTH): string {
  const t = text.slice(0, width);
  return ' '.repeat(Math.max(0, width - t.length)) + t;
}

function padBoth(left: string, right: string): string {
  const space = WIDTH - left.length - right.length;
  if (space < 1) return ljust(left + ' ' + right);
  return left + ' '.repeat(space) + right;
}

// Normaliza pra ASCII (sem acento, sem emoji)
const norm = (s: string) => (s ?? '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^\x20-\x7E]/g, '?')
  .trim();

export default async function OSLabelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createCRMServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/crm/login');

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

  const customerName = norm((so as any).customer?.name ?? '(cliente removido)');
  const customerPhone = norm((so as any).customer?.phone ?? '');
  const equipRaw = [so.equipment_brand, so.equipment_model, so.equipment_color]
    .filter(Boolean).join(' ');
  const equipNorm = norm(equipRaw);
  const typeMeta = EQUIPMENT_TYPES.find((t) => t.value === (so.equipment_type as EquipmentTypeValue));
  const typeLabel = norm(typeMeta?.label ?? '');
  const shortId = norm((so as any).short_id ?? '');
  const osNumber = norm((so as any).os_number ?? '');
  const created = new Date(so.created_at).toLocaleDateString('pt-BR');
  const defectNorm = norm(so.reported_defect ?? '');

  // Monta o texto da etiqueta como TEXTO PURO com \n
  const lineSep = '='.repeat(WIDTH);
  const dashSep = '-'.repeat(WIDTH);

  const lines: string[] = [];

  // MARGEM DE RASGO: 4 linhas em branco (~13mm)
  lines.push('', '', '', '');

  // Header
  lines.push(padBoth('CYBER INFORMATICA', created));
  lines.push(lineSep);

  // OS em destaque (sem duplicacao - so o short_id "OS-0626004")
  lines.push(shortId);
  lines.push('');

  // Cliente
  lines.push('CLIENTE:');
  lines.push(customerName);
  if (customerPhone) lines.push('Tel: ' + customerPhone);
  lines.push('');

  // Aparelho
  if (typeLabel || equipNorm) {
    lines.push('APARELHO:');
    const equipLine = typeLabel + (equipNorm ? ' - ' + equipNorm : '');
    // Quebra em linhas se muito longo
    if (equipLine.length <= WIDTH) {
      lines.push(equipLine);
    } else {
      // Quebra por palavras
      const words = equipLine.split(' ');
      let cur = '';
      for (const w of words) {
        if ((cur + ' ' + w).trim().length > WIDTH) {
          lines.push(cur.trim());
          cur = w;
        } else {
          cur = (cur + ' ' + w).trim();
        }
      }
      if (cur) lines.push(cur.trim());
    }
    lines.push('');
  }

  // Defeito
  if (defectNorm) {
    lines.push('DEFEITO:');
    // Quebra em linhas de ate WIDTH chars
    const words = defectNorm.split(' ');
    let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length > WIDTH) {
        lines.push(cur.trim());
        cur = w;
      } else {
        cur = (cur + ' ' + w).trim();
      }
    }
    if (cur) lines.push(cur.trim());
    lines.push('');
  }

  // Linha final + espaco extra pra puxar
  lines.push(dashSep);
  lines.push('');

  const plainText = lines.join('\n') + '\n\n\n\n\n\n\n'; // 7 linhas em branco no fim = espaço pra puxar e rasgar

  return (
    <>
      <div className="print:hidden mx-auto mb-4 max-w-2xl rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>Etiqueta texto puro 58mm</strong> — otimizada pra impressora termica via
          driver Generic / Text Only (MPT-II Bluetooth, Elgin i9, etc).
        </p>
        <p className="mt-1 text-xs text-blue-700">
          Conteudo em ASCII com quebras de linha explicitas. Margem de rasgo no topo.
          Cola no notebook com fita adesiva.
        </p>
      </div>

      {/* ============ ETIQUETA ============ */}
      {/* Preview visual: pre-formatted text */}
      <pre
        className="label mx-auto whitespace-pre-wrap rounded border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900 shadow print:border-0 print:bg-white print:p-0 print:shadow-none"
        style={{
          width: '58mm',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
          fontSize: '10pt',
          lineHeight: '1.3',
        }}
      >
{plainText}
      </pre>

      <style>{`
        @page {
          size: 58mm auto;
          margin: 0;
        }
        @media print {
          html, body {
            margin: 0;
            padding: 0;
            background: white;
          }
          body * { visibility: hidden; }
          .label, .label * { visibility: visible; }
          .label {
            position: absolute;
            top: 0;
            left: 0;
            margin: 0;
            padding: 2mm 3mm;
            background: white;
            border: 0 !important;
            box-shadow: none !important;
            width: 58mm;
            font-size: 10pt;
            line-height: 1.3;
          }
        }
      `}</style>
    </>
  );
}