'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/crm/lib/supabase/client';
import { STOCK_CATEGORY_SUGGESTIONS } from '@/app/admin/crm/types/database';

function formatBRLInput(v: string): string {
  // aceita "1.234,56" ou "1234.56" -> "1234.56" pra mandar pro Supabase
  return v.replace(/\./g, '').replace(',', '.');
}

function parseBRLInput(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number(formatBRLInput(v));
  return Number.isFinite(n) ? n : null;
}

export function NewItemForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ean13, setEan13] = useState('');
  const [internalSku, setInternalSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [minStock, setMinStock] = useState('5');
  const [notes, setNotes] = useState('');

  async function submit() {
    if (!name.trim()) {
      setError('Nome é obrigatório.');
      return;
    }
    const price = parseBRLInput(unitPrice);
    if (price === null || price <= 0) {
      setError('Preço de venda é obrigatório e deve ser maior que zero.');
      return;
    }
    const cost = unitCost.trim() ? parseBRLInput(unitCost) : null;
    const minN = parseInt(minStock, 10);
    const eanClean = ean13.trim().replace(/\s/g, '') || null;
    if (eanClean && !/^\d{8,13}$/.test(eanClean)) {
      setError('EAN-13 inválido (deve ter 8 a 13 dígitos).');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      const { data, error: insErr } = await supabase
        .from('stock_items')
        .insert({
          ean13: eanClean,
          internal_sku: internalSku.trim() || null,  // null = trigger auto-gera
          name: name.trim(),
          category: category.trim() || null,
          brand: brand.trim() || null,
          model: model.trim() || null,
          unit_cost: cost,
          unit_price: price,
          min_stock: Number.isFinite(minN) ? minN : 5,
          notes: notes.trim() || null,
        })
        .select('id')
        .single();
      if (insErr) throw insErr;

      router.push(`/admin/crm/estoque/${data.id}`);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="space-y-3">
        <Field label="Nome *">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
            placeholder="Ex: Cabo USB-C 1m"
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="EAN-13 (código de barras)">
            <input
              value={ean13}
              onChange={(e) => setEan13(e.target.value)}
              className="form-input font-mono"
              placeholder="7891234567890"
              maxLength={13}
            />
          </Field>
          <Field label="SKU interno (auto se vazio)">
            <input
              value={internalSku}
              onChange={(e) => setInternalSku(e.target.value)}
              className="form-input font-mono"
              placeholder="CY-RAM-DDR4-8G-00001"
            />
          </Field>
        </div>

        <Field label="Categoria">
          <input
            list="stock-category-suggestions"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="form-input"
            placeholder="Ex: Memórias (gera CY-RAM-...) ou Cabos (CY-CAB-...)"
          />
          <datalist id="stock-category-suggestions">
            {STOCK_CATEGORY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Marca">
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="form-input"
              placeholder="Ex: Samsung"
            />
          </Field>
          <Field label="Modelo">
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="form-input"
              placeholder="Ex: EP-DW767"
            />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Custo (opcional)">
            <input
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              className="form-input"
              placeholder="0,00"
              inputMode="decimal"
            />
          </Field>
          <Field label="Preço de venda *">
            <input
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className="form-input"
              placeholder="0,00"
              inputMode="decimal"
            />
          </Field>
          <Field label="Estoque mínimo (alerta)">
            <input
              type="number"
              min="0"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              className="form-input"
            />
          </Field>
        </div>

        <Field label="Observações">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="form-input"
            rows={2}
            placeholder="Anotações internas sobre o item"
          />
        </Field>

        <p className="rounded-md bg-slate-50 p-3 text-xs text-slate-600">
          <strong>Estoque inicial:</strong> começa em 0. Depois de cadastrar, registre uma
          movimentação de <em>Entrada</em> na página do item pra adicionar o estoque inicial
          (vinculado à nota fiscal de compra).
        </p>
      </div>

      {error && <p className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={submitting}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-30"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? 'Salvando…' : 'Cadastrar item'}
        </button>
      </div>

      <style jsx global>{`
        .form-input {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid rgb(203 213 225);
          padding: 0.5rem 0.75rem;
          font-size: 1rem;
          line-height: 1.5;
          color: rgb(15 23 42);
          background: white;
        }
        .form-input:focus {
          outline: none;
          border-color: rgb(59 130 246);
          box-shadow: 0 0 0 1px rgb(59 130 246);
        }
        .form-input::placeholder {
          color: rgb(148 163 184);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
