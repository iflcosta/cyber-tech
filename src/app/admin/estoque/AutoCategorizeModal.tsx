'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import { CATEGORY_ICONS } from './lib/categoryDetector';

export type UncategorizedSuggestion = {
  id: string;
  name: string;
  suggestedCategory: string;
};

export function AutoCategorizeModal({
  suggestions,
  isOpen,
  onClose,
}: {
  suggestions: UncategorizedSuggestion[];
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(suggestions.map((s) => s.id)),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!isOpen) return null;

  function toggleAll() {
    if (selectedIds.size === suggestions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(suggestions.map((s) => s.id)));
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  async function handleApply() {
    if (selectedIds.size === 0) return;
    setIsSubmitting(true);
    setProgress(0);

    try {
      const supabase = createCRMBrowserClient();
      const toUpdate = suggestions.filter((s) => selectedIds.has(s.id));
      let count = 0;

      for (const item of toUpdate) {
        await supabase
          .from('stock_items')
          .update({
            category: item.suggestedCategory,
            updated_at: new Date().toISOString(),
          } as never)
          .eq('id', item.id);

        count++;
        setProgress(Math.round((count / toUpdate.length) * 100));
      }

      router.refresh();
      onClose();
    } catch (err) {
      alert(`Erro na auto-classificação: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Agrupamento por categoria sugerida
  const grouped = new Map<string, UncategorizedSuggestion[]>();
  for (const s of suggestions) {
    const list = grouped.get(s.suggestedCategory) ?? [];
    list.push(s);
    grouped.set(s.suggestedCategory, list);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl border-2 border-zinc-950 bg-white p-5 space-y-4 shadow-2xl font-mono">
        <div className="flex items-center justify-between border-b-2 border-zinc-950 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <div>
              <h2 className="text-base font-black uppercase text-zinc-950">
                Auto-Classificação Inteligente do Catálogo
              </h2>
              <p className="text-xs text-zinc-600">
                Identificamos automaticamente a categoria para {suggestions.length} itens sem categoria
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-sm font-bold text-zinc-400 hover:text-zinc-950"
          >
            ✕
          </button>
        </div>

        {/* Resumo de Grupos Encontrados */}
        <div className="flex flex-wrap gap-2 text-xs border border-zinc-200 bg-zinc-50 p-3">
          {Array.from(grouped.entries()).map(([cat, list]) => (
            <span
              key={cat}
              className="border border-zinc-300 bg-white px-2 py-0.5 font-bold text-zinc-800 flex items-center gap-1"
            >
              <span>{CATEGORY_ICONS[cat] || '📦'}</span>
              <span>{cat}:</span>
              <strong className="text-zinc-950">{list.length}</strong>
            </span>
          ))}
        </div>

        {/* Lista com Seleção */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs px-1">
            <label className="flex items-center gap-2 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.size === suggestions.length && suggestions.length > 0}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-zinc-400 text-zinc-950"
              />
              <span>Selecionar Todos ({selectedIds.size} de {suggestions.length})</span>
            </label>
            <span className="text-zinc-500 text-[11px]">
              Desmarque se algum item não pertencer à categoria
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto border border-zinc-300 divide-y divide-zinc-200 text-xs">
            {suggestions.map((item) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleOne(item.id)}
                  className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-zinc-50 transition ${
                    isSelected ? 'bg-amber-50/40' : 'opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by parent onClick
                      className="h-4 w-4 rounded border-zinc-400 text-zinc-950 shrink-0"
                    />
                    <span className="truncate text-zinc-900 font-medium">
                      {item.name}
                    </span>
                  </div>

                  <span className="shrink-0 border border-amber-600 bg-amber-100 px-2 py-0.5 font-mono text-[10px] font-black text-amber-950">
                    {CATEGORY_ICONS[item.suggestedCategory] || '📦'} {item.suggestedCategory}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {isSubmitting && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-zinc-700">
              <span>Gravando no catálogo...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-zinc-200 h-2">
              <div
                className="bg-zinc-950 h-2 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Rodapé / Botões */}
        <div className="flex gap-2 pt-2 border-t border-zinc-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 border-2 border-zinc-950 bg-white px-4 py-2 font-mono text-xs font-bold uppercase text-zinc-950 hover:bg-zinc-100 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={isSubmitting || selectedIds.size === 0}
            className="flex-1 border-2 border-amber-600 bg-amber-600 px-4 py-2 font-mono text-xs font-bold uppercase text-white hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting
              ? `Salvando… ${progress}%`
              : `✓ Confirmar e Categorizar (${selectedIds.size} Itens)`}
          </button>
        </div>
      </div>
    </div>
  );
}
