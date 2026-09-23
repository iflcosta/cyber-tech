'use client';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-md bg-black px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-800"
    >
      🖨️ Imprimir agora
    </button>
  );
}
