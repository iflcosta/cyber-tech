'use client';

import { useEffect } from 'react';

// Componente invisivel que dispara window.print() 1x ao montar.
// Usado em pagina aberta via window.open() (gesto do user = permitido).
export function AutoPrint() {
  useEffect(() => {
    // Delay 400ms pra dar tempo de renderizar <pre> do recibo
    const t = setTimeout(() => {
      try {
        window.print();
      } catch {
        // silent
      }
    }, 400);
    return () => clearTimeout(t);
  }, []);
  return null;
}
