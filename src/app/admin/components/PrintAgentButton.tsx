'use client';

import { useState } from 'react';
import { getPrintAgentUrl, setPrintAgentUrl, sendToPrintAgent } from '@/app/admin/lib/printAgent';

type Status = 'idle' | 'sending' | 'ok' | 'error';

export function PrintAgentButton({
  label,
  buildPayload,
  className,
}: {
  label: string;
  buildPayload: () => Uint8Array;
  className?: string;
}) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handlePrint() {
    setStatus('sending');
    setError(null);
    const bytes = buildPayload();
    const result = await sendToPrintAgent(bytes);
    if (result.ok) {
      setStatus('ok');
      setTimeout(() => setStatus('idle'), 2500);
    } else {
      setStatus('error');
      setError(result.error);
    }
  }

  function handleConfigure() {
    const current = getPrintAgentUrl();
    const next = window.prompt(
      'Endereço do agente de impressão local (rodando no PC da bancada):',
      current
    );
    if (next && next.trim()) setPrintAgentUrl(next);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handlePrint}
        disabled={status === 'sending'}
        className={
          className ??
          'rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60'
        }
      >
        {status === 'sending' ? 'Enviando…' : `🖨️ ${label}`}
      </button>
      <button
        type="button"
        onClick={handleConfigure}
        title="Configurar endereço do agente de impressão"
        aria-label="Configurar agente de impressão"
        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-600"
      >
        ⚙️
      </button>
      {status === 'ok' && <span className="text-xs font-medium text-emerald-600">Enviado ✓</span>}
      {status === 'error' && error && (
        <span className="w-full text-xs text-red-600">{error}</span>
      )}
    </div>
  );
}
