'use client';

import { useEffect } from 'react';

// Dispara impressão do recibo da MPT-II:
// 1. Tenta envio direto e silencioso para o print-agent local (http://localhost:9100)
// 2. Se o agente local não responder, faz fallback para window.print() no navegador
export function AutoPrint({ reciboText }: { reciboText?: string }) {
  useEffect(() => {
    let printedViaAgent = false;

    if (reciboText) {
      fetch('http://localhost:9100/print-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: reciboText,
        signal: AbortSignal.timeout(1200),
      })
        .then((res) => {
          if (res.ok) {
            printedViaAgent = true;
          } else {
            window.print();
          }
        })
        .catch(() => {
          // Fallback para impressão via diálogo do navegador
          window.print();
        });
      return;
    }

    const t = setTimeout(() => {
      if (!printedViaAgent) {
        try {
          window.print();
        } catch {}
      }
    }, 400);

    return () => clearTimeout(t);
  }, [reciboText]);

  return null;
}
