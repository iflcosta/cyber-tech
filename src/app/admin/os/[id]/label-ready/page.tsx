import { notFound, redirect } from 'next/navigation';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { getEquipmentTypeLabel } from '@/app/admin/types/database';
import { formatDateTimeBR } from '@/app/admin/lib/datetime';
import { OSReadyLabelClient } from './OSReadyLabelClient';

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

const norm = (s: string) =>
  (s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '?')
    .trim();

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default async function OSReadyLabelPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Peças usadas nesta OS
  type PartRow = {
    id: string;
    quantity: number;
    unit_price: number;
    total_amount: number | null;
    stock_item: {
      name: string;
    } | null;
  };

  let partsQuery = supabase
    .from('stock_movements')
    .select(`
      id, quantity, unit_price, total_amount,
      stock_item:stock_items(name)
    `)
    .in('movement_type', ['out', 'sale']);

  if (so.os_number) {
    partsQuery = partsQuery.or(`service_order_id.eq.${id},reference.eq.${so.os_number}`);
  } else {
    partsQuery = partsQuery.eq('service_order_id', id);
  }

  const { data: partsRaw } = await partsQuery;
  const parts = (partsRaw ?? []) as unknown as PartRow[];

  // Pagamentos registrados
  const { data: paymentsRaw } = await supabase
    .from('service_order_payments')
    .select('id, amount, payment_method, paid_at')
    .eq('service_order_id', id);

  const payments = (paymentsRaw ?? []) as Array<{ amount: number }>;

  const soWithCustomer = so as typeof so & {
    customer: { name: string; phone: string | null } | null;
  };
  const customerNameRaw = soWithCustomer.customer?.name ?? '(cliente removido)';
  const customerPhoneRaw = soWithCustomer.customer?.phone ?? '';

  const typeLabelRaw = getEquipmentTypeLabel(
    so.equipment_type,
    so.equipment_brand,
    so.equipment_model,
  );
  const equipRaw = [so.equipment_brand, so.equipment_model, so.equipment_color]
    .filter(Boolean)
    .join(' ');
  const equipmentTitle = `${typeLabelRaw} ${equipRaw}`.trim();

  const checklist = (so.entry_checklist ?? {}) as Record<string, boolean | string>;
  const hasCharger = checklist.carregador === true;
  const accessoriesParts = [
    so.accessories_in ? so.accessories_in.trim() : '',
    hasCharger && !so.accessories_in ? 'C/ Fonte/Carreg.' : '',
  ].filter(Boolean);
  const accessoriesInfo = accessoriesParts.join(' · ');

  // Totais financeiros
  const partsTotal = parts.reduce((acc, p) => acc + Number(p.total_amount ?? 0), 0);
  const partsList = parts.map((p) => p.stock_item?.name).filter(Boolean) as string[];

  const laborCost = Number(so.labor_cost ?? 0);
  const estimatedVal = Number(so.estimated_value ?? 0);
  const effectiveLaborCost = laborCost > 0 ? laborCost : Math.max(0, estimatedVal - partsTotal);
  const grandTotal = effectiveLaborCost + partsTotal > 0 ? effectiveLaborCost + partsTotal : estimatedVal;

  const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount ?? 0), 0);
  const remainingToPay = Math.max(0, grandTotal - totalPaid);
  const isPaid = so.payment_status === 'paid' || (remainingToPay === 0 && grandTotal > 0);

  const readyDate = formatDateTimeBR(so.updated_at);
  const shortId = norm(so.short_id ?? `OS-${so.os_number}`);
  const osNumberStr = String(so.os_number ?? shortId);
  const repairNotes = so.repair_notes?.trim() || so.reported_defect || 'Serviço concluído na bancada';

  // Texto 58mm puro (MPT-II)
  const lineSep = '='.repeat(WIDTH);
  const dashSep = '-'.repeat(WIDTH);
  const lines: string[] = [];
  lines.push(padBoth('CYBER INFORMATICA', 'PRONTO'));
  lines.push(lineSep);
  lines.push(`OS: ${shortId} (#${osNumberStr})`);
  lines.push(`DATA: ${readyDate}`);
  lines.push(lineSep);
  lines.push('[CLIENTE]');
  lines.push(norm(customerNameRaw).slice(0, WIDTH));
  if (customerPhoneRaw) lines.push('Tel: ' + norm(customerPhoneRaw));
  lines.push(dashSep);
  lines.push('[EQUIPAMENTO]');
  lines.push(norm(equipmentTitle).slice(0, WIDTH));
  lines.push(dashSep);
  lines.push('[SERVICO REALIZADO]');
  lines.push(norm(repairNotes).slice(0, WIDTH * 2));
  lines.push(dashSep);
  lines.push(`TOTAL DA OS: ${fmtBRL(grandTotal)}`);
  lines.push(isPaid ? 'STATUS: [ ✓ TOTAL PAGO ]' : `A PAGAR: ${fmtBRL(remainingToPay > 0 ? remainingToPay : grandTotal)}`);
  lines.push(dashSep);
  if (accessoriesInfo) {
    lines.push(`DEVOLVER: ${norm(accessoriesInfo)}`);
    lines.push(dashSep);
  }
  lines.push('Garantia legal: 90 dias');
  lines.push('RASTREIO: cyberinformatica.tech');
  lines.push(lineSep);
  const plainText58mm = lines.join('\n') + '\n.\n.\n.';

  return (
    <OSReadyLabelClient
      osId={so.id}
      shortId={shortId}
      osNumberStr={osNumberStr}
      readyDateStr={readyDate}
      customerName={customerNameRaw}
      customerPhone={customerPhoneRaw}
      equipmentTitle={equipmentTitle}
      equipmentSerial={so.equipment_serial ?? ''}
      repairNotes={repairNotes}
      laborCost={effectiveLaborCost}
      partsTotal={partsTotal}
      grandTotal={grandTotal}
      partsList={partsList}
      totalPaid={totalPaid}
      remainingToPay={remainingToPay}
      isPaid={isPaid}
      accessoriesInfo={accessoriesInfo}
      plainText58mm={plainText58mm}
    />
  );
}
