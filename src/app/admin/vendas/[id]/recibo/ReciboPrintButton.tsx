'use client';

export function ReciboPrintButton() {
  // Botao SEM autoFocus — auto-print ja eh chamado 1x pelo parent
  // ao carregar. Aqui fica so pra reimprimir manualmente.
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
    >
      🖨️ Imprimir novamente
    </button>
  );
}
