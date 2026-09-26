import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { ConfirmDeliveryButton } from './ConfirmDeliveryButton';
import { PixQRButton } from '@/app/admin/components/PixQRButton';
import { EQUIPMENT_TYPES, WARRANTY_DAYS, type EquipmentTypeValue } from '@/app/admin/types/database';
import { formatDateBR, formatDateTimeBR } from '@/app/admin/lib/datetime';
import { brand } from '@/lib/brand';

export const dynamic = 'force-dynamic';

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default async function ReciboPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ format?: string }>;
}) {
  const { id } = await params;
  const sParams = await searchParams;
  const isA4 = sParams.format === 'a4';

  const { supabase, user } = await getAuthedUser();
  if (!user) redirect('/admin/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();

  // Busca OS
  const { data: so } = await supabase
    .from('service_orders')
    .select(`
      *,
      customer:customers(name, phone)
    `)
    .eq('id', id)
    .single();
  if (!so) notFound();

  // Peças usadas na OS (stock_movements onde reference = os_number ou service_order_id = id)
  type PartRow = {
    id: string;
    quantity: number;
    unit_price: number;
    total_amount: number | null;
    movement_type: string;
    notes: string | null;
    created_at: string;
    stock_item: { name: string; ean13: string | null; brand: string | null; model: string | null } | null;
  };

  const { data: partsRaw } = await supabase
    .from('stock_movements')
    .select(`
      id, quantity, unit_price, total_amount, movement_type, notes, created_at,
      stock_item:stock_items(name, ean13, brand, model)
    `)
    .or(`service_order_id.eq.${id},reference.eq.${so.os_number}`)
    .in('movement_type', ['out', 'sale'])
    .order('created_at', { ascending: true });

  const parts = (partsRaw as unknown as PartRow[] | null) ?? [];

  const soWithCustomer = so as typeof so & { customer: { name: string; phone: string | null } | null };
  const customerName = soWithCustomer.customer?.name ?? '(cliente não informado)';
  const customerPhone = soWithCustomer.customer?.phone ?? null;
  const typeMeta = EQUIPMENT_TYPES.find((t) => t.value === (so.equipment_type as EquipmentTypeValue));

  const laborCost = Number(so.labor_cost ?? 0);
  const partsTotal = parts.reduce((acc, p) => acc + Number(p.total_amount ?? 0), 0);
  const grandTotal = laborCost + partsTotal;

  // Garantia legal de 90 dias pelo Código de Defesa do Consumidor (Art. 26, II da Lei 8.078/90)
  const warrantyStart = so.delivered_at ?? so.created_at;
  const warrantyEnd = new Date(new Date(warrantyStart).getTime() + WARRANTY_DAYS * 86400000);

  const isFinal = so.status === 'delivered';
  const canConfirmDelivery = profile?.role === 'owner' || profile?.role === 'technician';

  // QR Code de autenticidade / rastreio do recibo
  const trackingQuery = so.short_id || so.os_number || so.id;
  const trackingUrl = `${brand.url}/status?q=${encodeURIComponent(trackingQuery)}`;
  const qrDataUrl = await QRCode.toDataURL(trackingUrl, {
    width: 120,
    margin: 1,
    errorCorrectionLevel: 'M',
  });

  return (
    <>
      {/* Barra de Ações Superior (Oculta na Impressão) */}
      <div className="print:hidden mx-auto mb-6 max-w-2xl rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Recibo Oficial do Cliente (80mm / A4)
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Discriminação de mão de obra e peças com Termo de Garantia CDC.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/admin/os/${so.id}/recibo${isA4 ? '' : '?format=a4'}`}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              {isA4 ? 'Mudar p/ Bobina 80mm' : 'Mudar p/ Formato A4'}
            </Link>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') window.print();
              }}
              className="rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-sky-700 transition shadow-2xs"
            >
              🖨️ Imprimir Recibo
            </button>
            <Link
              href={`/admin/os/${so.id}`}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              ← OS
            </Link>
          </div>
        </div>
      </div>

      {!isFinal && canConfirmDelivery && (
        <div className="print:hidden mx-auto mb-4 max-w-2xl rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          ⚠️ <strong>OS ainda não entregue.</strong> Preencha quem retirou no rodapé para confirmar a entrega formal.
        </div>
      )}

      {/* ============ RECIBO DO CLIENTE (80MM OU A4) ============ */}
      <article
        className={`receipt-container mx-auto bg-white text-black font-sans shadow-2xl print:shadow-none ${
          isA4 ? 'max-w-2xl p-8 rounded-lg' : 'receipt-80mm p-4 text-xs'
        }`}
      >
        {/* Cabeçalho */}
        <header className="border-b-2 border-black pb-3 text-center">
          <h1 className="text-xl font-black uppercase tracking-tight">
            Cyber Informática
          </h1>
          <p className="text-[10px] uppercase tracking-wider font-bold text-zinc-700">
            Laboratório de Engenharia e Tecnologia de Hardware
          </p>
          <div className="mt-1 flex items-center justify-between border-t border-dashed border-zinc-400 pt-1 text-[11px] font-mono">
            <span>OS: <strong>{so.short_id ?? so.os_number}</strong></span>
            <span>{formatDateBR(so.delivered_at ?? so.created_at)}</span>
          </div>
        </header>

        {/* Cliente & Equipamento */}
        <section className="py-2 border-b border-zinc-300 space-y-1">
          <div className="flex justify-between">
            <span className="font-bold text-zinc-600 uppercase text-[10px]">Cliente:</span>
            <span className="font-bold">{customerName}</span>
          </div>
          {customerPhone && (
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-500">Telefone:</span>
              <span>{customerPhone}</span>
            </div>
          )}
          <div className="flex justify-between pt-1">
            <span className="font-bold text-zinc-600 uppercase text-[10px]">Aparelho:</span>
            <span className="font-bold text-right">
              {typeMeta?.label} {so.equipment_brand} {so.equipment_model}
            </span>
          </div>
          {so.equipment_serial && (
            <div className="flex justify-between text-[10px] text-zinc-600">
              <span>Serial / IMEI:</span>
              <span className="font-mono">{so.equipment_serial}</span>
            </div>
          )}
        </section>

        {/* Defeito e Reparo Executado */}
        <section className="py-2 border-b border-zinc-300 text-[11px]">
          <div>
            <span className="font-bold uppercase text-[9px] text-zinc-500">Defeito Relatado:</span>
            <p className="text-zinc-800">{so.reported_defect}</p>
          </div>
          {so.repair_notes && (
            <div className="mt-1.5">
              <span className="font-bold uppercase text-[9px] text-zinc-500">Serviço Executado:</span>
              <p className="font-medium text-black">{so.repair_notes}</p>
            </div>
          )}
        </section>

        {/* Discriminação de Peças e Mão de Obra */}
        <section className="py-2 border-b border-black">
          <h2 className="text-[10px] font-black uppercase tracking-wider text-zinc-700 mb-1">
            Discriminação de Valores
          </h2>

          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-zinc-300 text-left text-[9px] uppercase text-zinc-500 font-bold">
                <th className="pb-1">Item / Descrição</th>
                <th className="pb-1 text-center">Qtd</th>
                <th className="pb-1 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              <tr>
                <td className="py-1">
                  <div className="font-semibold">Mão de Obra Técnica Especializada</div>
                  <div className="text-[9px] text-zinc-500">Execução, testes QA e bancada pericial</div>
                </td>
                <td className="py-1 text-center font-mono">1</td>
                <td className="py-1 text-right font-mono font-bold">{fmtBRL(laborCost)}</td>
              </tr>

              {parts.map((p) => (
                <tr key={p.id}>
                  <td className="py-1">
                    <div className="font-semibold">{p.stock_item?.name ?? 'Peça/Componente'}</div>
                    {p.notes && <div className="text-[9px] text-zinc-500">{p.notes}</div>}
                  </td>
                  <td className="py-1 text-center font-mono">{p.quantity}</td>
                  <td className="py-1 text-right font-mono font-bold">
                    {fmtBRL(Number(p.total_amount ?? 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Subtotais e Total Geral */}
          <div className="mt-3 pt-2 border-t border-dashed border-zinc-400 space-y-1 text-[11px]">
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal Mão de Obra:</span>
              <span className="font-mono">{fmtBRL(laborCost)}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal Peças:</span>
              <span className="font-mono">{fmtBRL(partsTotal)}</span>
            </div>
            <div className="flex justify-between text-base font-black border-t-2 border-black pt-1 mt-1">
              <span>TOTAL A PAGAR:</span>
              <span className="font-mono">{fmtBRL(grandTotal)}</span>
            </div>
          </div>
        </section>

        {/* Termo de Garantia CDC (Lei nº 8.078/1990) */}
        <section className="py-2.5 border-b border-zinc-300 text-[9px] leading-tight text-zinc-700 space-y-1">
          <div className="font-bold uppercase text-[9px] text-black">
            Termo de Garantia Legal (Art. 26, II — CDC)
          </div>
          <p>
            1. Conforme estabelece o Artigo 26, Inciso II da Lei nº 8.078/1990 (Código de Defesa do Consumidor),
            o serviço e peças aplicadas têm garantia legal de <strong>90 (noventa) dias</strong> a contar da data de entrega,
            válida até <strong>{formatDateBR(warrantyEnd)}</strong>.
          </p>
          <p>
            2. A garantia cobre unicamente os defeitos nos componentes substituídos e no serviço técnico realizado.
            Cessa automaticamente caso haja sinais de queda, choques físicos, contato com líquido/oxidação, lacres rompidos,
            sobretensão na rede elétrica ou abertura/modificação por terceiros.
          </p>
          <p>
            3. Equipamentos concluídos e não retirados pelo cliente no prazo de 90 (noventa) dias após aviso formal
            poderão ser alienados ou destinados ao descarte conforme o Art. 1.275, Inciso III do Código Civil Brasileiro.
          </p>
        </section>

        {/* Informações de Retirada & Assinaturas */}
        <section className="pt-3 pb-2 text-[10px]">
          {so.delivered_to_name && (
            <p className="mb-2 text-zinc-800">
              Retirado por: <strong>{so.delivered_to_name}</strong> em {formatDateTimeBR(so.delivered_at)}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 pt-6 text-center text-[9px]">
            <div>
              <div className="border-t border-black pt-1 font-bold">Assinatura do Cliente</div>
              <div className="text-zinc-500 text-[8px]">Declaro ter recebido e testado o aparelho</div>
            </div>
            <div>
              <div className="border-t border-black pt-1 font-bold">Cyber Informática</div>
              <div className="text-zinc-500 text-[8px]">Técnico Responsável</div>
            </div>
          </div>
        </section>

        {/* QR Code de Autenticidade do Recibo */}
        <footer className="mt-3 pt-2 border-t border-dashed border-zinc-400 flex items-center justify-between">
          <div className="text-[8px] text-zinc-500">
            <div>Autenticidade e Rastreio CDC</div>
            <div className="font-mono">{so.id.slice(0, 18)}</div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt="QR Code de Autenticidade"
            className="w-12 h-12 object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
        </footer>

        {/* Ação de Confirmar Entrega se Pendente */}
        {!isFinal && canConfirmDelivery && (
          <div className="print:hidden mt-6 border-t border-zinc-200 pt-4">
            <ConfirmDeliveryButton osId={so.id} osNumber={so.os_number ?? ''} />
          </div>
        )}
      </article>

      <style>{`
        @page {
          size: ${isA4 ? 'A4 portrait' : '80mm auto'};
          margin: ${isA4 ? '10mm' : '0'};
        }
        @media print {
          html, body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            visibility: hidden;
          }
          .receipt-container, .receipt-container * {
            visibility: visible;
          }
          .receipt-container {
            position: absolute;
            top: 0;
            left: 0;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            margin: 0 !important;
            border: 0 !important;
          }
          .receipt-80mm {
            width: 80mm !important;
            max-width: 80mm !important;
            padding: 3mm 4mm !important;
          }
        }
        .receipt-80mm {
          width: 80mm;
          max-width: 80mm;
        }
      `}</style>
    </>
  );
}
