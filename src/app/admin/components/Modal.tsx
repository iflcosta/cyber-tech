'use client';

import { useEffect, useId, useRef } from 'react';

/**
 * Wrapper acessível pros diálogos de confirmação do sistema (desativar
 * item, apagar OS, zerar estoque, cancelar venda) — hoje cada um
 * montava seu próprio `fixed inset-0 ...` na mão, sem role="dialog",
 * sem aria-modal, sem mover foco pro diálogo quando abre e sem Esc
 * pra fechar. Pra quem usa leitor de tela, a "janela" simplesmente
 * não existia — o conteúdo por trás continuava navegável e o diálogo
 * nunca era anunciado.
 *
 * Uso:
 *   <Modal open={open} onClose={() => setOpen(false)} titleId="minha-id">
 *     <h2 id="minha-id">Título</h2>
 *     ...
 *   </Modal>
 */
export function Modal({
  open,
  onClose,
  titleId: providedTitleId,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** id do elemento de título (h2 etc) dentro do children, pro aria-labelledby. */
  titleId?: string;
  children: React.ReactNode;
}) {
  const generatedId = useId();
  const titleId = providedTitleId ?? generatedId;
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    // Move o foco pro diálogo assim que abre — sem isso, o foco fica
    // parado no botão que abriu, atrás do overlay. Mas se algum campo
    // lá dentro já tem autoFocus e pegou o foco sozinho primeiro,
    // respeita — não rouba de volta pro container.
    if (!dialogRef.current?.contains(document.activeElement)) {
      dialogRef.current?.focus();
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        // Trava o foco dentro do diálogo (Tab no último elemento
        // volta pro primeiro, e vice-versa com Shift+Tab) — sem
        // isso, Tab escapa pro conteúdo por trás do overlay.
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl outline-none"
      >
        {children}
      </div>
    </div>
  );
}
