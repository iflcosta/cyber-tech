'use client';

import { useEffect, useState } from 'react';
import { sendTextToPrintAgent } from '@/app/admin/lib/printAgent';

// Dispara impressão automática do recibo na MPT-II (58mm) via print-agent local
export function AutoPrint({ reciboText }: { reciboText?: string }) {
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!reciboText) return;

    sendTextToPrintAgent(reciboText)
      .then((res) => {
        if (!res.ok) {
          setErrorNotice(res.error);
        }
      })
      .catch((err) => {
        setErrorNotice(err.message || 'Erro ao comunicar com impressora MPT-II');
      });
  }, [reciboText]);

  if (!errorNotice) return null;

  return (
    <div className="no-print mb-4 border-2 border-amber-400 bg-amber-50 p-3 font-mono text-xs text-amber-950 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="font-bold uppercase text-amber-900">⚠️ Agente de Impressão MPT-II Offline</p>
        <p className="text-[11px] text-zinc-700">
          O recibo não pôde ser enviado diretamente para a MPT-II. Certifique-se de que o agente local está em execução.
        </p>
      </div>
      <button
        type="button"
        onClick={() => window.print()}
        className="shrink-0 border border-zinc-950 bg-white px-3 py-1.5 font-bold uppercase text-[11px] hover:bg-zinc-100 cursor-pointer"
        title="Atenção: Selecione manualmente a impressora MPT-II no diálogo"
      >
        Imprimir via Diálogo
      </button>
    </div>
  );
}
