'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Escuta bipagens do leitor de código de barras em QUALQUER tela do ERP.
 * Se o operador bipar um produto fora do PDV (ex: na tela de OS ou Estoque),
 * o sistema detecta a velocidade da digitação do leitor (<100ms por caractere)
 * e redireciona automaticamente para o PDV com o item adicionado ao carrinho!
 */
export function GlobalBarcodeScanner() {
  const router = useRouter();
  const pathname = usePathname();
  const bufferRef = useRef<string>('');
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Se o usuário estiver ativamente digitando em um formulário/input de texto, ignora
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }

      const now = Date.now();
      const timeDiff = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // Se passou mais de 120ms entre as teclas, reseta o buffer (foi digitação humana, não leitor)
      if (timeDiff > 120) {
        bufferRef.current = '';
      }

      if (e.key === 'Enter') {
        const scanned = bufferRef.current.trim();
        bufferRef.current = '';
        if (scanned.length >= 4) {
          e.preventDefault();
          // Dispara evento caso o PDV já esteja montado na tela
          window.dispatchEvent(new CustomEvent('cyber-barcode-scanned', { detail: scanned }));
          // Se não estiver na tela do PDV, navega até lá com o código bipado
          if (pathname !== '/admin/vender') {
            router.push(`/admin/vender?scan=${encodeURIComponent(scanned)}`);
          }
        }
      } else if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pathname, router]);

  return null;
}
