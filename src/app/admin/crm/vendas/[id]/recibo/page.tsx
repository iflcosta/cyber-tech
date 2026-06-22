import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createCRMServerClient } from '@/app/admin/crm/lib/supabase/server';
import { ReciboPrintButton } from './ReciboPrintButton';

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
  // "R$ 30,00" -> 8 chars pra coluna de valor
  return 'R$ ' + n.toFixed(2).replace('.', ',');
}

function buildRecibo(sale: any, items: any[], operatorName: string): string {
  const cols = 40; // largura MPT-II (58mm) — driver Generic / Text Only usa ~40 cols
  const eq = '='.repeat(cols);
  const dash = '-'.repeat(cols);
  const now = new Date(sale.created_at);
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const lines: string[] = [];
  lines.push(eq);
  lines.push(pad('CYBER INFORMATICA', cols));
  lines.push(eq);
  lines.push(pad('RECIBO DE VENDA', cols));
  lines.push('');
  lines.push(pad('Numero: ' + sale.sale_number, cols));
  lines.push(pad('Data:   ' + dateStr + '  ' + timeStr, cols));
  lines.push(eq);
  lines.push('');

  // Itens: nome (esq) + qty + preco (dir)
  lines.push(pad('ITEM', 24) + pad('QTY', 4) + pad('VALOR', 12, 'right'));
  lines.push(dash);
  for (const item of items) {
    const nome = norm(item.item_name).substring(0, 24).padEnd(24);
    const qty = String(item.quantity).padStart(4);
    const valor = fmtBRL(item.subtotal).padStart(12);
    lines.push(nome + qty + valor);
  }
  lines.push(dash);
  lines.push('');

  // Totais
  lines.push(pad('Subtotal:', 28) + pad(fmtBRL(sale.subtotal), 12, 'right'));
  if (sale.discount > 0) {
    lines.push(pad('Desconto:', 28) + pad('-' + fmtBRL(sale.discount), 12, 'right'));
  }
  lines.push(eq);
  lines.push(pad('TOTAL:', 28) + pad(fmtBRL(sale.total), 12, 'right'));
  lines.push(eq);
  lines.push('');

  // Pagamento e cliente
  const payLabel: Record<string, string> = {
    cash: 'Dinheiro',
    pix: 'PIX',
    card: 'Cartao',
    transfer: 'Transferencia',
    other: 'Outro',
  };
  lines.push(pad('Pagamento: ' + (payLabel[sale.payment_method] ?? sale.payment_method), cols));
  if (sale.customer_name) {
    lines.push(pad('Cliente: ' + norm(sale.customer_name).substring(0, 30), cols));
  }
  lines.push(pad('Operador: ' + norm(operatorName).substring(0, 30), cols));
  lines.push('');
  lines.push(eq);
  lines.push(pad('OBRIGADO PELA PREFERENCIA!', cols));
  lines.push(eq);
  lines.push('');
  lines.push(''); // margem inferior (mesmo truque da etiqueta)
  lines.push('');

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
            Clique em <strong>Imprimir</strong> para enviar à impressora (MPT-II ou outra).
          </p>
        </div>
        <ReciboPrintButton />
      </div>

      {/* Preview do recibo */}
      <div className="mx-auto max-w-md rounded border border-slate-300 bg-white p-4 shadow-sm">
        <pre className="whitespace-pre font-mono text-xs leading-snug text-black">
          {reciboText}
        </pre>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          main { max-width: none !important; padding: 0 !important; }
          div[class*="space-y"] { all: unset; }
          pre {
            font-family: 'Courier New', monospace !important;
            font-size: 10pt !important;
            line-height: 1.2 !important;
            white-space: pre !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
}
