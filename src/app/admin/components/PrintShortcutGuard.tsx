'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Guarda global contra disparo acidental de Ctrl+P em telas normais do ERP.
 * 
 * Evita que o operador aperte Ctrl+P sem querer no Dashboard ou listas,
 * o que faria a impressora térmica Knup ou MPT-II imprimir dezenas de páginas
 * fatiando o painel web em bobina térmica!
 */
export function PrintShortcutGuard() {
  const pathname = usePathname();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        const isPrintRoute =
          pathname?.includes('/label') ||
          pathname?.includes('/recibo') ||
          pathname?.includes('/nota') ||
          pathname?.includes('/print');

        if (!isPrintRoute) {
          e.preventDefault();
          e.stopPropagation();
          console.warn(
            '[PrintGuard] Ctrl+P bloqueado fora das rotas de impressão para proteger a bobina térmica.',
          );
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [pathname]);

  return null;
}
