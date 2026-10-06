'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import { STOCK_CATEGORY_SUGGESTIONS } from '@/app/admin/types/database';
import { parseDeviceNotes, encodeDeviceNotes, calculateInstallment } from '@/app/admin/lib/deviceSpecs';

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
  shelf_location?: string | null;
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

export function StockItemEditor({
  item,
  initialOpen = false,
  triggerLabel = 'Editar dados',
  className,
}: {
  item: StockItemData;
  initialOpen?: boolean;
  triggerLabel?: string;
  className?: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(initialOpen);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category ?? '');
  const [brand, setBrand] = useState(item.brand ?? '');
  const [model, setModel] = useState(item.model ?? '');
  const [ean13, setEan13] = useState(item.ean13 ?? '');
  const [shelfLocation, setShelfLocation] = useState(item.shelf_location ?? '');
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

    // Se o item tiver Ficha Técnica gravada nas notas, recalcula o parcelamento e mantém o JSON sincronizado!
    let finalNotes = notes.trim() || null;
    const { specs, humanNotes } = parseDeviceNotes(notes);
    if (specs) {
      const updatedInstallment = calculateInstallment(priceNum).text;
      finalNotes = encodeDeviceNotes(humanNotes, {
        ...specs,
        installmentInfo: updatedInstallment,
      });
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
          shelf_location: shelfLocation.trim() || null,
          unit_price: priceNum,
          unit_cost: costNum,
          min_stock: minNum,
          notes: finalNotes,
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
        className={
          className ||
          'font-mono text-xs font-bold text-zinc-950 underline underline-offset-4 hover:text-black hover:bg-zinc-100 px-2 py-1 transition cursor-pointer'
        }
      >
        {triggerLabel}
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-3 border-2 border-zinc-950 bg-white p-4 shadow-sm text-sm">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
        <span className="font-mono text-xs font-bold uppercase text-zinc-950">
          ✏️ Editar Dados do Item / Preço
        </span>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="font-mono text-xs text-zinc-500 hover:text-zinc-950 cursor-pointer"
        >
          ✕ Fechar
        </button>
      </div>

      <div>
        <label className="block font-mono text-[11px] font-bold uppercase text-zinc-700">Nome / Título *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-900 font-bold focus:border-black focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block font-mono text-[11px] font-bold uppercase text-zinc-700">Preço de Venda (R$) *</label>
          <input
            type="text"
            inputMode="decimal"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            className="mt-1 w-full border-2 border-zinc-950 bg-emerald-50/50 px-2.5 py-1.5 font-mono text-sm font-black text-emerald-800 focus:border-black focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-mono text-[11px] font-bold uppercase text-zinc-700">Custo de Compra (R$)</label>
          <input
            type="text"
            inputMode="decimal"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            className="mt-1 w-full border border-zinc-300 px-2.5 py-1.5 font-mono text-xs text-zinc-900 focus:border-black focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block font-mono text-[11px] font-bold uppercase text-zinc-700">Categoria</label>
          <input
            type="text"
            list="stock-cat-list-edit"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-900 focus:border-black focus:outline-none"
          />
          <datalist id="stock-cat-list-edit">
            {STOCK_CATEGORY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block font-mono text-[11px] font-bold uppercase text-zinc-700">Localização / Vitrine</label>
          <input
            type="text"
            value={shelfLocation}
            onChange={(e) => setShelfLocation(e.target.value)}
            placeholder="Ex: Vitrine Balcão 01"
            className="mt-1 w-full border border-zinc-300 px-2.5 py-1.5 font-mono text-xs text-zinc-900 focus:border-black focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block font-mono text-[11px] font-bold uppercase text-zinc-700">Marca</label>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="mt-1 w-full border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-900 focus:border-black focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-mono text-[11px] font-bold uppercase text-zinc-700">Modelo</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="mt-1 w-full border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-900 focus:border-black focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block font-mono text-[11px] font-bold uppercase text-zinc-700">EAN-13 (Código de barras)</label>
          <input
            type="text"
            value={ean13}
            onChange={(e) => setEan13(e.target.value)}
            className="mt-1 w-full border border-zinc-300 px-2.5 py-1.5 font-mono text-xs text-zinc-900 focus:border-black focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-mono text-[11px] font-bold uppercase text-zinc-700">Estoque Mínimo</label>
          <input
            type="number"
            min="0"
            value={minStock}
            onChange={(e) => setMinStock(e.target.value)}
            className="mt-1 w-full border border-zinc-300 px-2.5 py-1.5 font-mono text-xs text-zinc-900 focus:border-black focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block font-mono text-[11px] font-bold uppercase text-zinc-700">Observações / Ficha Técnica</label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 w-full border border-zinc-300 px-2.5 py-1.5 font-mono text-[11px] text-zinc-900 focus:border-black focus:outline-none"
        />
      </div>

      {error && (
        <p className="border-2 border-red-600 bg-red-50 p-2 font-mono text-xs font-bold text-red-900">
          [ERRO] {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
        <button
          type="button"
          onClick={() => setEditing(false)}
          disabled={saving}
          className="border border-zinc-300 bg-white px-3 py-1.5 font-mono text-xs font-medium uppercase text-zinc-700 hover:bg-zinc-50 cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-zinc-950 px-4 py-1.5 font-mono text-xs font-bold uppercase text-white hover:bg-zinc-800 disabled:opacity-50 cursor-pointer shadow-xs"
        >
          {saving ? 'Gravando…' : '✓ Salvar Alterações'}
        </button>
      </div>
    </div>
  );
}
