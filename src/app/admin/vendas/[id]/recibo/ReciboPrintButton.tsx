'use client';

export function ReciboPrintButton() {
  // Botao SEM autoFocus — auto-print ja eh chamado 1x pelo parent
  // ao carregar. Aqui fica so pra reimprimir manualmente.
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="border border-zinc-950 bg-black px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-zinc-800 focus:outline-none cursor-pointer"
    >
      🖨️ Imprimir novamente
    </button>
  );
}
