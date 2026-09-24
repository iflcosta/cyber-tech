'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ReciboActionButtonsProps {
  osId: string;
  osNumber: string;
  customerName: string;
  customerPhone?: string | null;
  grandTotal: number;
  warrantyEndFormatted: string;
  isPaid: boolean;
}

export function ReciboActionButtons({
  osId,
  osNumber,
  customerName,
  customerPhone,
  grandTotal,
  warrantyEndFormatted,
  isPaid,
}: ReciboActionButtonsProps) {
  useEffect(() => {
    const previousTitle = document.title;
    const safeCustomer = customerName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    document.title = `Nota-${osNumber}-${safeCustomer || 'Cliente'}`;
    return () => {
      document.title = previousTitle;
    };
  }, [osNumber, customerName]);

  function handlePrint() {
    window.print();
  }

  function handleWhatsApp() {
    const digits = (customerPhone ?? '').replace(/\D/g, '');
    const phoneWithCountry = digits.startsWith('55') ? digits : digits ? `55${digits}` : '';
    const valorFormatado = grandTotal.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    const statusPgto = isPaid ? 'QUITADO' : 'Pendente';

    const message = [
      `Olá *${customerName}*! Aqui é da *Cyber Informática*.`,
      ``,
      `Segue o resumo da sua Nota de Serviço / Garantia (*${osNumber}*):`,
      `• *Valor Total:* ${valorFormatado} (${statusPgto})`,
      `• *Garantia Legal:* 90 dias (válida até ${warrantyEndFormatted})`,
      ``,
      `Estamos enviando o documento completo em PDF logo abaixo. Obrigado pela preferência!`,
    ].join('\n');

    const encoded = encodeURIComponent(message);
    const url = phoneWithCountry
      ? `https://wa.me/${phoneWithCountry}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="print:hidden mb-6 rounded-lg border border-zinc-300 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-1.5">
            📄 Nota de Serviço / Comprovante para o Cliente (PDF / A4)
          </h2>
          <p className="mt-0.5 text-xs text-zinc-600">
            Clique em <strong>Salvar como PDF / Imprimir</strong> e selecione <em>&quot;Salvar como PDF&quot;</em> no destino da impressora para gerar o arquivo `.pdf`.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-md bg-black px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            🖨️ Salvar como PDF / Imprimir
          </button>

          <button
            type="button"
            onClick={handleWhatsApp}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            📲 Abrir WhatsApp do Cliente
          </button>

          <Link
            href={`/admin/os/${osId}/recibo/mpt`}
            target="_blank"
            className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            🧾 Cupom 58mm
          </Link>

          <Link
            href={`/admin/os/${osId}`}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            ← Voltar para OS
          </Link>
        </div>
      </div>
    </div>
  );
}
