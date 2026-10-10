'use client';

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="border-2 border-zinc-950 bg-zinc-950 px-5 py-2 font-mono text-xs font-black uppercase tracking-wider text-white hover:bg-zinc-800 transition shadow-xs flex items-center gap-2 cursor-pointer"
    >
      <span>🖨️</span> Imprimir Termo A4 / Salvar PDF
    </button>
  );
}
