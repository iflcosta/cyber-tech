'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import { STOCK_CATEGORY_SUGGESTIONS } from '@/app/admin/types/database';

type StockItemData = {
  id: string;
  name: string;
  category: string | null;
  brand: string | null;
  model: string | null;
  ean13: string | null;
  unit_price: number;
  unit_cost: number | null;
  min_stock: number;
  notes: string | null;
};

function parseBRL(v: string): number | null {
  const clean = v.trim().replace(/[R$\s]/g, '');
  if (!clean) return null;
  const normalized = clean.includes(',')
    ? clean.replace(/\./g, '').replace(',', '.')
    : clean;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export function StockItemEditor({ item }: { item: StockItemData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category ?? '');
  const [brand, setBrand] = useState(item.brand ?? '');
  const [model, setModel] = useState(item.model ?? '');
  const [ean13, setEan13] = useState(item.ean13 ?? '');
  const [unitPrice, setUnitPrice] = useState(item.unit_price.toFixed(2).replace('.', ','));
  const [unitCost, setUnitCost] = useState(
    item.unit_cost !== null ? item.unit_cost.toFixed(2).replace('.', ',') : '',
  );
  const [minStock, setMinStock] = useState(String(item.min_stock));
  const [notes, setNotes] = useState(item.notes ?? '');

  async function handleSave() {
    if (!name.trim()) {
      setError('Nome do item é obrigatório.');
      return;
    }
    const priceNum = parseBRL(unitPrice);
    if (priceNum === null || priceNum < 0) {
      setError('Preço de venda inválido.');
      return;
    }
    const costNum = unitCost.trim() ? parseBRL(unitCost) : null;
    if (unitCost.trim() && (costNum === null || costNum < 0)) {
      setError('Custo unitário inválido.');
      return;
    }
    const minNum = parseInt(minStock, 10);
    if (!Number.isFinite(minNum) || minNum < 0) {
      setError('Estoque mínimo inválido.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      const { error: upErr } = await supabase
        .from('stock_items')
        .update({
          name: name.trim(),
          category: category.trim() || null,
          brand: brand.trim() || null,
          model: model.trim() || null,
          ean13: ean13.trim() || null,
          unit_price: priceNum,
          unit_cost: costNum,
          min_stock: minNum,
          notes: notes.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (upErr) throw upErr;
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs font-semibold text-zinc-900 underline hover:text-black"
      >
        Editar dados
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-3 border-t border-zinc-200 pt-3 text-sm">
      <div>
        <label className="block text-xs font-medium text-zinc-600">Nome *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm text-zinc-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-zinc-600">Categoria</label>
          <input
            type="text"
            list="stock-cat-list-edit"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm text-zinc-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
          <datalist id="stock-cat-list-edit">
            {STOCK_CATEGORY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600">EAN-13 / Código</label>
          <input
            type="text"
            value={ean13}
            onChange={(e) => setEan13(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 font-mono text-sm text-zinc-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-zinc-600">Marca</label>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm text-zinc-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600">Modelo</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm text-zinc-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs font-medium text-zinc-600">Preço (R$) *</label>
          <input
            type="text"
            inputMode="decimal"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 font-mono text-sm text-zinc-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600">Custo (R$)</label>
          <input
            type="text"
            inputMode="decimal"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 font-mono text-sm text-zinc-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600">Est. Mínimo</label>
          <input
            type="number"
            min="0"
            value={minStock}
            onChange={(e) => setMinStock(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 font-mono text-sm text-zinc-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-600">Observações</label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm text-zinc-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>

      {error && <p className="rounded bg-red-50 p-2 text-xs text-red-700">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => setEditing(false)}
          disabled={saving}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {saving ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </div>
    </div>
  );
}
