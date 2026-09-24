import { notFound, redirect } from 'next/navigation';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { ConfirmDeliveryButton } from './ConfirmDeliveryButton';
import { ReciboActionButtons } from './ReciboActionButtons';
import { PixQRButton } from '@/app/admin/components/PixQRButton';
import {
  EQUIPMENT_TYPES,
  PAYMENT_METHODS,
  WARRANTY_DAYS,
  type EquipmentTypeValue,
} from '@/app/admin/types/database';
import { formatDateBR, formatDateTimeBR } from '@/app/admin/lib/datetime';

export const dynamic = 'force-dynamic';

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default async function ReciboPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getAuthedUser();
  if (!user) redirect('/admin/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();

  // Busca OS com dados completos do cliente
  const { data: so } = await supabase
    .from('service_orders')
    .select(`
      *,
      customer:customers(name, phone, email, notes)
    `)
    .eq('id', id)
    .single();
  if (!so) notFound();

  // Peças usadas (vinculadas por service_order_id ou reference = os_number)
  type PartRow = {
    id: string;
    quantity: number;
    unit_price: number;
    total_amount: number | null;
    movement_type: string;
    notes: string | null;
    created_at: string;
    stock_item: {
      name: string;
      ean13: string | null;
      internal_sku: string | null;
      brand: string | null;
      model: string | null;
    } | null;
  };

  let partsQuery = supabase
    .from('stock_movements')
    .select(`
      id, quantity, unit_price, total_amount, movement_type, notes, created_at,
      stock_item:stock_items(name, ean13, internal_sku, brand, model)
    `)
    .in('movement_type', ['out', 'sale'])
    .order('created_at', { ascending: true });

  if (so.os_number) {
    partsQuery = partsQuery.or(`service_order_id.eq.${id},reference.eq.${so.os_number}`);
  } else {
    partsQuery = partsQuery.eq('service_order_id', id);
  }

  const { data: partsRaw } = await partsQuery;
  const parts = partsRaw as unknown as PartRow[] | null;

  // Pagamentos registrados na OS
  type PaymentRow = {
    id: string;
    amount: number;
    payment_method: string;
    paid_at: string;
    notes: string | null;
  };
  const { data: paymentsRaw } = await supabase
    .from('service_order_payments')
    .select('id, amount, payment_method, paid_at, notes')
    .eq('service_order_id', id)
    .order('paid_at', { ascending: true });
  const payments = (paymentsRaw ?? []) as PaymentRow[];

  const soWithCustomer = so as typeof so & {
    customer: {
      name: string;
      phone: string | null;
      email: string | null;
      notes: string | null;
    } | null;
    labor_cost?: number | null;
    repair_notes?: string | null;
    delivered_to_name?: string | null;
  };

  const customerName = soWithCustomer.customer?.name ?? '(cliente não identificado)';
  const customerPhone = soWithCustomer.customer?.phone ?? null;
  const customerEmail = soWithCustomer.customer?.email ?? null;
  const customerNotes = soWithCustomer.customer?.notes ?? null;
  const typeMeta = EQUIPMENT_TYPES.find((t) => t.value === (so.equipment_type as EquipmentTypeValue));

  const laborCost = Number(soWithCustomer.labor_cost ?? 0);
  const partsTotal = (parts ?? []).reduce((acc, p) => acc + Number(p.total_amount ?? 0), 0);
  const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount ?? 0), 0);
  const calculatedTotal = laborCost + partsTotal;
  const estimatedVal = Number(so.estimated_value ?? 0);
  const grandTotal =
    calculatedTotal > 0 ? calculatedTotal : estimatedVal > 0 ? estimatedVal : totalPaid;

  const isPaid =
    so.payment_status === 'paid' || (grandTotal > 0 && totalPaid >= grandTotal);
  const remaining = Math.max(0, grandTotal - totalPaid);

  // Garantia: 90 dias a partir da entrega (delivered_at) ou data atual/criação
  const warrantyStart = so.delivered_at ?? so.created_at;
  const warrantyEnd = new Date(new Date(warrantyStart).getTime() + WARRANTY_DAYS * 86400000);
  const warrantyStartFormatted = formatDateBR(warrantyStart);
  const warrantyEndFormatted = formatDateBR(warrantyEnd);

  const isFinal = so.status === 'delivered';
  const canConfirmDelivery = profile?.role === 'owner' || profile?.role === 'technician';

  const equipmentFullTitle = [
    typeMeta?.label ?? so.equipment_type,
    so.equipment_brand,
    so.equipment_model,
  ]
    .filter(Boolean)
    .join(' · ');

  const storeCnpj = process.env.NEXT_PUBLIC_STORE_CNPJ ?? null;

  function getPaymentLabel(method: string | null | undefined): string {
    if (!method) return 'Não informado';
    const found = PAYMENT_METHODS.find((m) => m.value === method);
    return found ? found.label : method;
  }

  return (
    <>
      <ReciboActionButtons
        osId={so.id}
        osNumber={so.os_number ?? so.short_id ?? so.id.slice(0, 8)}
        customerName={customerName}
        customerPhone={customerPhone}
        grandTotal={grandTotal}
        warrantyEndFormatted={warrantyEndFormatted}
        isPaid={isPaid}
      />

      {!isFinal && canConfirmDelivery && (
        <div className="print:hidden mb-4 rounded-lg border border-zinc-300 bg-zinc-50 p-3 text-xs text-zinc-800">
          <strong>Atenção:</strong> Esta OS ainda consta como <em>não entregue</em> no sistema. Você pode confirmar a entrega no final desta página ou na tela da OS.
        </div>
      )}

      {/* DOCUMENTO A4 / PDF */}
      <article className="print-sheet mx-auto max-w-3xl rounded-sm border border-zinc-300 bg-white p-6 text-zinc-950 shadow-sm sm:p-8 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
        {/* CABEÇALHO FISCAL / IDENTIFICAÇÃO DO EMITENTE E DOCUMENTO */}
        <header className="grid grid-cols-1 gap-4 border-2 border-zinc-900 p-4 sm:grid-cols-12">
          <div className="sm:col-span-7 sm:border-r sm:border-zinc-300 sm:pr-4">
            <div className="flex items-baseline gap-2">
              <h1 className="text-2xl font-black uppercase tracking-tight text-black">
                Cyber Informática
              </h1>
            </div>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Assistência Técnica Especializada &amp; Informática
            </p>
            <div className="mt-2.5 space-y-0.5 text-[11px] leading-relaxed text-zinc-700">
              {storeCnpj && (
                <p>
                  <strong>CNPJ:</strong> {storeCnpj}
                </p>
              )}
              <p>
                <strong>Endereço:</strong> Rua Coronel Teófilo Leme, 967 — Centro, Bragança Paulista - SP — CEP 12900-004
              </p>
              <p>
                <strong>Contato:</strong> (11) 95436-9269 (WhatsApp) · contato@cyberinformatica.tech
              </p>
              <p>
                <strong>Site:</strong> www.cyberinformatica.tech
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between border-t border-zinc-300 pt-3 sm:col-span-5 sm:border-t-0 sm:pt-0 sm:text-right">
            <div>
              <span className="inline-block rounded-sm bg-zinc-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                Nota de Serviço / Garantia
              </span>
              <p className="mt-1 text-[10px] text-zinc-500">
                Documento Auxiliar de Prestação de Serviços e Entrega
              </p>
            </div>

            <div className="mt-2 border-t border-zinc-200 pt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Nº da Ordem de Serviço
              </p>
              <p className="font-mono text-xl font-black text-black">
                {so.os_number ?? so.short_id}
              </p>
              <div className="mt-1 space-y-0.5 text-[11px] text-zinc-700">
                <p>
                  <strong>Entrada:</strong> {formatDateTimeBR(so.created_at)}
                </p>
                <p>
                  <strong>Emissão / Saída:</strong>{' '}
                  {formatDateTimeBR(so.delivered_at ?? new Date().toISOString())}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* QUADRO 1: DADOS DO CLIENTE / TOMADOR */}
        <section className="mt-3 border border-zinc-300">
          <div className="border-b border-zinc-300 bg-zinc-100 px-3 py-1">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-800">
              1. Identificação do Cliente / Tomador do Serviço
            </h2>
          </div>
          <div className="grid grid-cols-1 divide-y divide-zinc-200 text-xs sm:grid-cols-12 sm:divide-x sm:divide-y-0">
            <div className="p-2.5 sm:col-span-5">
              <span className="block text-[10px] font-semibold uppercase text-zinc-500">
                Nome / Razão Social
              </span>
              <span className="mt-0.5 block font-bold text-zinc-950">{customerName}</span>
            </div>
            <div className="p-2.5 sm:col-span-3">
              <span className="block text-[10px] font-semibold uppercase text-zinc-500">
                Telefone / WhatsApp
              </span>
              <span className="mt-0.5 block font-mono text-zinc-900">
                {customerPhone || 'Não informado'}
              </span>
            </div>
            <div className="p-2.5 sm:col-span-4">
              <span className="block text-[10px] font-semibold uppercase text-zinc-500">
                E-mail / Observações
              </span>
              <span className="mt-0.5 block truncate text-zinc-900">
                {customerEmail || customerNotes || 'Consumidor Final'}
              </span>
            </div>
          </div>
        </section>

        {/* QUADRO 2: IDENTIFICAÇÃO DO EQUIPAMENTO */}
        <section className="mt-3 border border-zinc-300">
          <div className="border-b border-zinc-300 bg-zinc-100 px-3 py-1">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-800">
              2. Identificação do Equipamento / Objeto
            </h2>
          </div>
          <div className="grid grid-cols-1 divide-y divide-zinc-200 text-xs sm:grid-cols-12 sm:divide-x sm:divide-y-0">
            <div className="p-2.5 sm:col-span-5">
              <span className="block text-[10px] font-semibold uppercase text-zinc-500">
                Equipamento / Marca / Modelo
              </span>
              <span className="mt-0.5 block font-bold text-zinc-950">
                {equipmentFullTitle || 'Equipamento'}
              </span>
            </div>
            <div className="p-2.5 sm:col-span-3">
              <span className="block text-[10px] font-semibold uppercase text-zinc-500">
                Nº de Série / IMEI
              </span>
              <span className="mt-0.5 block font-mono text-zinc-900">
                {so.equipment_serial || 'Não registrado'}
              </span>
            </div>
            <div className="p-2.5 sm:col-span-4">
              <span className="block text-[10px] font-semibold uppercase text-zinc-500">
                Cor &amp; Acessórios Deixados
              </span>
              <span className="mt-0.5 block text-zinc-900">
                {[
                  so.equipment_color ? `Cor: ${so.equipment_color}` : null,
                  so.accessories_in ? `Acess.: ${so.accessories_in}` : null,
                ]
                  .filter(Boolean)
                  .join(' | ') || 'Sem acessórios avulsos'}
              </span>
            </div>
          </div>
        </section>

        {/* QUADRO 3: LAUDO TÉCNICO E SERVIÇO EXECUTADO */}
        <section className="mt-3 border border-zinc-300">
          <div className="border-b border-zinc-300 bg-zinc-100 px-3 py-1">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-800">
              3. Relatório Técnico (Defeito Relatado &amp; Serviço Executado)
            </h2>
          </div>
          <div className="grid grid-cols-1 divide-y divide-zinc-200 text-xs sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <div className="p-2.5">
              <span className="block text-[10px] font-semibold uppercase text-zinc-500">
                Defeito / Solicitação Relatada na Entrada
              </span>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed text-zinc-900">
                {so.reported_defect}
              </p>
            </div>
            <div className="p-2.5">
              <span className="block text-[10px] font-semibold uppercase text-zinc-500">
                Diagnóstico Técnico / Reparo e Solução Aplicada
              </span>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed text-zinc-900">
                {soWithCustomer.repair_notes?.trim()
                  ? soWithCustomer.repair_notes
                  : 'Manutenção técnica especializada, reparo e testes operacionais concluídos em conformidade com o orçamento aprovado.'}
              </p>
            </div>
          </div>
        </section>

        {/* QUADRO 4: DISCRIMINAÇÃO DE PEÇAS E SERVIÇOS */}
        <section className="mt-3 border border-zinc-300">
          <div className="border-b border-zinc-300 bg-zinc-100 px-3 py-1">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-800">
              4. Discriminação dos Serviços Executados e Peças Substituídas
            </h2>
          </div>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-300 bg-zinc-50 text-left text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                <th className="px-3 py-1.5">Código</th>
                <th className="px-3 py-1.5">Descrição do Item / Serviço</th>
                <th className="px-3 py-1.5 text-center">Natureza</th>
                <th className="px-3 py-1.5 text-center">Qtd</th>
                <th className="px-3 py-1.5 text-right">V. Unit.</th>
                <th className="px-3 py-1.5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {parts &&
                parts.map((p, idx) => {
                  const unitPrice = Number(p.unit_price ?? 0);
                  const rowTotal = Number(p.total_amount ?? unitPrice * p.quantity);
                  const itemCode =
                    p.stock_item?.internal_sku ||
                    p.stock_item?.ean13 ||
                    `PECA-${String(idx + 1).padStart(2, '0')}`;
                  return (
                    <tr key={p.id} className="text-zinc-900">
                      <td className="px-3 py-2 font-mono text-[11px] text-zinc-600">{itemCode}</td>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-zinc-950">
                          {p.stock_item?.name ?? 'Componente / Peça de reposição'}
                        </span>
                        {(p.stock_item?.brand || p.stock_item?.model) && (
                          <span className="ml-1 text-[11px] text-zinc-600">
                            ({[p.stock_item?.brand, p.stock_item?.model].filter(Boolean).join(' ')})
                          </span>
                        )}
                        {p.notes && <div className="text-[10px] text-zinc-500">{p.notes}</div>}
                      </td>
                      <td className="px-3 py-2 text-center text-[11px] text-zinc-600">Peça</td>
                      <td className="px-3 py-2 text-center font-mono">{p.quantity}</td>
                      <td className="px-3 py-2 text-right font-mono">{fmtBRL(unitPrice)}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold">
                        {fmtBRL(rowTotal)}
                      </td>
                    </tr>
                  );
                })}

              {laborCost > 0 && (
                <tr className="text-zinc-900">
                  <td className="px-3 py-2 font-mono text-[11px] text-zinc-600">SERV-MO</td>
                  <td className="px-3 py-2">
                    <span className="font-semibold text-zinc-950">
                      Mão de Obra Técnica Especializada
                    </span>
                    <span className="ml-1 text-[11px] text-zinc-600">
                      ({equipmentFullTitle})
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-[11px] text-zinc-600">Serviço</td>
                  <td className="px-3 py-2 text-center font-mono">1</td>
                  <td className="px-3 py-2 text-right font-mono">{fmtBRL(laborCost)}</td>
                  <td className="px-3 py-2 text-right font-mono font-semibold">
                    {fmtBRL(laborCost)}
                  </td>
                </tr>
              )}

              {calculatedTotal === 0 && grandTotal > 0 && (
                <tr className="text-zinc-900">
                  <td className="px-3 py-2 font-mono text-[11px] text-zinc-600">SERV-OS</td>
                  <td className="px-3 py-2">
                    <span className="font-semibold text-zinc-950">
                      Serviço Técnico Especializado / Reparo Concluído
                    </span>
                    <span className="ml-1 text-[11px] text-zinc-600">
                      ({equipmentFullTitle})
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-[11px] text-zinc-600">Serviço</td>
                  <td className="px-3 py-2 text-center font-mono">1</td>
                  <td className="px-3 py-2 text-right font-mono">{fmtBRL(grandTotal)}</td>
                  <td className="px-3 py-2 text-right font-mono font-semibold">
                    {fmtBRL(grandTotal)}
                  </td>
                </tr>
              )}

              {(!parts || parts.length === 0) && laborCost === 0 && grandTotal === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-3 text-center text-zinc-500 italic">
                    Serviço em garantia / avaliação técnica sem custo faturado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* QUADRO 5: RESUMO FINANCEIRO & QUITAÇÃO */}
        <section className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-12">
          {/* Coluna Esquerda: Pagamentos e Status */}
          <div className="border border-zinc-300 p-3 sm:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-zinc-200 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-700">
                  Situação Financeira / Quitação
                </span>
                {isPaid ? (
                  <span className="inline-block rounded-sm border border-black bg-zinc-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    ✓ QUITADO / PAGO
                  </span>
                ) : totalPaid > 0 ? (
                  <span className="inline-block rounded-sm border border-zinc-400 bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-900">
                    PAGAMENTO PARCIAL
                  </span>
                ) : (
                  <span className="inline-block rounded-sm border border-zinc-300 bg-zinc-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-700">
                    EM ABERTO / A RECEBER
                  </span>
                )}
              </div>

              {payments.length > 0 ? (
                <div className="mt-2 space-y-1 text-xs">
                  <p className="text-[10px] font-semibold uppercase text-zinc-500">
                    Pagamentos Recebidos:
                  </p>
                  {payments.map((pay) => (
                    <div
                      key={pay.id}
                      className="flex items-center justify-between text-[11px] text-zinc-800"
                    >
                      <span>
                        • <strong>{getPaymentLabel(pay.payment_method)}</strong>{' '}
                        <span className="text-zinc-500">({formatDateTimeBR(pay.paid_at)})</span>
                      </span>
                      <span className="font-mono font-semibold text-zinc-950">
                        {fmtBRL(Number(pay.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              ) : so.payment_method ? (
                <div className="mt-2 text-xs text-zinc-800">
                  <p>
                    <strong>Forma de Pagamento:</strong> {getPaymentLabel(so.payment_method)}
                  </p>
                  {so.paid_at && (
                    <p className="text-[11px] text-zinc-600">
                      Quitado em: {formatDateTimeBR(so.paid_at)}
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-[11px] text-zinc-600">
                  Pagamento na retirada do equipamento (PIX, Dinheiro ou Cartão).
                </p>
              )}
            </div>

            {soWithCustomer.delivered_to_name && (
              <div className="mt-3 border-t border-zinc-200 pt-2 text-[11px] text-zinc-800">
                <strong>Equipamento retirado por:</strong> {soWithCustomer.delivered_to_name}
                {so.delivered_at && ` em ${formatDateTimeBR(so.delivered_at)}`}
              </div>
            )}
          </div>

          {/* Coluna Direita: Quadro de Totais */}
          <div className="border-2 border-zinc-900 bg-zinc-50/60 p-3 sm:col-span-5 flex flex-col justify-between">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-700">
                <span>Subtotal Peças:</span>
                <span className="font-mono">{fmtBRL(partsTotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-700">
                <span>Subtotal Serviços:</span>
                <span className="font-mono">
                  {fmtBRL(calculatedTotal > 0 ? laborCost : grandTotal)}
                </span>
              </div>
              {totalPaid > 0 && (
                <div className="flex justify-between text-zinc-700">
                  <span>Total Recebido:</span>
                  <span className="font-mono font-semibold text-zinc-900">{fmtBRL(totalPaid)}</span>
                </div>
              )}
              {remaining > 0 && totalPaid > 0 && (
                <div className="flex justify-between text-zinc-700">
                  <span>Saldo Restante:</span>
                  <span className="font-mono font-semibold text-zinc-900">{fmtBRL(remaining)}</span>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-baseline justify-between border-t-2 border-zinc-900 pt-2">
              <span className="text-xs font-black uppercase tracking-wider text-black">
                Valor Total
              </span>
              <span className="font-mono text-lg font-black text-black">
                {fmtBRL(grandTotal)}
              </span>
            </div>
          </div>
        </section>

        {/* QUADRO 6: TERMO E CERTIFICADO DE GARANTIA LEGAL */}
        <section className="mt-3 border border-zinc-300 bg-zinc-50/40 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-1.5">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-900">
              5. Certificado e Termo de Garantia Legal (Art. 26, II da Lei nº 8.078/1990 — CDC)
            </h2>
            <span className="font-mono text-[11px] font-bold text-zinc-950">
              Vigência: {WARRANTY_DAYS} dias ({warrantyStartFormatted} até {warrantyEndFormatted})
            </span>
          </div>
          <div className="mt-2 space-y-1 text-[10px] leading-relaxed text-zinc-700">
            <p>
              <strong>5.1. Cobertura:</strong> A <strong>Cyber Informática</strong> garante os serviços técnicos executados e as peças substituídas discriminadas neste documento pelo prazo legal de <strong>{WARRANTY_DAYS} (noventa) dias corridos</strong> contados da data de entrega efetiva do aparelho. A garantia restringe-se exclusivamente ao reparo descrito e às peças trocadas.
            </p>
            <p>
              <strong>5.2. Exclusão da Garantia:</strong> A garantia perderá totalmente sua validade caso seja constatado: (a) rompimento, rasura ou remoção do selo/lacre de segurança da loja; (b) abertura ou intervenção técnica por terceiros; (c) danos físicos posteriores à entrega, tais como quedas, impacto, amassados, pressão excessiva ou telas trincadas/quebradas; (d) contato com líquidos, umidade ou oxidação; (e) danos causados por oscilação elétrica, fontes/carregadores paralelos ou mau uso; (f) problemas de software, vírus ou sistema operacional não relacionados ao defeito reparado.
            </p>
            <p>
              <strong>5.3. Acionamento:</strong> Para atendimento em garantia, é indispensável a apresentação deste comprovante (impresso ou em PDF) juntamente com o equipamento.
            </p>
          </div>
        </section>

        {/* QUADRO 7: DECLARAÇÃO DE RECEBIMENTO E ASSINATURAS */}
        <section className="mt-4 pt-1">
          <p className="text-[10px] leading-snug text-zinc-700">
            Declaro que recebi o equipamento identificado neste documento devidamente reparado, testado e em perfeitas condições de funcionamento, estando plenamente ciente e de acordo com os valores, serviços discriminados e termos de garantia acima estabelecidos.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-8 text-center text-xs text-zinc-800">
            <div className="border-t border-zinc-800 pt-1.5">
              <p className="font-bold text-zinc-950">
                {soWithCustomer.delivered_to_name || customerName}
              </p>
              <p className="text-[10px] text-zinc-500">Assinatura do Cliente / Recebedor</p>
            </div>
            <div className="border-t border-zinc-800 pt-1.5">
              <p className="font-bold text-zinc-950">Cyber Informática</p>
              <p className="text-[10px] text-zinc-500">Responsável Técnico / Emitente</p>
            </div>
          </div>

          <footer className="mt-5 flex items-center justify-between border-t border-zinc-200 pt-2 text-[9px] text-zinc-500">
            <span>
              Cyber Informática · Rua Coronel Teófilo Leme, 967, Centro, Bragança Paulista - SP · (11) 95436-9269
            </span>
            <span className="font-mono">
              DOC-REF: {so.os_number ?? so.short_id} · ID: {so.id.slice(0, 8).toUpperCase()}
            </span>
          </footer>
        </section>

        {/* PIX QR CODE & CONFIRMAÇÃO DE ENTREGA (SOMENTE NA TELA, OCULTO NO PDF/IMPRESSÃO) */}
        {grandTotal > 0 && !isPaid && (
          <section className="print:hidden mt-6 rounded-md border border-zinc-300 bg-zinc-50 p-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-zinc-800">
              Cobrança via PIX (Não sai na impressão/PDF)
            </h2>
            <p className="mt-1 text-xs text-zinc-600">
              Valor a cobrar: <strong className="text-zinc-950">{fmtBRL(remaining > 0 ? remaining : grandTotal)}</strong>.
              Gere o QR Code caso o cliente queira pagar neste momento.
            </p>
            <div className="mt-2">
              <PixQRButton
                defaultAmount={remaining > 0 ? remaining : grandTotal}
                txid={so.os_number ?? undefined}
                description={`OS ${so.os_number ?? ''} - ${customerName}`.substring(0, 50)}
                buttonLabel="Gerar QR Code PIX"
              />
            </div>
          </section>
        )}

        {!isFinal && canConfirmDelivery && (
          <div className="print:hidden mt-6 border-t border-zinc-200 pt-4">
            <ConfirmDeliveryButton osId={so.id} osNumber={so.os_number ?? ''} />
          </div>
        )}
      </article>

      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          html, body {
            background: #ffffff !important;
            color: #09090b !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header.sticky, nav, .print\\:hidden {
            display: none !important;
          }
          main {
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          article.print-sheet {
            background: #ffffff !important;
            color: #09090b !important;
            width: 100% !important;
            max-width: none !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          section, header, footer, tr {
            break-inside: avoid;
          }
        }
      `}</style>
    </>
  );
}