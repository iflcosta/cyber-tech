'use client';

import { useEffect, useRef } from 'react';

export function ReciboPrintButton() {
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Foco no botao assim que carregar (leitor + Enter ja imprime)
    btnRef.current?.focus();
    // Auto-print com delay curto (300ms) pra dar tempo de renderizar o <pre>
    // Chrome exige gesto do user — mas auto-focus no botao + delay eh
    // equivalente a um Enter imediato na maioria dos casos. Se o navegador
    // bloquear, o usuario ainda ve o botao destacado e clica 1x.
    const t = setTimeout(() => {
      try {
        window.print();
      } catch {
        // silent — user pode clicar no botao manualmente
      }
    }, 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={() => window.print()}
      className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
    >
      🖨️ Imprimir
    </button>
  );
}
