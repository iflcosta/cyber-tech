'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/crm/lib/supabase/client';
import { STOCK_MOVEMENT_TYPES, type StockMovementTypeValue } from '@/app/admin/crm/types/database';

function parseBRL(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number(v.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function MovementForm({
  stockItemId,
  itemName,
  currentStock,
  defaultUnitPrice,
  currentUserId,
}: {
  stockItemId: string;
  itemName: string;
  currentStock: number;
  defaultUnitPrice: number;
  currentUserId: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [movementType, setMovementType] = useState<StockMovementTypeValue>('in');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState(defaultUnitPrice.toFixed(2).replace('.', ','));
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const qtyNum = parseInt(quantity, 10);
  const projectedStock =
    movementType === 'in' || movementType === 'adjust'
      ? currentStock + (Number.isFinite(qtyNum) ? qtyNum : 0)
      : currentStock - (Number.isFinite(qtyNum) ? qtyNum : 0);

  const showPrice = movementType === 'out' || movementType === 'sale';
  const priceNum = parseBRL(unitPrice);

  async function submit() {
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
      setError('Quantidade deve ser maior que zero.');
      return;
    }
    if ((movementType === 'out' || movementType === 'sale') && qtyNum > currentStock) {
      setError(`Estoque insuficiente. Atual: ${currentStock}, tentativa: ${qtyNum}.`);
      return;
    }
    if (showPrice && (priceNum === null || priceNum < 0)) {
      setError('Preço unitário inválido.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      const total = showPrice && priceNum !== null ? priceNum * qtyNum : null;
      const { error: insErr } = await supabase.from('stock_movements').insert({
        stock_item_id: stockItemId,
        movement_type: movementType,
        quantity: qtyNum,
        unit_price: showPrice ? priceNum : null,
        total_amount: total,
        reference: reference.trim() || null,
        notes: notes.trim() || null,
        author_id: currentUserId,
      });
      if (insErr) throw insErr;

      router.push(`/admin/crm/estoque/${stockItemId}`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="space-y-3">
        <Field label="Tipo de movimentação *">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STOCK_MOVEMENT_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setMovementType(t.value)}
                className={`rounded-md border-2 px-3 py-2 text-sm font-medium transition ${
                  movementType === t.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Quantidade *">
            <input
              autoFocus
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="form-input"
            />
          </Field>
          {showPrice && (
            <Field label="Preço unitário *">
              <input
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="form-input"
                inputMode="decimal"
                placeholder="0,00"
              />
            </Field>
          )}
        </div>

        <Field label="Referência (opcional)">
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="form-input"
            placeholder="Ex: NF-12345 (entrada) ou OS-0626001 (saída)"
          />
        </Field>

        <Field label="Observações">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="form-input"
            rows={2}
            placeholder="Detalhes da movimentação"
          />
        </Field>

        <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
          <p>
            <strong>Estoque atual:</strong> {currentStock}
          </p>
          <p>
            <strong>Estoque após:</strong>{' '}
            <span
              className={
                projectedStock < 0
                  ? 'font-bold text-red-600'
                  : projectedStock === 0
                    ? 'font-bold text-orange-600'
                    : 'font-bold text-slate-900'
              }
            >
              {projectedStock}
            </span>
          </p>
          {showPrice && priceNum !== null && Number.isFinite(qtyNum) && (
            <p className="mt-1">
              <strong>Total:</strong>{' '}
              {(priceNum * qtyNum).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
          )}
        </div>
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
          {submitting ? 'Salvando…' : 'Confirmar movimentação'}
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
