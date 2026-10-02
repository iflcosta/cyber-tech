import { formatDateBR, formatTimeBR } from '@/app/admin/lib/datetime';
import type { Sale, SaleItem } from '@/app/admin/types/database';

// Remove acentos (driver Generic / Text Only da MPT-II não renderiza UTF-8)
export function normRecibo(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function padRecibo(s: string, width: number, align: 'left' | 'right' = 'left'): string {
  if (s.length >= width) return s.substring(0, width);
  const spaces = ' '.repeat(width - s.length);
  return align === 'left' ? s + spaces : spaces + s;
}

export function fmtBRLRecibo(n: number): string {
  return 'R$ ' + n.toFixed(2).replace('.', ',');
}

export function buildReciboText(sale: Sale, items: SaleItem[]): string {
  // MPT-II com Generic / Text Only em bobina 58mm:
  // Largura máxima imprimível física sem quebra de linha: 22 caracteres
  const cols = 22;
  const eq = '='.repeat(cols);
  const dash = '-'.repeat(cols);
  const dateStr = formatDateBR(sale.created_at);
  const timeStr = formatTimeBR(sale.created_at);

  const payLabel: Record<string, string> = {
    cash: 'Dinheiro',
    pix: 'PIX',
    card: 'Cartao',
    transfer: 'Transferencia',
    other: 'Outro',
  };

  const lines: string[] = [];
  // Header centralizado em 22 colunas
  lines.push(eq);
  lines.push('  CYBER INFORMATICA   ');
  lines.push('   RECIBO DE VENDA    ');
  lines.push(eq);

  // Numero + data em linhas SEPARADAS (evita wrap)
  lines.push(padRecibo(sale.sale_number, cols));
  lines.push(padRecibo(`${dateStr} ${timeStr}`, cols));
  lines.push(dash);

  // Cabecalho das colunas (ITEM 10 + QTD 4 + TOTAL 8 = 22)
  lines.push(padRecibo('ITEM', 10) + padRecibo('QTD', 4) + padRecibo('TOTAL', 8, 'right'));
  lines.push(dash);

  // Itens: nome(10) + qtd(4) + total(8)
  for (const item of items) {
    const nome = normRecibo(item.item_name).substring(0, 10).padEnd(10);
    const qtd = `${item.quantity}x`.padStart(4);
    const sub = item.subtotal.toFixed(2).replace('.', ',').padStart(8);
    lines.push(nome + qtd + sub);
  }
  lines.push(dash);

  // Totais (subtotal so se tiver desconto)
  if (sale.discount > 0) {
    lines.push(padRecibo('Subtotal:', 12) + padRecibo(fmtBRLRecibo(sale.subtotal), 10, 'right'));
    lines.push(padRecibo('Desconto:', 12) + padRecibo('-' + fmtBRLRecibo(sale.discount), 10, 'right'));
  }
  lines.push(eq);
  lines.push(padRecibo('TOTAL:', 10) + padRecibo(fmtBRLRecibo(sale.total), 12, 'right'));
  lines.push(eq);

  // Pagamento + cliente
  lines.push(padRecibo('Pgto: ' + (payLabel[sale.payment_method] ?? sale.payment_method), cols));
  if (sale.customer_name) {
    lines.push(padRecibo('Cliente: ' + normRecibo(sale.customer_name).substring(0, 13), cols));
  }
  lines.push(dash);
  lines.push('      OBRIGADO!       ');

  // Avanco de papel na MPT-II para guilhotina/serrilha
  for (let i = 0; i < 8; i++) {
    lines.push('.');
  }

  return lines.join('\n') + '\n\n\n\n';
}
