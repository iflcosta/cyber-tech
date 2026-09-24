'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface NotaVendaActionButtonsProps {
  saleId: string;
  saleNumber: string;
  customerName: string;
  customerPhone?: string | null;
  total: number;
}

export function NotaVendaActionButtons({
  saleId,
  saleNumber,
  customerName,
  customerPhone,
  total,
}: NotaVendaActionButtonsProps) {
  useEffect(() => {
    const previousTitle = document.title;
    const safeCustomer = customerName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    document.title = `Nota-${saleNumber}-${safeCustomer || 'Cliente'}`;
    return () => {
      document.title = previousTitle;
    };
  }, [saleNumber, customerName]);

  function handlePrint() {
    window.print();
  }

  function handleWhatsApp() {
    const digits = (customerPhone ?? '').replace(/\D/g, '');
    const phoneWithCountry = digits.startsWith('55') ? digits : digits ? `55${digits}` : '';
    const valorFormatado = total.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    const message = [
      `Olá *${customerName}*! Aqui é da *Cyber Informática*.`,
      ``,
      `Segue o comprovante / nota de compra da sua venda (*${saleNumber}*):`,
      `• *Valor Total:* ${valorFormatado} (QUITADO)`,
      `• *Garantia Legal de Balcão:* 90 dias conforme Art. 26 do CDC`,
      ``,
      `Agradecemos a sua compra! O documento em PDF pode ser salvo para seus registros.`,
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
            📄 Comprovante / Nota de Venda para o Cliente (PDF / A4)
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
            href={`/admin/vendas/${saleId}/recibo`}
            target="_blank"
            className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            🧾 Cupom 58mm
          </Link>

          <Link
            href={`/admin/vendas/${saleId}`}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            ← Voltar para Venda
          </Link>
        </div>
      </div>
    </div>
  );
}
