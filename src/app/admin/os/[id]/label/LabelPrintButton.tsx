'use client';

export function LabelPrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="mt-3 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
    >
      🏷️ Imprimir etiqueta
    </button>
  );
}
