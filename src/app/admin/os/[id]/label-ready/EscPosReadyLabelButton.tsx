'use client';

import { EscPosBuilder, wrapText } from '@/lib/escpos';
import { PrintAgentButton } from '@/app/admin/components/PrintAgentButton';

const WIDTH = 32; // chars por linha (58mm @ 12cpi) na MPT-II

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function EscPosReadyLabelButton({
  readyDateStr,
  shortId,
  osNumber,
  customerName,
  customerPhone,
  equipmentLine,
  repairNotes,
  laborCost = 0,
  partsTotal = 0,
  grandTotal = 0,
  isPaid = false,
  remainingToPay = 0,
  accessoriesInfo,
}: {
  readyDateStr: string;
  shortId: string;
  osNumber?: string;
  customerName: string;
  customerPhone?: string;
  equipmentLine?: string;
  repairNotes?: string;
  laborCost?: number;
  partsTotal?: number;
  grandTotal?: number;
  isPaid?: boolean;
  remainingToPay?: number;
  accessoriesInfo?: string;
}) {
  function buildPayload(): Uint8Array {
    const b = new EscPosBuilder().init();

    // Margem de rasgo inicial
    b.feed(2);

    // Cabeçalho da loja
    b.align('center').bold(true).line('CYBER INFORMATICA').bold(false);
    b.line('APARELHO PRONTO P/ RETIRADA');
    b.line('CONCLUIDO EM: ' + readyDateStr);
    b.divider('=', WIDTH);

    // Número da OS em fonte dupla
    b.align('center').bold(true).doubleSize(true).line(shortId).doubleSize(false);
    if (osNumber && osNumber !== shortId) {
      b.line('OS #' + osNumber);
    }
    b.bold(false).align('left');
    b.divider('=', WIDTH);

    // Dados do Cliente
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

    // Serviço Realizado / Informações Finais
    if (repairNotes) {
      b.bold(true).line('[SERVICO REALIZADO]').bold(false);
      for (const l of wrapText(repairNotes, WIDTH)) b.line(l);
      b.divider('-', WIDTH);
    }

    // Valores do Serviço
    b.bold(true).line('[VALORES / FINANCEIRO]').bold(false);
    if (laborCost > 0) {
      b.line(`Mao de Obra: ${fmtBRL(laborCost)}`);
    }
    if (partsTotal > 0) {
      b.line(`Pecas:       ${fmtBRL(partsTotal)}`);
    }

    // Total em destaque
    b.bold(true).doubleSize(true);
    b.line(`TOTAL: ${fmtBRL(grandTotal)}`);
    b.doubleSize(false).bold(false);

    // Situação do pagamento
    if (isPaid) {
      b.bold(true).line('SITUACAO: [ ✓ TOTAL PAGO ]').bold(false);
    } else if (remainingToPay > 0 && remainingToPay < grandTotal) {
      b.bold(true).line(`SINAL PAGO: ${fmtBRL(grandTotal - remainingToPay)}`).bold(false);
      b.bold(true).line(`A PAGAR:    ${fmtBRL(remainingToPay)}`).bold(false);
    } else {
      b.bold(true).line(`A PAGAR NA RETIRADA: ${fmtBRL(grandTotal)}`).bold(false);
    }
    b.divider('-', WIDTH);

    // Acessórios a devolver
    if (accessoriesInfo) {
      b.bold(true).line(`DEVOLVER: ${accessoriesInfo}`).bold(false);
      b.divider('-', WIDTH);
    }

    // Garantia e rodapé
    b.align('center');
    b.line('Garantia legal: 90 dias');
    b.line('Rastreio: cyberinformatica.tech');
    b.bold(true).line('CODIGO OS: ' + (osNumber || shortId)).bold(false);
    b.align('left');

    b.feed(4);
    b.cut(true);

    return b.toBytes();
  }

  return (
    <PrintAgentButton
      label="🖨️ Imprimir na MPT-II (Bluetooth 58mm)"
      buildPayload={buildPayload}
      className="bg-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 cursor-pointer"
    />
  );
}
