'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { sendTextToPrintAgent, checkPrintAgentStatus, getPrintAgentUrl } from '@/app/admin/lib/printAgent';

export function TestReceiptClient() {
  const [agentStatus, setAgentStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isPrinting, setIsPrinting] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Recibo de teste formatado para 58mm (bobina térmica ~26 colunas padrão)
  const cols = 26;
  const eq = '='.repeat(cols);
  const dash = '-'.repeat(cols);

  const lines = [
    eq,
    '    CYBER INFORMATICA     ',
    '   TESTE DE RECIBO PDV    ',
    eq,
    `DATA: ${dateStr} ${timeStr}`,
    'IMP: MPT-II (BOBINA 58MM)',
    'PORTA: USB006 · SPOOLER',
    'DRIVER: Generic / Text',
    dash,
    'SISTEMA: CYBER ERP v2',
    'STATUS: BALCAO OPERACIONAL',
    dash,
    'Impressao direta na MPT-II',
    'sem abrir janela e sem',
    'imprimir na Knup de rotulo!',
    eq,
    '        OBRIGADO!         ',
    dash,
    '.', '.', '.', '.', '.', '.', '.', '.'
  ];

  const receiptText = lines.join('\n') + '\n\n\n\n';

  useEffect(() => {
    verifyAgent();
  }, []);

  async function verifyAgent() {
    setAgentStatus('checking');
    const res = await checkPrintAgentStatus();
    setAgentStatus(res.ok ? 'online' : 'offline');
  }

  async function handlePrintMPT() {
    setIsPrinting(true);
    setFeedback(null);
    try {
      const res = await sendTextToPrintAgent(receiptText);
      if (res.ok) {
        setFeedback({
          ok: true,
          message: '✓ Cupom enviado com sucesso para a MPT-II! O papel deve estar saindo agora na bobina térmica.',
        });
      } else {
        setFeedback({
          ok: false,
          message: `Falha: ${res.error}`,
        });
      }
    } catch (err) {
      setFeedback({
        ok: false,
        message: `Erro ao enviar para MPT-II: ${(err as Error).message}`,
      });
    } finally {
      setIsPrinting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Barra Superior - Oculta na Impressão */}
      <div className="print:hidden border-2 border-zinc-950 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/configuracoes"
              className="border-2 border-zinc-950 bg-white px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition"
            >
              ← Voltar para Configurações
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-mono text-base font-black uppercase text-zinc-950">
                  Teste de Impressão MPT-II (58mm)
                </h1>
                <span
                  className={`px-2 py-0.5 font-mono text-[10px] font-bold uppercase border ${
                    agentStatus === 'online'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : agentStatus === 'checking'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-red-100 text-red-900 border-red-300'
                  }`}
                >
                  {agentStatus === 'online'
                    ? '🟢 Agente MPT-II Conectado'
                    : agentStatus === 'checking'
                    ? '🟡 Verificando Agente...'
                    : '🔴 Agente Não Detectado'}
                </span>
              </div>
              <p className="font-mono text-xs text-zinc-600">
                Dispositivo USB006 · Driver Generic / Text Only
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={verifyAgent}
              className="border-2 border-zinc-950 bg-white px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition cursor-pointer"
            >
              🔄 Verificar Conexão
            </button>
            <button
              type="button"
              onClick={handlePrintMPT}
              disabled={isPrinting}
              className="border-2 border-zinc-950 bg-zinc-950 px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 disabled:opacity-50 transition cursor-pointer"
            >
              {isPrinting ? 'Enviando para MPT-II…' : '🖨️ Imprimir na MPT-II Agora'}
            </button>
          </div>
        </div>

        {feedback && (
          <div
            className={`mt-4 border p-3 font-mono text-xs font-bold ${
              feedback.ok
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : 'bg-red-50 text-red-900 border-red-300'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {agentStatus === 'offline' && (
          <div className="mt-4 border-2 border-amber-400 bg-amber-50 p-3 font-mono text-xs text-amber-950 space-y-1.5">
            <p className="font-bold text-amber-900 uppercase">
              ⚠️ O Agente de Impressão local não respondeu em {getPrintAgentUrl()}
            </p>
            <p className="text-[11px] leading-relaxed">
              Como o Windows possui duas impressoras térmicas (a <strong>Knup</strong> de etiquetas 40x60mm e a <strong>MPT-II</strong> de bobina 58mm), o agente local é o componente que direciona as impressões diretamente para a MPT-II sem gastar etiquetas na Knup.
            </p>
            <p className="text-[11px] font-bold text-zinc-800 pt-1">
              Para ligar o agente de impressão:
            </p>
            <ul className="text-[11px] list-disc list-inside space-y-0.5 text-zinc-700">
              <li>O atalho de inicialização <code className="bg-white px-1 border border-zinc-300">CyberERP-PrintAgent.vbs</code> já está na inicialização do Windows.</li>
              <li>Ou abra o arquivo <code className="bg-white px-1 border border-zinc-300">print-agent/run.bat</code> na pasta do sistema.</li>
            </ul>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between border-t border-zinc-200 pt-3 text-xs text-zinc-600 font-mono">
          <span>
            ℹ️ A Knup KP-IM608 permanece como padrão do Windows para etiquetas, enquanto a MPT-II recebe os recibos via Agente.
          </span>
          <button
            type="button"
            onClick={() => window.print()}
            className="text-[11px] text-zinc-500 hover:text-zinc-950 underline cursor-pointer"
            title="Abre diálogo padrão do navegador (Atenção: Selecione manualmente a MPT-II)"
          >
            Opção alternativa: Imprimir via diálogo do navegador
          </button>
        </div>
      </div>

      {/* Estilos para Bobina Térmica 58mm caso imprima via navegador */}
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
        <div className="border-2 border-dashed border-zinc-400 bg-white p-4 shadow-sm w-[68mm] max-w-full">
          <p className="mb-2 text-center font-mono text-[10px] font-bold uppercase text-zinc-400">
            Prévia Física do Cupom 58mm
          </p>
          <pre className="whitespace-pre-wrap font-mono text-xs leading-tight text-zinc-950 print:border-none print:p-0 print:shadow-none">
            {receiptText}
          </pre>
        </div>
      </div>
    </div>
  );
}
