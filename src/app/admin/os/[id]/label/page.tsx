import { notFound, redirect } from 'next/navigation';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { getEquipmentTypeLabel } from '@/app/admin/types/database';
import { formatDateBR } from '@/app/admin/lib/datetime';
import { OSLabelClient } from './OSLabelClient';

export const dynamic = 'force-dynamic';

const WIDTH = 32; // Chars por linha (bobina 58mm MPT-II legado)

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

  const customerName = norm(customerNameRaw);
  const customerPhone = norm(customerPhoneRaw);
  const equipNorm = norm(equipRaw);
  const typeLabel = norm(typeLabelRaw);
  const shortId = norm(so.short_id ?? `OS-${so.os_number}`);
  const osNumberStr = String(so.os_number ?? shortId);
  const created = formatDateBR(so.created_at);
  const defectNorm = norm(so.reported_defect ?? '');

  // Texto puro 32 colunas para MPT-II legado
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
    <OSLabelClient
      osId={so.id}
      shortId={shortId}
      osNumberStr={osNumberStr}
      createdDate={created}
      customerName={customerNameRaw}
      customerPhone={customerPhoneRaw}
      equipmentTitle={equipmentTitle}
      equipmentSerial={so.equipment_serial ?? ''}
      equipmentPassword={so.equipment_password ?? ''}
      accessoriesInfo={accessoriesInfo}
      reportedDefect={so.reported_defect ?? ''}
      plainText58mm={plainText}
    />
  );
}
