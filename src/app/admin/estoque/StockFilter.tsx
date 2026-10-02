'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

export function StockFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [, startTransition] = useTransition();

  function apply(extra: Record<string, string | null> = {}) {
    const params = new URLSearchParams(searchParams.toString());
    if (q.trim()) params.set('q', q.trim());
    else params.delete('q');
    for (const [k, v] of Object.entries(extra)) {
      if (v === null) params.delete(k);
      else params.set(k, v);
    }
    startTransition(() => {
      router.push(`/admin/estoque?${params.toString()}`);
    });
  }

  const lowActive = searchParams.get('low') === '1';
  const inactiveActive = searchParams.get('inactive') === '1';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar no catálogo: nome, código de barras (EAN-13), SKU interno, prateleira, marca…"
        aria-label="Buscar no catálogo: nome, código de barras, SKU interno, marca"
        className="flex-1 border border-zinc-300 bg-white px-3.5 py-2 text-sm font-mono text-zinc-950 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 shadow-sm"
      />
      <button
        type="submit"
        className="border-2 border-zinc-950 bg-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition shadow-sm"
      >
        Buscar
      </button>
      <button
        type="button"
        onClick={() => apply({ low: lowActive ? null : '1' })}
        className={`px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider transition ${
          lowActive
            ? 'border-2 border-amber-600 bg-amber-600 text-white shadow-sm'
            : 'border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-950 hover:bg-zinc-100'
        }`}
      >
        {lowActive ? '✓ Só Estoque Baixo' : 'Estoque Baixo'}
      </button>
      <button
        type="button"
        onClick={() => apply({ inactive: inactiveActive ? null : '1' })}
        className={`px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider transition ${
          inactiveActive
            ? 'border-2 border-zinc-950 bg-zinc-950 text-white shadow-sm'
            : 'border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-950 hover:bg-zinc-100'
        }`}
      >
        {inactiveActive ? '✓ Mostrando Inativos' : 'Ver Inativos'}
      </button>
    </form>
  );
}
