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
        className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-xs"
      />
      <button
        type="submit"
        className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 transition shadow-xs"
      >
        Buscar
      </button>
      <button
        type="button"
        onClick={() => apply({ low: lowActive ? null : '1' })}
        className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
          lowActive
            ? 'bg-amber-600 text-white border border-amber-600 shadow-xs'
            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        {lowActive ? '✓ Só Estoque Baixo' : 'Estoque Baixo'}
      </button>
      <button
        type="button"
        onClick={() => apply({ inactive: inactiveActive ? null : '1' })}
        className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
          inactiveActive
            ? 'bg-slate-800 text-white border border-slate-800'
            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        {inactiveActive ? '✓ Mostrando Inativos' : 'Ver Inativos'}
      </button>
    </form>
  );
}
