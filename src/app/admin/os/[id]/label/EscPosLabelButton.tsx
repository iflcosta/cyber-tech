'use client';

import { EscPosBuilder, wrapText } from '@/lib/escpos';
import { PrintAgentButton } from '@/app/admin/components/PrintAgentButton';

const WIDTH = 32; // chars por linha (58mm @ 12cpi) na MPT-II

export function EscPosLabelButton({
  createdStr,
  shortId,
  osNumber,
  customerName,
  customerPhone,
  equipmentLine,
  defect,
}: {
  createdStr: string;
  shortId: string;
  osNumber?: string;
  customerName: string;
  customerPhone?: string;
  equipmentLine?: string;
  defect?: string;
}) {
  function buildPayload(): Uint8Array {
    const b = new EscPosBuilder().init();

    // Margem de rasgo inicial
    b.feed(2);

    // Header: loja + data
    b.align('left').bold(true).line('CYBER INFORMATICA').bold(false);
    b.line('DATA: ' + createdStr);
    b.divider('=', WIDTH);

    // Número da OS em destaque (Fonte Dupla 2x nativa da MPT-II, sem precisar de QR Code)
    b.align('center').bold(true).doubleSize(true).line(shortId).doubleSize(false);
    if (osNumber && osNumber !== shortId) {
      b.line('OS #' + osNumber);
    }
    b.bold(false).align('left');
    b.divider('=', WIDTH);

    // Cliente
    b.bold(true).line('[CLIENTE]').bold(false);
    b.line(customerName.slice(0, WIDTH));
    if (customerPhone) b.line('Tel: ' + customerPhone);
    b.divider('-', WIDTH);

    // Aparelho
    if (equipmentLine) {
      b.bold(true).line('[EQUIPAMENTO]').bold(false);
      for (const l of wrapText(equipmentLine, WIDTH)) b.line(l);
      b.divider('-', WIDTH);
    }

    // Defeito
    if (defect) {
      b.bold(true).line('[SERVICO / DEFEITO]').bold(false);
      for (const l of wrapText(defect, WIDTH)) b.line(l);
      b.divider('-', WIDTH);
    }

    // Rodapé de rastreio em texto puro (compatível 100% com MPT-II sem QR)
    b.align('center');
    b.line('RASTREIO: cyberinformatica.tech');
    b.bold(true).line('CODIGO: ' + (osNumber || shortId)).bold(false);
    b.align('left');

    b.feed(4);
    b.cut(true);

    return b.toBytes();
  }

  return (
    <PrintAgentButton
      label="Imprimir na MPT-II (58mm)"
      buildPayload={buildPayload}
      className="bg-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 cursor-pointer"
    />
  );
}
