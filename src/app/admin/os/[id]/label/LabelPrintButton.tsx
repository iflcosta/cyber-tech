'use client';

export function LabelPrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="border border-zinc-950 bg-black px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-white hover:bg-zinc-800 cursor-pointer"
    >
      🏷️ Imprimir etiqueta
    </button>
  );
}
