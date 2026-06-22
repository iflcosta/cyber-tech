import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createCRMServerClient } from '@/app/admin/crm/lib/supabase/server';
import { ReciboPrintButton } from './ReciboPrintButton';
import { AutoPrint } from './AutoPrint';

export const dynamic = 'force-dynamic';

// Remove acentos (driver Generic / Text Only da MPT-II nao renderiza UTF-8)
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

function buildRecibo(sale: any, items: any[], operatorName: string): string {
  // MPT-II com driver Generic/Text Only quebra linha em ~36-37 chars.
  // Usar cols=32 da margem de seguranca contra wrap feio.
  const cols = 32;
  const eq = '='.repeat(cols);
  const dash = '-'.repeat(cols);
  const now = new Date(sale.created_at);
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const payLabel: Record<string, string> = {
    cash: 'Dinheiro',
    pix: 'PIX',
    card: 'Cartao',
    transfer: 'Transferencia',
    other: 'Outro',
  };

  const lines: string[] = [];
  // Header
  lines.push(eq);
  lines.push(pad('CYBER INFORMATICA', cols));
  lines.push(pad('RECIBO', cols));
  lines.push(eq);
  // Numero + data em linhas SEPARADAS (evita wrap feio)
  lines.push(pad(sale.sale_number, cols));
  lines.push(pad(dateStr + ' ' + timeStr, cols));
  lines.push(dash);
  // Cabecalho das colunas
  lines.push(
    pad('ITEM', 14) + pad('QTD', 3) + pad('UNIT', 7) + pad('TOTAL', 8, 'right'),
  );
  lines.push(dash);
  // Itens: nome(14) + qty(3) + unit(7) + total(8) = 32 cols
  for (const item of items) {
    const nome = norm(item.item_name).substring(0, 14).padEnd(14);
    const qty = String(item.quantity).padStart(3);
    const unit = item.unit_price.toFixed(2).replace('.', ',').padStart(7);
    const sub = item.subtotal.toFixed(2).replace('.', ',').padStart(8);
    lines.push(nome + qty + unit + sub);
  }
  lines.push(dash);
  // Totais (subtotal so se tiver desconto)
  if (sale.discount > 0) {
    lines.push(pad('Subtotal:', 24) + pad(fmtBRL(sale.subtotal), 8, 'right'));
    lines.push(pad('Desconto:', 24) + pad('-' + fmtBRL(sale.discount), 8, 'right'));
  }
  lines.push(eq);
  lines.push(pad('TOTAL:', 24) + pad(fmtBRL(sale.total), 8, 'right'));
  lines.push(eq);
  // Pagamento + cliente + operador
  lines.push(pad('Pgto: ' + (payLabel[sale.payment_method] ?? sale.payment_method), cols));
  if (sale.customer_name) {
    lines.push(pad('Cliente: ' + norm(sale.customer_name).substring(0, 22), cols));
  }
  lines.push(pad('Operador: ' + norm(operatorName).substring(0, 22), cols));
  lines.push('');
  lines.push(pad('OBRIGADO!', cols));

  return lines.join('\n');
}

export default async function ReciboPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createCRMServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/crm/login');

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
    .select('*')
    .eq('sale_id', id)
    .order('created_at');

  const operatorName = sale.author?.full_name ?? '—';
  const reciboText = buildRecibo(sale, items ?? [], operatorName);

  return (
    <div className="space-y-4">
      {/* Auto-print dispara window.print() 1x apos carregar (400ms) */}
      <AutoPrint />

      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link
            href={`/admin/crm/vendas/${sale.id}`}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            ← Detalhes da venda
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Recibo</h1>
          <p className="text-sm text-slate-500">
            Janela aberta automaticamente — impressão deve ter disparado.
            Se cancelou, clique em <strong>Imprimir novamente</strong>.
          </p>
        </div>
        <ReciboPrintButton />
      </div>

      {/* Preview do recibo */}
      <div className="mx-auto max-w-md rounded border border-slate-300 bg-white p-4 shadow-sm">
        <pre className="whitespace-pre font-mono text-xs leading-tight text-black">
          {reciboText}
        </pre>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 4mm !important; }
          main { max-width: none !important; padding: 0 !important; }
          div[class*="space-y"] > *:not(.no-print):not(pre):not(div) { display: none !important; }
          div[class*="rounded"][class*="border"][class*="bg-white"] {
            box-shadow: none !important;
            border: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
          }
          pre {
            font-family: 'Courier New', monospace !important;
            font-size: 8pt !important;
            line-height: 1.1 !important;
            white-space: pre !important;
            color: black !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
