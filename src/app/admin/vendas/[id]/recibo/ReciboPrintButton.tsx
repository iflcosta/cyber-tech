'use client';

import { useState } from 'react';
import { sendTextToPrintAgent } from '@/app/admin/lib/printAgent';

export function ReciboPrintButton({ reciboText }: { reciboText?: string }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handlePrint() {
    if (!reciboText) {
      window.print();
      return;
    }

    setStatus('sending');
    setErrorMsg(null);
    try {
      const res = await sendTextToPrintAgent(reciboText);
      if (res.ok) {
        setStatus('ok');
        setTimeout(() => setStatus('idle'), 2500);
      } else {
        setStatus('error');
        setErrorMsg(res.error);
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg((err as Error).message);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handlePrint}
        disabled={status === 'sending'}
        className="border border-zinc-950 bg-black px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-zinc-800 disabled:opacity-60 focus:outline-none cursor-pointer"
      >
        {status === 'sending'
          ? 'Enviando para MPT-II…'
          : status === 'ok'
          ? '✓ Enviado para MPT-II'
          : '🖨️ Imprimir na MPT-II'}
      </button>
      {status === 'error' && (
        <span className="font-mono text-[10px] text-red-600 max-w-[200px] text-right">
          {errorMsg || 'Erro de conexão com o agente'}
        </span>
      )}
    </div>
  );
}
