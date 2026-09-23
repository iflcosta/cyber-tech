'use client';

export function LabelPrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-md bg-black px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-800"
    >
      🏷️ Imprimir etiqueta
    </button>
  );
}
