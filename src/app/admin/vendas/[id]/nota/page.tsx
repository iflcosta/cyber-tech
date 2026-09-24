import { notFound, redirect } from 'next/navigation';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { PAYMENT_METHODS } from '@/app/admin/types/database';
import { formatDateTimeBR } from '@/app/admin/lib/datetime';
import { NotaVendaActionButtons } from './NotaVendaActionButtons';

export const dynamic = 'force-dynamic';

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default async function NotaVendaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await getAuthedUser();
  if (!user) redirect('/admin/login');

  const { data: sale } = await supabase
    .from('sales')
    .select(`
      *,
      author:profiles!sales_author_id_fkey(full_name)
    `)
    .eq('id', id)
    .single();

  if (!sale) notFound();

  const { data: items } = await supabase
    .from('sale_items')
    .select(`
      *,
      stock_item:stock_items(ean13, internal_sku, brand, model)
    `)
    .eq('sale_id', id)
    .order('created_at');

  const payMeta = PAYMENT_METHODS.find((m) => m.value === sale.payment_method);
  const customerName = sale.customer_name?.trim() || 'Consumidor Final';
  const customerPhone = sale.customer_phone?.trim() || null;
  const storeCnpj = process.env.NEXT_PUBLIC_STORE_CNPJ ?? null;

  return (
    <>
      <NotaVendaActionButtons
        saleId={sale.id}
        saleNumber={sale.sale_number}
        customerName={customerName}
        customerPhone={customerPhone}
        total={Number(sale.total)}
      />

      {sale.voided_at && (
        <div className="print:hidden mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-800">
          <strong>Atenção:</strong> Esta venda foi <em>cancelada / estornada</em> no sistema.
        </div>
      )}

      {/* DOCUMENTO A4 / PDF */}
      <article className="print-sheet mx-auto max-w-3xl rounded-sm border border-zinc-300 bg-white p-6 text-zinc-950 shadow-sm sm:p-8 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
        {/* CABEÇALHO FISCAL / EMITENTE */}
        <header className="grid grid-cols-1 gap-4 border-2 border-zinc-900 p-4 sm:grid-cols-12">
          <div className="sm:col-span-7 sm:border-r sm:border-zinc-300 sm:pr-4">
            <h1 className="text-2xl font-black uppercase tracking-tight text-black">
              Cyber Informática
            </h1>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Venda de Equipamentos, Peças e Acessórios
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
                Comprovante de Venda / Nota
              </span>
              <p className="mt-1 text-[10px] text-zinc-500">
                Documento Auxiliar de Venda ao Consumidor
              </p>
            </div>

            <div className="mt-2 border-t border-zinc-200 pt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Nº da Venda
              </p>
              <p className="font-mono text-xl font-black text-black">{sale.sale_number}</p>
              <div className="mt-1 space-y-0.5 text-[11px] text-zinc-700">
                <p>
                  <strong>Data da Venda:</strong> {formatDateTimeBR(sale.created_at)}
                </p>
                <p>
                  <strong>Atendente:</strong> {sale.author?.full_name ?? 'Cyber Informática'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* QUADRO 1: DADOS DO CLIENTE */}
        <section className="mt-3 border border-zinc-300">
          <div className="border-b border-zinc-300 bg-zinc-100 px-3 py-1">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-800">
              1. Identificação do Cliente / Consumidor
            </h2>
          </div>
          <div className="grid grid-cols-1 divide-y divide-zinc-200 text-xs sm:grid-cols-12 sm:divide-x sm:divide-y-0">
            <div className="p-2.5 sm:col-span-6">
              <span className="block text-[10px] font-semibold uppercase text-zinc-500">
                Nome do Consumidor
              </span>
              <span className="mt-0.5 block font-bold text-zinc-950">{customerName}</span>
            </div>
            <div className="p-2.5 sm:col-span-6">
              <span className="block text-[10px] font-semibold uppercase text-zinc-500">
                Telefone / Contato
              </span>
              <span className="mt-0.5 block font-mono text-zinc-900">
                {customerPhone || 'Não informado'}
              </span>
            </div>
          </div>
        </section>

        {/* QUADRO 2: ITENS DA VENDA */}
        <section className="mt-3 border border-zinc-300">
          <div className="border-b border-zinc-300 bg-zinc-100 px-3 py-1">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-800">
              2. Itens, Produtos e Mercadorias
            </h2>
          </div>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-300 bg-zinc-50 text-left text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                <th className="px-3 py-1.5">Código</th>
                <th className="px-3 py-1.5">Descrição do Produto / Mercadoria</th>
                <th className="px-3 py-1.5 text-center">Qtd</th>
                <th className="px-3 py-1.5 text-right">V. Unitário</th>
                <th className="px-3 py-1.5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {(items ?? []).map((item, idx) => {
                const itemCode =
                  (item as never as { stock_item?: { internal_sku?: string; ean13?: string } })
                    ?.stock_item?.internal_sku ||
                  (item as never as { stock_item?: { internal_sku?: string; ean13?: string } })
                    ?.stock_item?.ean13 ||
                  `PROD-${String(idx + 1).padStart(2, '0')}`;
                return (
                  <tr key={item.id} className="text-zinc-900">
                    <td className="px-3 py-2 font-mono text-[11px] text-zinc-600">{itemCode}</td>
                    <td className="px-3 py-2">
                      <span className="font-semibold text-zinc-950">{item.item_name}</span>
                    </td>
                    <td className="px-3 py-2 text-center font-mono">{item.quantity}</td>
                    <td className="px-3 py-2 text-right font-mono">
                      {fmtBRL(Number(item.unit_price))}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-semibold">
                      {fmtBRL(Number(item.subtotal))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* QUADRO 3: TOTAIS E PAGAMENTO */}
        <section className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-12">
          {/* Pagamento */}
          <div className="border border-zinc-300 p-3 sm:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-zinc-200 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-700">
                  Forma de Pagamento
                </span>
                <span className="inline-block rounded-sm border border-black bg-zinc-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  ✓ QUITADO INTEGRALMENTE
                </span>
              </div>
              <div className="mt-2 text-xs text-zinc-900">
                <p>
                  <strong>Método:</strong> {payMeta?.label ?? sale.payment_method}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-600">
                  Data da operação: {formatDateTimeBR(sale.created_at)}
                </p>
                {sale.notes && (
                  <p className="mt-2 text-[11px] text-zinc-700 italic border-t border-zinc-100 pt-1">
                    Obs: {sale.notes}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 border-t border-zinc-200 pt-2 text-[10px] text-zinc-500">
              Operação de balcão · Pagamento à vista confirmado.
            </div>
          </div>

          {/* Totais */}
          <div className="border-2 border-zinc-900 bg-zinc-50/60 p-3 sm:col-span-5 flex flex-col justify-between">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-700">
                <span>Subtotal Itens:</span>
                <span className="font-mono">{fmtBRL(Number(sale.subtotal))}</span>
              </div>
              {Number(sale.discount) > 0 && (
                <div className="flex justify-between text-zinc-700">
                  <span>Desconto Concedido:</span>
                  <span className="font-mono font-semibold text-zinc-900">
                    - {fmtBRL(Number(sale.discount))}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-baseline justify-between border-t-2 border-zinc-900 pt-2">
              <span className="text-xs font-black uppercase tracking-wider text-black">
                Valor Total Pago
              </span>
              <span className="font-mono text-lg font-black text-black">
                {fmtBRL(Number(sale.total))}
              </span>
            </div>
          </div>
        </section>

        {/* QUADRO 4: TERMO DE GARANTIA LEGAL DE PRODUTO */}
        <section className="mt-3 border border-zinc-300 bg-zinc-50/40 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-1.5">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-900">
              3. Garantia Legal de Balcão (Art. 26 da Lei nº 8.078/1990 — Código de Defesa do Consumidor)
            </h2>
            <span className="font-mono text-[11px] font-bold text-zinc-950">
              Prazo: 90 dias
            </span>
          </div>
          <div className="mt-2 space-y-1 text-[10px] leading-relaxed text-zinc-700">
            <p>
              Produtos duráveis possuem garantia legal de <strong>90 (noventa) dias</strong> contra vícios ou defeitos de fabricação a contar da data de compra, nos termos do Art. 26, II do CDC. A garantia não cobre danos por mau uso, quedas, contato com líquidos, sobrecargas na rede elétrica ou rompimento de lacres de fábrica.
            </p>
          </div>
        </section>

        {/* ASSINATURAS E RODAPÉ */}
        <section className="mt-6 pt-1">
          <div className="grid grid-cols-2 gap-8 text-center text-xs text-zinc-800">
            <div className="border-t border-zinc-800 pt-1.5">
              <p className="font-bold text-zinc-950">{customerName}</p>
              <p className="text-[10px] text-zinc-500">Assinatura do Cliente / Comprador</p>
            </div>
            <div className="border-t border-zinc-800 pt-1.5">
              <p className="font-bold text-zinc-950">Cyber Informática</p>
              <p className="text-[10px] text-zinc-500">Atendimento / Responsável</p>
            </div>
          </div>

          <footer className="mt-5 flex items-center justify-between border-t border-zinc-200 pt-2 text-[9px] text-zinc-500">
            <span>
              Cyber Informática · Rua Coronel Teófilo Leme, 967, Centro, Bragança Paulista - SP · (11) 95436-9269
            </span>
            <span className="font-mono">
              VENDA: {sale.sale_number} · ID: {sale.id.slice(0, 8).toUpperCase()}
            </span>
          </footer>
        </section>
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
