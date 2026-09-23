import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { ReciboPrintButton } from '@/app/admin/vendas/[id]/recibo/ReciboPrintButton';
import { AutoPrint } from '@/app/admin/vendas/[id]/recibo/AutoPrint';
import { PixQRButton } from '@/app/admin/components/PixQRButton';
import { EscPosReciboButton } from './EscPosReciboButton';
import { WARRANTY_DAYS } from '@/app/admin/types/database';
import { formatDateBR } from '@/app/admin/lib/datetime';

export const dynamic = 'force-dynamic';

function norm(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function pad(s: string, width: number, align: 'left' | 'right' = 'left'): string {
  if (s.length >= width) return s.substring(0, width);
  const spaces = ' '.repeat(width - s.length);
  return align === 'left' ? s + spaces : spaces + s;
}

function fmtBRL(n: number): string {
  return 'R$ ' + n.toFixed(2).replace('.', ',');
}

export default async function ReciboMPTPag({ params }: { params: Promise<{ id: string }> }) {
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

  type PartRow = {
    id: string;
    quantity: number;
    unit_price: number;
    total_amount: number | null;
    stock_item: { name: string } | null;
  };
  const { data: partsRaw } = await supabase
    .from('stock_movements')
    .select(`
      id, quantity, unit_price, total_amount,
      stock_item:stock_items(name)
    `)
    .eq('reference', so.os_number)
    .in('movement_type', ['out', 'sale'])
    .order('created_at', { ascending: true });
  // Select com join via string: supabase-js não infere a cardinalidade
  // 1:1 sozinho — cast pro formato real (mesmo padrão usado alhures).
  const parts = partsRaw as unknown as PartRow[] | null;

  const soWithCustomer = so as typeof so & { customer: { name: string; phone: string | null } | null };
  const customerName = soWithCustomer.customer?.name ?? '(cliente removido)';
  const laborCost = Number(so.labor_cost ?? 0);
  const partsTotal = (parts ?? []).reduce((acc, p) => acc + Number(p.total_amount ?? 0), 0);
  const grandTotal = laborCost + partsTotal;
  const warrantyStart = so.delivered_at ?? so.created_at;
  const warrantyEnd = new Date(new Date(warrantyStart).getTime() + WARRANTY_DAYS * 86400000);

  // Construir o texto do recibo MPT-II
  const cols = 30;
  const eq = '='.repeat(cols);
  const dash = '-'.repeat(cols);
  const lines: string[] = [];
  lines.push(eq);
  lines.push(pad('CYBER INFORMATICA', cols));
  lines.push(pad('RECIBO DE ENTREGA', cols));
  lines.push(eq);
  lines.push(pad(so.os_number ?? '', cols));
  lines.push(pad(formatDateBR(warrantyStart), cols));
  lines.push(dash);
  lines.push(pad('CLIENTE:', cols));
  lines.push(pad(norm(customerName).substring(0, 28), cols));
  if (so.equipment_brand || so.equipment_model) {
    const ap = norm(`${so.equipment_type} ${so.equipment_brand ?? ''} ${so.equipment_model ?? ''}`).trim();
    lines.push(pad('APARELHO:', cols));
    lines.push(pad(ap.substring(0, 28), cols));
  }
  lines.push(dash);
  lines.push(pad('SERVICO:', cols));
  if (so.repair_notes) {
    const notes = norm(so.repair_notes);
    // Quebrar em chunks de cols
    for (let i = 0; i < notes.length && i < 120; i += cols) {
      lines.push(pad(notes.substring(i, i + cols), cols));
    }
  } else {
    lines.push(pad(norm(so.reported_defect).substring(0, cols), cols));
  }
  lines.push(dash);
  // Pecas
  if (parts && parts.length > 0) {
    lines.push(pad('PECAS:', cols));
    for (const p of parts) {
      const nome = norm(p.stock_item?.name ?? 'item').substring(0, 16).padEnd(16);
      const qtd = `${p.quantity}x`.padStart(4);
      const sub = Number(p.total_amount).toFixed(2).replace('.', ',').padStart(10);
      lines.push(nome + qtd + sub);
    }
    lines.push(dash);
  }
  // Totais
  lines.push(pad('PECAS:', 20) + pad(fmtBRL(partsTotal), 10, 'right'));
  lines.push(pad('MAO DE OBRA:', 20) + pad(fmtBRL(laborCost), 10, 'right'));
  lines.push(eq);
  lines.push(pad('TOTAL:', 20) + pad(fmtBRL(grandTotal), 10, 'right'));
  lines.push(eq);
  // Garantia
  const warrantyEndStr = formatDateBR(warrantyEnd);
  lines.push(pad('GARANTIA: 90 DIAS', cols));
  lines.push(pad('ATE ' + warrantyEndStr, cols));
  lines.push(pad('Defeitos do reparo executado.', cols));
  lines.push(pad('Nao cobre mau uso, queda ou', cols));
  lines.push(pad('abertura por terceiros.', cols));
  lines.push(dash);
  // Quem retirou (se entregue)
  if (so.delivered_to_name) {
    lines.push(pad('RETIRADO POR:', cols));
    lines.push(pad(norm(so.delivered_to_name).substring(0, 28), cols));
    lines.push(dash);
  }
  lines.push(pad('Assinatura do cliente:', cols));
  lines.push(pad('', cols));
  lines.push(pad('', cols));
  lines.push(pad('__________________________', cols));
  lines.push(dash);
  lines.push(pad('OBRIGADO!', cols));
  // Avanco de papel (10 pontos + 4 newlines pra desgrudar)
  lines.push('.'.repeat(10));
  lines.push('');
  lines.push('');
  lines.push('');
  lines.push('');

  const reciboText = lines.join('\n');

  // Dados pro botão ESC/POS (agente de impressão local) — mesmas
  // informações do texto acima, em campos separados pro construtor
  // de comandos montar com negrito/alinhamento reais.
  const escposEquipmentLine =
    so.equipment_brand || so.equipment_model
      ? `${so.equipment_type} ${so.equipment_brand ?? ''} ${so.equipment_model ?? ''}`.trim()
      : undefined;
  const escposServiceText = so.repair_notes || so.reported_defect || '';
  const escposParts = (parts ?? []).map((p) => ({
    name: p.stock_item?.name ?? 'item',
    qty: p.quantity,
    subtotal: Number(p.total_amount).toFixed(2).replace('.', ','),
  }));

  return (
    <>
      <div className="print:hidden mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-300 bg-zinc-50 p-3 text-sm">
        <span className="text-zinc-900">
          Versão MPT-II 58mm. <strong>Imprima na MPT-II</strong> (Generic / Text Only).
        </span>
        <div className="flex gap-2">
          <Link
            href={`/admin/os/${so.id}/recibo`}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Versão A4 (PDF)
          </Link>
          <Link
            href={`/admin/os/${so.id}`}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Voltar pra OS
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-sm">
        <div className="print:hidden flex flex-col gap-2">
          <ReciboPrintButton />
          <EscPosReciboButton
            osNumber={so.os_number ?? ''}
            dateStr={formatDateBR(warrantyStart)}
            customerName={customerName}
            equipmentLine={escposEquipmentLine}
            serviceText={escposServiceText}
            parts={escposParts}
            partsTotal={fmtBRL(partsTotal)}
            laborCost={fmtBRL(laborCost)}
            grandTotal={fmtBRL(grandTotal)}
            warrantyEndStr={warrantyEndStr}
            deliveredToName={so.delivered_to_name}
          />
          <p className="text-xs text-zinc-600">
            O botão verde manda comandos reais (negrito, corte) via agente de impressão local —
            precisa estar rodando no PC da bancada (ver <code>print-agent/README.md</code>).
          </p>
        </div>
        <AutoPrint />
        <pre className="mt-2 whitespace-pre-wrap rounded-md border border-slate-300 bg-white p-3 font-mono text-xs leading-tight text-black print:border-none print:p-0">
{reciboText}
        </pre>
        {grandTotal > 0 && (
          <div className="print:hidden mt-4 rounded-md border border-teal-200 bg-teal-50/50 p-3">
            <p className="text-xs font-semibold text-slate-700">
              💰 PIX pra cobrar R$ {grandTotal.toFixed(2)}
            </p>
            <div className="mt-2">
              <PixQRButton
                defaultAmount={grandTotal}
                txid={so.os_number ?? undefined}
                description={`OS ${so.os_number ?? ''}`.substring(0, 50)}
                buttonLabel="Gerar QR do PIX"
                buttonClassName="w-full justify-center rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700"
              />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          header.sticky, nav, .print-hidden { display: none !important; }
          @page { size: 58mm auto; margin: 0; }
        }
      `}</style>
    </>
  );
}