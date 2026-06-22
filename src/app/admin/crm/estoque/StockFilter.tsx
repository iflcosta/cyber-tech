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
      router.push(`/admin/crm/estoque?${params.toString()}`);
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
        placeholder="Buscar por nome, marca, modelo, EAN…"
        className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="rounded-md bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
      >
        Buscar
      </button>
      <button
        type="button"
        onClick={() => apply({ low: lowActive ? null : '1' })}
        className={`rounded-md px-3 py-2 text-sm font-medium ${
          lowActive
            ? 'bg-orange-600 text-white hover:bg-orange-700'
            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
        }`}
      >
        {lowActive ? '✓ Estoque baixo' : 'Estoque baixo'}
      </button>
      <button
        type="button"
        onClick={() => apply({ inactive: inactiveActive ? null : '1' })}
        className={`rounded-md px-3 py-2 text-sm font-medium ${
          inactiveActive
            ? 'bg-slate-600 text-white hover:bg-slate-700'
            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
        }`}
      >
        {inactiveActive ? '✓ Inativos' : 'Mostrar inativos'}
      </button>
    </form>
  );
}
