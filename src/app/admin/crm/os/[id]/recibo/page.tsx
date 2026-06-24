import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createCRMServerClient } from '@/app/admin/crm/lib/supabase/server';
import { ConfirmDeliveryButton } from './ConfirmDeliveryButton';
import { EQUIPMENT_TYPES, type EquipmentTypeValue } from '@/app/admin/crm/types/database';

export const dynamic = 'force-dynamic';

const WARRANTY_DAYS = 90;

export default async function ReciboPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createCRMServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/crm/login');

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
      customer:customers(name, phone),
      assigned:profiles!service_orders_assigned_to_fkey(full_name)
    `)
    .eq('id', id)
    .single();
  if (!so) notFound();

  // Pecas usadas (stock_movements onde reference = os_number)
  const { data: parts } = await supabase
    .from('stock_movements')
    .select(`
      id, quantity, unit_price, total_amount, movement_type, notes, created_at,
      stock_item:stock_items(name, ean13, brand, model)
    `)
    .eq('reference', so.os_number)
    .in('movement_type', ['out', 'sale'])
    .order('created_at', { ascending: true });

  const customerName = (so as any).customer?.name ?? '(cliente removido)';
  const customerPhone = (so as any).customer?.phone ?? null;
  const assignedToName = (so as any).assigned?.full_name ?? null;
  const typeMeta = EQUIPMENT_TYPES.find((t) => t.value === (so.equipment_type as EquipmentTypeValue));

  const laborCost = Number(so.labor_cost ?? 0);
  const partsTotal = (parts ?? []).reduce((acc, p) => acc + Number(p.total_amount ?? 0), 0);
  const grandTotal = laborCost + partsTotal;

  // Garantia: 90 dias a partir da entrega (delivered_at) ou criacao
  const warrantyStart = so.delivered_at ?? so.created_at;
  const warrantyEnd = new Date(new Date(warrantyStart).getTime() + WARRANTY_DAYS * 86400000);

  const isFinal = so.status === 'delivered';
  const canConfirmDelivery = profile?.role === 'owner' || profile?.role === 'technician';

  return (
    <>
      <div className="print:hidden mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
        <span className="text-blue-800">
          Recibo de entrega. <strong>Use Ctrl+P</strong> pra salvar como PDF ou imprimir.
        </span>
        <div className="flex gap-2">
          <Link
            href={`/admin/crm/os/${so.id}/recibo/mpt`}
            target="_blank"
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Versão MPT-II 58mm
          </Link>
          <Link
            href={`/admin/crm/os/${so.id}`}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Voltar pra OS
          </Link>
        </div>
      </div>

      {!isFinal && canConfirmDelivery && (
        <div className="print:hidden mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-emerald-800">
              <strong>OS ainda não entregue.</strong> Preencha quem retirou e confirme pra marcar como entregue.
            </span>
          </div>
        </div>
      )}

      <article className="print:bg-white print:text-slate-900 mx-auto max-w-2xl bg-white p-6 shadow print:max-w-none print:shadow-none print:p-8 sm:p-8">
        {/* Header */}
        <header className="border-b border-slate-300 pb-4">
          <div className="flex items-baseline justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Cyber <span className="text-blue-600">Informática</span>
            </h1>
            <div className="text-right">
              <p className="font-mono text-lg font-semibold text-slate-900">{so.os_number}</p>
              <p className="text-xs text-slate-500">
                {so.short_id && `ID: ${so.short_id}`}
              </p>
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Recibo de entrega · {new Date(so.delivered_at ?? so.created_at).toLocaleString('pt-BR')}
          </p>
        </header>

        {/* Cliente + Aparelho */}
        <section className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cliente</h2>
            <p className="mt-1 font-semibold text-slate-900">{customerName}</p>
            {customerPhone && <p className="text-slate-700">{customerPhone}</p>}
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Aparelho</h2>
            <p className="mt-1 font-semibold text-slate-900">
              {typeMeta?.label}
              {so.equipment_brand ? ` · ${so.equipment_brand}` : ''}
              {so.equipment_model ? ` ${so.equipment_model}` : ''}
            </p>
            {so.equipment_color && <p className="text-slate-700">Cor: {so.equipment_color}</p>}
            {so.equipment_serial && <p className="text-slate-700">IMEI/Serial: {so.equipment_serial}</p>}
          </div>
        </section>

        {/* Defeito */}
        <section className="mt-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Defeito relatado</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">{so.reported_defect}</p>
        </section>

        {/* Diagnóstico técnico */}
        {so.repair_notes && (
          <section className="mt-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Diagnóstico / Reparo executado</h2>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">{so.repair_notes}</p>
          </section>
        )}

        {/* Pecas usadas */}
        <section className="mt-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Peças usadas</h2>
          {parts && parts.length > 0 ? (
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="border-b border-slate-300 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-1">Item</th>
                  <th className="py-1 text-center">Qtd</th>
                  <th className="py-1 text-right">Unit.</th>
                  <th className="py-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 text-slate-900">
                    <td className="py-1.5">
                      {(p as any).stock_item?.name ?? '(item removido)'}
                      {p.notes && <div className="text-xs text-slate-500">{p.notes}</div>}
                    </td>
                    <td className="py-1.5 text-center font-mono">{p.quantity}</td>
                    <td className="py-1.5 text-right font-mono">
                      {p.unit_price ? `R$ ${Number(p.unit_price).toFixed(2)}` : '-'}
                    </td>
                    <td className="py-1.5 text-right font-mono">
                      R$ {Number(p.total_amount ?? 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="mt-1 text-sm text-slate-500 italic">Nenhuma peça registrada.</p>
          )}
        </section>

        {/* Totais */}
        <section className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-700">Peças</span>
            <span className="font-mono text-slate-900">R$ {partsTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-700">Mão de obra</span>
            <span className="font-mono text-slate-900">R$ {laborCost.toFixed(2)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t-2 border-slate-900 pt-2 text-base font-bold">
            <span className="text-slate-900">TOTAL</span>
            <span className="font-mono text-slate-900">R$ {grandTotal.toFixed(2)}</span>
          </div>
        </section>

        {/* Garantia */}
        <section className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Garantia</h2>
          <p className="mt-1 text-slate-900">
            <strong>{WARRANTY_DAYS} dias</strong> a partir de{' '}
            {new Date(warrantyStart).toLocaleDateString('pt-BR')}{' '}
            — válida até <strong>{warrantyEnd.toLocaleDateString('pt-BR')}</strong>.
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Cobre defeitos relacionados ao reparo executado. Não cobre danos por mau uso,
            quedas, contato com líquido ou abertura por terceiros.
          </p>
        </section>

        {/* Quem retirou (se ja entregue) */}
        {so.delivered_to_name && (
          <section className="mt-4 text-sm">
            <p className="text-slate-700">
              Retirado por: <strong className="text-slate-900">{so.delivered_to_name}</strong>
              {so.delivered_at && ` em ${new Date(so.delivered_at).toLocaleString('pt-BR')}`}
            </p>
          </section>
        )}

        {/* Assinaturas */}
        <section className="mt-8 grid grid-cols-2 gap-8 text-xs text-slate-700">
          <div className="border-t border-slate-400 pt-1">
            <p>Assinatura do cliente (retirada)</p>
          </div>
          <div className="border-t border-slate-400 pt-1">
            <p>Responsável Cyber Informática{assignedToName && ` — ${assignedToName}`}</p>
          </div>
        </section>

        {/* Confirmar entrega (se ainda nao entregue) */}
        {!isFinal && canConfirmDelivery && (
          <div className="print:hidden mt-6 border-t border-slate-200 pt-4">
            <ConfirmDeliveryButton
              osId={so.id}
              osNumber={so.os_number ?? ''}
            />
          </div>
        )}
      </article>

      <style>{`
        @media print {
          html, body { background: white !important; color: #0f172a !important; }
          article { background: white !important; color: #0f172a !important; }
          article * { color: #0f172a !important; }
          article .text-blue-600 { color: #2563eb !important; }
          article .text-emerald-600 { color: #059669 !important; }
          header.sticky, nav, .print-hidden { display: none !important; }
        }
      `}</style>
    </>
  );
}