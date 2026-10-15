'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CATEGORY_ICONS } from './lib/categoryDetector';
import { AutoCategorizeModal, type UncategorizedSuggestion } from './AutoCategorizeModal';

export type CategoryCount = {
  category: string;
  count: number;
};

export function CategoryBar({
  categoryCounts,
  selectedCategory,
  totalCount,
  uncategorizedCount,
  suggestions,
}: {
  categoryCounts: CategoryCount[];
  selectedCategory?: string;
  totalCount: number;
  uncategorizedCount: number;
  suggestions: UncategorizedSuggestion[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showAutoModal, setShowAutoModal] = useState(false);

  function selectCategory(cat: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (cat === null || cat === 'all') {
      params.delete('category');
    } else {
      params.set('category', cat);
    }
    router.push(`/admin/estoque?${params.toString()}`);
  }

  const isAll = !selectedCategory || selectedCategory === 'all';
  const isNone = selectedCategory === 'none';

  return (
    <div className="space-y-2">
      {/* BARRA SUPERIOR DE AÇÃO E CHIPS */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            Categorias do Catálogo:
          </span>
          {selectedCategory && (
            <button
              onClick={() => selectCategory(null)}
              className="text-[10px] font-mono font-bold text-red-600 hover:text-red-800 underline"
            >
              ✕ Limpar filtro ({selectedCategory === 'none' ? 'Sem Categoria' : selectedCategory})
            </button>
          )}
        </div>

        {/* Botão de Auto-Classificação */}
        {suggestions.length > 0 && (
          <button
            type="button"
            onClick={() => setShowAutoModal(true)}
            className="border-2 border-amber-600 bg-amber-500 hover:bg-amber-400 px-2.5 py-1 font-mono text-[11px] font-black uppercase tracking-wider text-zinc-950 transition shadow-sm flex items-center gap-1.5 cursor-pointer animate-pulse hover:animate-none"
            title="Clique para analisar e categorizar todos os itens sem categoria com 1 clique"
          >
            <span>⚡</span>
            <span>Auto-Classificar ({suggestions.length} itens detectados)</span>
          </button>
        )}
      </div>

      {/* CHIPS HORIZONTAIS DE CATEGORIA */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Todos */}
        <button
          type="button"
          onClick={() => selectCategory(null)}
          className={`px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            isAll
              ? 'border-2 border-zinc-950 bg-zinc-950 text-white shadow-sm'
              : 'border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-950 hover:bg-zinc-100'
          }`}
        >
          <span>📦</span>
          <span>Todos</span>
          <span className={`text-[10px] ml-0.5 px-1 ${isAll ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
            {totalCount}
          </span>
        </button>

        {/* Categorias ativas com itens */}
        {categoryCounts.map(({ category, count }) => {
          const isSelected = selectedCategory?.toLowerCase() === category.toLowerCase();
          const icon = CATEGORY_ICONS[category] || '📦';

          return (
            <button
              key={category}
              type="button"
              onClick={() => selectCategory(category)}
              className={`px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'border-2 border-zinc-950 bg-zinc-950 text-white shadow-sm'
                  : 'border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-950 hover:bg-zinc-100'
              }`}
            >
              <span>{icon}</span>
              <span>{category}</span>
              <span className={`text-[10px] ml-0.5 px-1 ${isSelected ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                {count}
              </span>
            </button>
          );
        })}

        {/* Sem Categoria */}
        {uncategorizedCount > 0 && (
          <button
            type="button"
            onClick={() => selectCategory('none')}
            className={`px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
              isNone
                ? 'border-2 border-red-600 bg-red-600 text-white shadow-sm'
                : 'border border-dashed border-amber-500 bg-amber-50 text-amber-900 hover:bg-amber-100'
            }`}
          >
            <span>⚠️</span>
            <span>Sem Categoria</span>
            <span className={`text-[10px] ml-0.5 px-1 ${isNone ? 'bg-red-800 text-white' : 'bg-amber-200 text-amber-950'}`}>
              {uncategorizedCount}
            </span>
          </button>
        )}
      </div>

      {/* Modal de Auto-Classificação */}
      <AutoCategorizeModal
        suggestions={suggestions}
        isOpen={showAutoModal}
        onClose={() => setShowAutoModal(false)}
      />
    </div>
  );
}
