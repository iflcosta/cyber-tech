import { formatDateBR, formatTimeBR } from '@/app/admin/lib/datetime';
import type { Sale, SaleItem } from '@/app/admin/types/database';

export interface ReciboItem extends SaleItem {
  stock_item?: {
    id?: string;
    internal_sku?: string | null;
    ean13?: string | null;
    brand?: string | null;
    model?: string | null;
  } | null;
  sku?: string | null;
}

// Remove acentos (driver da impressora térmica não renderiza UTF-8)
export function normRecibo(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function padRecibo(s: string, width: number, align: 'left' | 'right' = 'left'): string {
  if (s.length >= width) return s.substring(0, width);
  const spaces = ' '.repeat(width - s.length);
  return align === 'left' ? s + spaces : spaces + s;
}

export function centerText(s: string, width: number): string {
  if (s.length >= width) return s.substring(0, width);
  const total = width - s.length;
  const left = Math.floor(total / 2);
  const right = total - left;
  return ' '.repeat(left) + s + ' '.repeat(right);
}

export function fmtBRLRecibo(n: number): string {
  return 'R$ ' + n.toFixed(2).replace('.', ',');
}

export function getItemSku(item: ReciboItem): string {
  if (item.sku) return item.sku;
  if (item.stock_item?.internal_sku) return item.stock_item.internal_sku;
  if (item.stock_item?.ean13) return item.stock_item.ean13;
  const stockId = item.stock_item?.id || item.stock_item_id;
  if (stockId) {
    return `CY-${stockId.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
  }
  return '';
}

export function wrapText(text: string, maxLen: number): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const w of words) {
    if (!w) continue;
    if (!current) {
      current = w;
    } else if (current.length + 1 + w.length <= maxLen) {
      current += ' ' + w;
    } else {
      lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function buildReciboText(sale: Sale, items: ReciboItem[]): string {
  // MPT-II em bobina 58mm:
  // Largura máxima equilibrada: 30 caracteres.
  // Utiliza o espaço máximo útil (45mm dos 48mm imprimíveis),
  // mantendo margem segura simétrica nas duas laterais e sem quebra de linhas.
  const cols = 30;
  const eq = '='.repeat(cols);
  const dash = '-'.repeat(cols);
  const dotDash = '- '.repeat(Math.floor(cols / 2));
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

  // Header centralizado em 30 colunas
  lines.push(eq);
  lines.push(centerText('CYBER INFORMATICA', cols));
  lines.push(centerText('RECIBO DE VENDA', cols));
  lines.push(eq);

  // Numero + data
  lines.push(padRecibo(sale.sale_number, cols));
  lines.push(padRecibo(`${dateStr} ${timeStr}`, cols));
  lines.push(dash);

  // Cabecalho das colunas (ITEM alinhado à esquerda, TOTAL à direita)
  lines.push(padRecibo('ITEM', cols - 6) + padRecibo('TOTAL', 6, 'right'));
  lines.push(dash);

  // Itens: Nome completo (com quebra natural de linha) + SKU + Qtd/Total
  items.forEach((item, idx) => {
    if (idx > 0) lines.push(dotDash);

    // 1. Nome do item com wrap inteligente para caber sem cortar palavras
    const nameLines = wrapText(normRecibo(item.item_name), cols);
    for (const nl of nameLines) {
      lines.push(padRecibo(nl, cols));
    }

    // 2. SKU do item em linha dedicada
    const sku = getItemSku(item);
    if (sku) {
      lines.push(padRecibo(`SKU: ${normRecibo(sku)}`, cols));
    }

    // 3. Quantidade, valor unitário e total alinhados
    const unitFmt = item.unit_price.toFixed(2).replace('.', ',');
    const subFmt = item.subtotal.toFixed(2).replace('.', ',');
    const leftVal = `${item.quantity}x ${unitFmt}`;
    const rightVal = subFmt;

    if (leftVal.length + rightVal.length + 1 <= cols) {
      lines.push(padRecibo(leftVal, cols - rightVal.length) + rightVal);
    } else {
      lines.push(padRecibo(leftVal, cols));
      lines.push(padRecibo(rightVal, cols, 'right'));
    }
  });

  lines.push(dash);

  // Totais (subtotal se tiver desconto)
  if (sale.discount > 0) {
    const subVal = fmtBRLRecibo(sale.subtotal);
    lines.push(padRecibo('Subtotal:', cols - subVal.length) + subVal);

    const descVal = '-' + fmtBRLRecibo(sale.discount);
    lines.push(padRecibo('Desconto:', cols - descVal.length) + descVal);
  }

  lines.push(eq);
  const totVal = fmtBRLRecibo(sale.total);
  lines.push(padRecibo('TOTAL:', cols - totVal.length) + totVal);
  lines.push(eq);

  // Pagamento + cliente
  lines.push(padRecibo('Pgto: ' + (payLabel[sale.payment_method] ?? sale.payment_method), cols));
  if (sale.customer_name) {
    lines.push(padRecibo('Cliente: ' + normRecibo(sale.customer_name).substring(0, cols - 9), cols));
  }
  lines.push(dash);
  lines.push(centerText('OBRIGADO!', cols));

  // Avanco de papel na MPT-II para guilhotina/serrilha
  for (let i = 0; i < 6; i++) {
    lines.push('.');
  }

  return lines.join('\n') + '\n\n\n';
}
