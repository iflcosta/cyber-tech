import { notFound, redirect } from 'next/navigation';
import QRCode from 'qrcode';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { EQUIPMENT_TYPES, type EquipmentTypeValue } from '@/app/admin/types/database';
import { formatDateBR } from '@/app/admin/lib/datetime';
import { OSLabelPrintView, type OSLabelData } from './OSLabelPrintView';

export const dynamic = 'force-dynamic';

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
      customer:customers(name, phone),
      technician:profiles!service_orders_technician_id_fkey(id, full_name)
    `)
    .eq('id', id)
    .single();
  if (!so) notFound();

  const soWithCustomer = so as typeof so & {
    customer: { name: string; phone: string | null } | null;
    technician: { id: string; full_name: string } | null;
  };

  const customerName = norm(soWithCustomer.customer?.name ?? '(cliente removido)');
  const customerPhone = norm(soWithCustomer.customer?.phone ?? '');
  const equipRaw = [so.equipment_brand, so.equipment_model, so.equipment_color]
    .filter(Boolean)
    .join(' ');
  const equipNorm = norm(equipRaw);
  const typeMeta = EQUIPMENT_TYPES.find(
    (t) => t.value === (so.equipment_type as EquipmentTypeValue),
  );
  const typeLabel = norm(typeMeta?.label ?? '');
  const shortId = norm(so.short_id ?? `OS-${so.os_number}`);
  const osNumberStr = String(so.os_number ?? shortId);
  const created = formatDateBR(so.created_at);
  const defectNorm = norm(so.reported_defect ?? '');

  const isMezanino =
    so.equipment_type === 'celular' ||
    so.equipment_type === 'tablet' ||
    /gpu|placa de v[ií]deo|placa de video|reballing|rtx|gtx|radeon/i.test(so.reported_defect ?? '');
  const techName = soWithCustomer.technician?.full_name
    ? norm(soWithCustomer.technician.full_name)
    : null;
  const destination = isMezanino
    ? techName?.toUpperCase().includes('JEFFERSON')
      ? 'MEZANINO (JEFFERSON)'
      : 'MEZANINO (2º ANDAR)'
    : techName
      ? `TÉRREO (${techName.toUpperCase()})`
      : 'TÉRREO (BANCADA LIVRE)';

  const trackingUrl = `https://www.cyberinformatica.tech/status?q=${encodeURIComponent(shortId)}`;

  // Gera QR Code de leitura rápida
  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(trackingUrl, {
      width: 160,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.warn('Erro ao gerar QR Code para etiqueta de OS:', err);
  }

  const labelData: OSLabelData = {
    id: so.id,
    shortId,
    osNumberStr,
    created,
    destination,
    customerName,
    customerPhone,
    typeLabel,
    equipNorm,
    serial: so.equipment_serial ? norm(so.equipment_serial) : null,
    defectNorm,
    accessories: so.accessories_in ? norm(so.accessories_in) : null,
    password: so.equipment_password ? norm(so.equipment_password) : null,
    qrDataUrl,
    trackingUrl,
  };

  return (
    <div className="py-6 px-4">
      <OSLabelPrintView data={labelData} />
    </div>
  );
}
