'use client';

import { EscPosBuilder, wrapText } from '@/lib/escpos';
import { PrintAgentButton } from '@/app/admin/components/PrintAgentButton';

const WIDTH = 32; // chars por linha (58mm @ 12cpi), mesma largura do fallback em texto puro

export function EscPosLabelButton({
  createdStr,
  shortId,
  customerName,
  customerPhone,
  equipmentLine,
  defect,
}: {
  createdStr: string;
  shortId: string;
  customerName: string;
  customerPhone?: string;
  equipmentLine?: string;
  defect?: string;
}) {
  function buildPayload(): Uint8Array {
    const b = new EscPosBuilder().init();

    // Margem de rasgo
    b.feed(3);

    // Header: loja + data
    b.align('left').bold(true).text('CYBER INFORMATICA');
    b.align('right').text(createdStr).blank();
    b.align('left').bold(false);
    b.divider('=', WIDTH);

    // OS em destaque, grande
    b.align('center').bold(true).line(shortId).bold(false);
    b.blank();

    // Cliente
    b.align('left').bold(true).line('[CLIENTE]').bold(false);
    b.line(customerName);
    if (customerPhone) b.line('Tel: ' + customerPhone);
    b.blank(2);

    // Aparelho
    if (equipmentLine) {
      b.bold(true).line('[APARELHO]').bold(false);
      for (const l of wrapText(equipmentLine, WIDTH)) b.line(l);
      b.blank(2);
    }

    // Defeito
    if (defect) {
      b.bold(true).line('[DEFEITO]').bold(false);
      for (const l of wrapText(defect, WIDTH)) b.line(l);
    }

    b.divider('-', WIDTH);
    b.feed(3);
    b.cut(true);

    return b.toBytes();
  }

  return (
    <PrintAgentButton
      label="Imprimir na MPT-II (Bluetooth)"
      buildPayload={buildPayload}
      className="mt-3 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
    />
  );
}
