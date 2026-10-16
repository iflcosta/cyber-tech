'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Atalhos globais de teclado para navegação veloz no balcão:
 * - F2: Abrir PDV / Nova Venda (quando fora do PDV)
 * - F3: Nova Ordem de Serviço
 * - F4: Bancada de OS
 *
 * Ignora quando o usuário estiver digitando em campos de formulário.
 */
export function GlobalShortcuts() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Se estiver digitando em campo de texto, não intercepta
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'F2') {
        // Se já estiver no PDV, o próprio PDV usa F2 para finalizar PIX
        if (pathname !== '/admin/vender') {
          e.preventDefault();
          router.push('/admin/vender');
        }
      } else if (e.key === 'F3') {
        // Se estiver no PDV com itens no carrinho, o PDV usa F3 para finalizar Dinheiro
        if (pathname !== '/admin/vender') {
          e.preventDefault();
          router.push('/admin/os/new');
        }
      } else if (e.key === 'F4') {
        // Se estiver no PDV com itens no carrinho, o PDV usa F4 para finalizar Cartão
        if (pathname !== '/admin/vender') {
          e.preventDefault();
          router.push('/admin/os');
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pathname, router]);

  return null;
}
