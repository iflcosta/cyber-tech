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
        placeholder="Buscar no catálogo: nome, código de barras (EAN-13), SKU interno, marca…"
        aria-label="Buscar no catálogo: nome, código de barras, SKU interno, marca"
        className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner"
      />
      <button
        type="submit"
        className="rounded-lg bg-white px-4 py-2 text-xs font-mono font-bold text-zinc-950 hover:bg-zinc-200 transition shadow"
      >
        Buscar
      </button>
      <button
        type="button"
        onClick={() => apply({ low: lowActive ? null : '1' })}
        className={`rounded-lg px-3 py-2 text-xs font-mono font-medium transition ${
          lowActive
            ? 'bg-amber-600 text-white border border-amber-500 shadow-sm'
            : 'border border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
        }`}
      >
        {lowActive ? '✓ Só Estoque Baixo' : 'Estoque Baixo'}
      </button>
      <button
        type="button"
        onClick={() => apply({ inactive: inactiveActive ? null : '1' })}
        className={`rounded-lg px-3 py-2 text-xs font-mono font-medium transition ${
          inactiveActive
            ? 'bg-zinc-700 text-white border border-zinc-600'
            : 'border border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
        }`}
      >
        {inactiveActive ? '✓ Mostrando Inativos' : 'Ver Inativos'}
      </button>
    </form>
  );
}
