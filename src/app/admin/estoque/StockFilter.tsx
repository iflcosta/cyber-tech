'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { STOCK_CATEGORY_SUGGESTIONS } from '@/app/admin/types/database';
import { CATEGORY_ICONS } from './lib/categoryDetector';

export function StockFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [, startTransition] = useTransition();

  const selectedCategory = searchParams.get('category');
  const lowActive = searchParams.get('low') === '1';
  const inactiveActive = searchParams.get('inactive') === '1';

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

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    apply({ category: val ? val : null });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="space-y-2"
    >
      <div className="flex flex-wrap items-center gap-2">
        {/* Seletor Rápido de Categoria no formulário */}
        <div className="w-full sm:w-56 shrink-0">
          <select
            value={selectedCategory ?? ''}
            onChange={handleCategoryChange}
            className="w-full border border-zinc-300 bg-white px-3 py-2 text-xs font-mono font-bold text-zinc-950 focus:border-zinc-950 focus:outline-none shadow-sm"
          >
            <option value="">Todas as Categorias</option>
            <option value="none">⚠️ Apenas Sem Categoria</option>
            <optgroup label="Categorias do Catálogo">
              {STOCK_CATEGORY_SUGGESTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_ICONS[cat] || '📦'} {cat}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Input de Busca Textual */}
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar no catálogo: nome, código de barras (EAN-13), SKU interno, prateleira, marca…"
            aria-label="Buscar no catálogo: nome, código de barras, SKU interno, marca"
            className="w-full border border-zinc-300 bg-white px-3.5 py-2 text-sm font-mono text-zinc-950 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 shadow-sm"
          />
        </div>

        <button
          type="submit"
          className="border-2 border-zinc-950 bg-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition shadow-sm cursor-pointer"
        >
          Buscar
        </button>

        <button
          type="button"
          onClick={() => apply({ low: lowActive ? null : '1' })}
          className={`px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
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
          className={`px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
            inactiveActive
              ? 'border-2 border-zinc-950 bg-zinc-950 text-white shadow-sm'
              : 'border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-950 hover:bg-zinc-100'
          }`}
        >
          {inactiveActive ? '✓ Mostrando Inativos' : 'Ver Inativos'}
        </button>
      </div>

      {/* Indicador de Filtros Ativos */}
      {(selectedCategory || q || lowActive || inactiveActive) && (
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-zinc-600 pt-1">
          <span className="font-bold text-zinc-950">Filtros ativos:</span>
          {selectedCategory && (
            <span className="border border-zinc-950 bg-zinc-100 px-1.5 py-0.5 text-zinc-950 font-bold flex items-center gap-1">
              <span>{CATEGORY_ICONS[selectedCategory] || '📦'} Categoria:</span>
              <span>{selectedCategory === 'none' ? 'Sem Categoria' : selectedCategory}</span>
              <button
                type="button"
                onClick={() => apply({ category: null })}
                className="text-red-600 hover:text-red-900 ml-1 font-black cursor-pointer"
              >
                ✕
              </button>
            </span>
          )}
          {q && (
            <span className="border border-zinc-950 bg-zinc-100 px-1.5 py-0.5 text-zinc-950 font-bold flex items-center gap-1">
              <span>Busca: &quot;{q}&quot;</span>
              <button
                type="button"
                onClick={() => {
                  setQ('');
                  apply({ q: null });
                }}
                className="text-red-600 hover:text-red-900 ml-1 font-black cursor-pointer"
              >
                ✕
              </button>
            </span>
          )}
          {lowActive && (
            <span className="border border-amber-600 bg-amber-50 px-1.5 py-0.5 text-amber-900 font-bold flex items-center gap-1">
              <span>Estoque Baixo</span>
              <button
                type="button"
                onClick={() => apply({ low: null })}
                className="text-red-600 hover:text-red-900 ml-1 font-black cursor-pointer"
              >
                ✕
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setQ('');
              startTransition(() => {
                router.push('/admin/estoque');
              });
            }}
            className="text-zinc-500 hover:text-zinc-950 underline ml-2 cursor-pointer"
          >
            Limpar todos os filtros
          </button>
        </div>
      )}
    </form>
  );
}
