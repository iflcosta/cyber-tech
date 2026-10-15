'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import { STOCK_CATEGORY_SUGGESTIONS } from '@/app/admin/types/database';
import { CATEGORY_ICONS } from './lib/categoryDetector';

export function InlineCategorySelect({
  itemId,
  currentCategory,
  suggestedCategory,
  shelfLocation,
}: {
  itemId: string;
  currentCategory: string | null;
  suggestedCategory?: string | null;
  shelfLocation?: string | null;
}) {
  const router = useRouter();
  const [category, setCategory] = useState<string | null>(currentCategory);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  async function handleSelect(newCategory: string | null) {
    setIsSaving(true);
    setIsOpen(false);
    try {
      const supabase = createCRMBrowserClient();
      const { error } = await supabase
        .from('stock_items')
        .update({
          category: newCategory,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', itemId);

      if (error) throw error;
      setCategory(newCategory);
      router.refresh();
    } catch (err) {
      alert(`Erro ao atualizar categoria: ${(err as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  }

  const icon = category ? CATEGORY_ICONS[category] || '📦' : null;
  const filteredSuggestions = STOCK_CATEGORY_SUGGESTIONS.filter((c) =>
    c.toLowerCase().includes(searchFilter.toLowerCase().trim()),
  );

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-1.5 flex-wrap">
        {category ? (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={isSaving}
            className="group flex items-center gap-1 border border-zinc-300 bg-zinc-50 hover:border-zinc-950 hover:bg-zinc-100 px-2 py-0.5 font-mono text-[11px] font-bold text-zinc-900 transition rounded-none cursor-pointer"
            title="Clique para alterar a categoria deste item"
          >
            <span>{icon}</span>
            <span>{category}</span>
            <span className="text-[9px] text-zinc-400 group-hover:text-zinc-950 ml-0.5">▾</span>
          </button>
        ) : suggestedCategory ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleSelect(suggestedCategory)}
              disabled={isSaving}
              className="flex items-center gap-1 border border-amber-500 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 font-mono text-[10px] font-black text-amber-900 transition cursor-pointer animate-pulse hover:animate-none"
              title={`Detectado pelo nome do produto. Clique para confirmar "${suggestedCategory}" com 1 clique!`}
            >
              <span>⚡</span>
              <span>{suggestedCategory}</span>
              <span className="text-[9px] underline ml-0.5">Confirmar</span>
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="border border-zinc-300 bg-white hover:bg-zinc-100 px-1 py-0.5 font-mono text-[10px] text-zinc-600"
              title="Escolher outra categoria"
            >
              ▾
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={isSaving}
            className="border border-dashed border-zinc-400 bg-white hover:border-zinc-950 hover:bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-bold text-zinc-500 hover:text-zinc-950 transition cursor-pointer"
          >
            + Categoria
          </button>
        )}

        {isSaving && (
          <span className="text-[10px] font-mono text-zinc-500 animate-spin">⏳</span>
        )}
      </div>

      {shelfLocation && (
        <span className="mt-0.5 block border border-zinc-300 bg-zinc-100 px-1.5 py-0.2 font-mono text-[10px] font-bold text-zinc-700 w-fit">
          {shelfLocation}
        </span>
      )}

      {/* DROPDOWN POPUP */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full z-50 mt-1 w-56 border-2 border-zinc-950 bg-white p-2 shadow-xl font-mono">
            <div className="mb-2">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filtrar categoria..."
                autoFocus
                className="w-full border border-zinc-300 bg-zinc-50 px-2 py-1 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-0.5 text-xs">
              {suggestedCategory && (
                <button
                  type="button"
                  onClick={() => handleSelect(suggestedCategory)}
                  className="w-full text-left px-2 py-1 bg-amber-50 hover:bg-amber-100 font-bold text-amber-950 border border-amber-300 mb-1 flex items-center justify-between"
                >
                  <span>⚡ {suggestedCategory} (Sugerido)</span>
                  <span className="text-[9px] uppercase font-black text-amber-700">Recomendado</span>
                </button>
              )}

              {filteredSuggestions.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleSelect(cat)}
                  className={`w-full text-left px-2 py-1 hover:bg-zinc-100 flex items-center justify-between ${
                    category === cat ? 'bg-zinc-950 text-white font-bold hover:bg-zinc-800' : 'text-zinc-800'
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span>{CATEGORY_ICONS[cat] || '📦'}</span>
                    <span>{cat}</span>
                  </span>
                  {category === cat && <span>✓</span>}
                </button>
              ))}

              {category && (
                <button
                  type="button"
                  onClick={() => handleSelect(null)}
                  className="w-full text-left px-2 py-1 text-red-600 hover:bg-red-50 border-t border-zinc-200 mt-1 text-[11px]"
                >
                  ✕ Remover categoria (deixar sem)
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
