'use client';

import { EscPosBuilder, wrapText } from '@/lib/escpos';
import { PrintAgentButton } from '@/app/admin/components/PrintAgentButton';

const WIDTH = 30; // mesma largura do fallback em texto puro

export type ReciboPart = { name: string; qty: number; subtotal: string };

export function EscPosReciboButton({
  osNumber,
  dateStr,
  customerName,
  equipmentLine,
  serviceText,
  parts,
  partsTotal,
  laborCost,
  grandTotal,
  warrantyEndStr,
  deliveredToName,
}: {
  osNumber: string;
  dateStr: string;
  customerName: string;
  equipmentLine?: string;
  serviceText: string;
  parts: ReciboPart[];
  partsTotal: string;
  laborCost: string;
  grandTotal: string;
  warrantyEndStr: string;
  deliveredToName?: string | null;
}) {
  function buildPayload(): Uint8Array {
    const b = new EscPosBuilder().init();

    b.align('center').bold(true).line('CYBER INFORMATICA');
    b.line('RECIBO DE ENTREGA').bold(false);
    b.divider('=', WIDTH);
    b.align('left');
    b.bold(true).line(osNumber).bold(false);
    b.line(dateStr);
    b.divider('-', WIDTH);

    b.bold(true).line('CLIENTE:').bold(false);
    b.line(customerName);
    if (equipmentLine) {
      b.bold(true).line('APARELHO:').bold(false);
      for (const l of wrapText(equipmentLine, WIDTH)) b.line(l);
    }
    b.divider('-', WIDTH);

    b.bold(true).line('SERVICO:').bold(false);
    for (const l of wrapText(serviceText, WIDTH)) b.line(l);
    b.divider('-', WIDTH);

    if (parts.length > 0) {
      b.bold(true).line('PECAS:').bold(false);
      for (const p of parts) {
        const nome = p.name.slice(0, 16).padEnd(16);
        const qtd = `${p.qty}x`.padStart(4);
        const sub = p.subtotal.padStart(10);
        b.line(nome + qtd + sub);
      }
      b.divider('-', WIDTH);
    }

    b.line('PECAS:'.padEnd(20) + partsTotal.padStart(10));
    b.line('MAO DE OBRA:'.padEnd(20) + laborCost.padStart(10));
    b.divider('=', WIDTH);
    b.bold(true).line('TOTAL:'.padEnd(20) + grandTotal.padStart(10)).bold(false);
    b.divider('=', WIDTH);

    b.align('center');
    b.line('GARANTIA: 90 DIAS');
    b.line('ATE ' + warrantyEndStr);
    b.line('Defeitos do reparo executado.');
    b.line('Nao cobre mau uso, queda ou');
    b.line('abertura por terceiros.');
    b.align('left');
    b.divider('-', WIDTH);

    if (deliveredToName) {
      b.bold(true).line('RETIRADO POR:').bold(false);
      b.line(deliveredToName);
      b.divider('-', WIDTH);
    }

    b.line('Assinatura do cliente:');
    b.blank(2);
    b.line('_'.repeat(WIDTH));
    b.divider('-', WIDTH);
    b.align('center').bold(true).line('OBRIGADO!').bold(false);

    b.feed(3);
    b.cut(true);

    return b.toBytes();
  }

  return (
    <PrintAgentButton
      label="Imprimir na MPT-II (Bluetooth)"
      buildPayload={buildPayload}
      className="w-full rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
    />
  );
}
