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
  // MPT-II com Generic/Text Only:
  //   - wrap em ~30-31 chars VISUAIS (nao logicos)
  //   - colapsa multiplos espacos em 1 (padding visual nao acumula)
  // Solucao: cols=30 + remover coluna UNIT + usar 'Nx' no lugar de multiplicacao
  const cols = 30;
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
  // Header
  lines.push(eq);
  lines.push(padRecibo('CYBER INFORMATICA', cols));
  lines.push(padRecibo('RECIBO DE VENDA', cols));
  lines.push(eq);
  // Numero + data em linhas SEPARADAS (evita wrap)
  lines.push(padRecibo(sale.sale_number, cols));
  lines.push(padRecibo(dateStr + ' ' + timeStr, cols));
  lines.push(dash);
  // Cabecalho das colunas (sem UNIT - ambiguidade resolvida com 'Nx')
  lines.push(padRecibo('ITEM', 16) + padRecibo('QTD', 4) + padRecibo('TOTAL', 10, 'right'));
  lines.push(dash);
  // Itens: nome(16) + ' Nx' (4) + total(10, 'XX,XX') = 30
  for (const item of items) {
    const nome = normRecibo(item.item_name).substring(0, 16).padEnd(16);
    const qtd = `${item.quantity}x`.padStart(4);
    const sub = item.subtotal.toFixed(2).replace('.', ',').padStart(10);
    lines.push(nome + qtd + sub);
  }
  lines.push(dash);
  // Totais (subtotal so se tiver desconto)
  if (sale.discount > 0) {
    lines.push(padRecibo('Subtotal:', 20) + padRecibo(fmtBRLRecibo(sale.subtotal), 10, 'right'));
    lines.push(padRecibo('Desconto:', 20) + padRecibo('-' + fmtBRLRecibo(sale.discount), 10, 'right'));
  }
  lines.push(eq);
  lines.push(padRecibo('TOTAL:', 20) + padRecibo(fmtBRLRecibo(sale.total), 10, 'right'));
  lines.push(eq);
  // Pagamento + cliente (sem operador)
  lines.push(padRecibo('Pgto: ' + (payLabel[sale.payment_method] ?? sale.payment_method), cols));
  if (sale.customer_name) {
    lines.push(padRecibo('Cliente: ' + normRecibo(sale.customer_name).substring(0, 19), cols));
  }
  lines.push(padRecibo('OBRIGADO PELA PREFERENCIA!', cols));
  // Avanco de papel na MPT-II
  for (let i = 0; i < 8; i++) {
    lines.push('.');
  }

  return lines.join('\n') + '\n\n\n\n';
}
