'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export function TestReceiptClient() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Recibo de teste 58mm (30 colunas)
  const cols = 28;
  const eq = '='.repeat(cols);
  const dash = '-'.repeat(cols);

  const lines = [
    eq,
    '     CYBER INFORMATICA     ',
    '    TESTE DE IMPRESSAO     ',
    eq,
    `DATA: ${dateStr} ${timeStr}`,
    'IMPRESSORA: MPT-II (58MM)',
    'DRIVER: Generic / Text Only',
    dash,
    'SISTEMA: CYBER ERP v2',
    'STATUS: CONECTADA E ATIVA',
    dash,
    'Teste de comunicacao direta',
    'com a impressora termica.',
    '',
    'Se este cupom saiu na sua',
    'MPT-II, a impressao esta',
    '100% FUNCIONANDO no balcao!',
    eq,
    '        OBRIGADO!          ',
    dash,
    '.', '.', '.', '.', '.', '.', '.'
  ];

  const receiptText = lines.join('\n');

  return (
    <div className="space-y-6">
      {/* Barra Superior - Oculta na Impressão */}
      <div className="print:hidden border-2 border-zinc-950 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/configuracoes"
              className="border-2 border-zinc-950 bg-white px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition"
            >
              ← Voltar para Configurações
            </Link>
            <div>
              <h1 className="font-mono text-base font-black uppercase text-zinc-950">
                Teste de Impressão MPT-II (Bobina 58mm)
              </h1>
              <p className="font-mono text-xs text-zinc-600">
                Emissão de cupom térmico via driver do Windows
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="border-2 border-zinc-950 bg-zinc-950 px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            🖨️ Imprimir na MPT-II Agora
          </button>
        </div>

        <div className="mt-3 border border-emerald-300 bg-emerald-50 p-2.5 text-xs text-emerald-950 font-mono">
          ✓ Esta impressão envia o recibo diretamente para a <strong>MPT-II</strong> através do Windows, sem depender de portas de rede ou agentes externos.
        </div>
      </div>

      {/* Estilos para Bobina Térmica 58mm */}
      <style jsx global>{`
        @media print {
          @page {
            size: 58mm auto;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            width: 58mm !important;
          }
          header, nav, .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      {/* Visualização do Cupom */}
      <div className="flex justify-center print:block print:m-0 print:p-0">
        <pre className="whitespace-pre-wrap border-2 border-dashed border-zinc-400 bg-white p-4 font-mono text-xs leading-tight text-zinc-950 shadow-sm print:border-none print:p-0 print:shadow-none w-[58mm] max-w-full">
          {receiptText}
        </pre>
      </div>
    </div>
  );
}
