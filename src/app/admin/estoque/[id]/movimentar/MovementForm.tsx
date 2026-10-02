'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import { STOCK_MOVEMENT_TYPES, type StockMovementTypeValue } from '@/app/admin/types/database';

function parseBRL(v: string): number | null {
  const clean = v.trim().replace(/[R$\s]/g, '');
  if (!clean) return null;
  const normalized = clean.includes(',')
    ? clean.replace(/\./g, '').replace(',', '.')
    : clean;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export function MovementForm({
  stockItemId,
  currentStock,
  defaultUnitPrice,
  currentUserId,
}: {
  stockItemId: string;
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
  const isAdjust = movementType === 'adjust';
  const projectedStock = isAdjust
    ? Number.isFinite(qtyNum)
      ? qtyNum
      : currentStock
    : movementType === 'in'
      ? currentStock + (Number.isFinite(qtyNum) ? qtyNum : 0)
      : currentStock - (Number.isFinite(qtyNum) ? qtyNum : 0);

  const showPrice = movementType === 'out' || movementType === 'sale';
  const priceNum = parseBRL(unitPrice);

  function selectMovementType(nextType: StockMovementTypeValue) {
    setMovementType(nextType);
    if (nextType === 'adjust') {
      setQuantity(String(currentStock));
    } else if (movementType === 'adjust') {
      setQuantity('1');
    }
  }

  async function submit() {
    if (isAdjust) {
      if (!Number.isFinite(qtyNum) || qtyNum < 0) {
        setError('A nova quantidade em estoque deve ser 0 ou maior.');
        return;
      }
      if (qtyNum === currentStock) {
        setError(`O estoque atual já é ${currentStock}. Digite a nova contagem física.`);
        return;
      }
    } else {
      if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
        setError('Quantidade deve ser maior que zero.');
        return;
      }
      if ((movementType === 'out' || movementType === 'sale') && qtyNum > currentStock) {
        setError(`Estoque insuficiente. Atual: ${currentStock}, tentativa: ${qtyNum}.`);
        return;
      }
    }
    if (showPrice && (priceNum === null || priceNum < 0)) {
      setError('Preço unitário inválido.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      const movementQty = isAdjust ? qtyNum - currentStock : qtyNum;
      const total = showPrice && priceNum !== null ? priceNum * movementQty : null;
      const defaultAdjustNote = isAdjust
        ? `Ajuste de inventário (${currentStock} → ${qtyNum})`
        : null;
      const { error: insErr } = await supabase.from('stock_movements').insert({
        stock_item_id: stockItemId,
        movement_type: movementType,
        quantity: movementQty,
        unit_price: showPrice ? priceNum : null,
        total_amount: total,
        reference: reference.trim() || null,
        notes: notes.trim() || defaultAdjustNote,
        author_id: currentUserId,
      });
      if (insErr) throw insErr;

      router.push(`/admin/estoque/${stockItemId}`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="border-2 border-zinc-950 bg-white p-4 sm:p-6">
      <div className="space-y-4">
        <Field label="Tipo de movimentação *">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STOCK_MOVEMENT_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => selectMovementType(t.value)}
                className={`border-2 p-2.5 font-mono text-xs uppercase tracking-wider transition cursor-pointer ${
                  movementType === t.value
                    ? 'border-zinc-950 bg-zinc-950 text-white font-bold'
                    : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={isAdjust ? 'Nova quantidade física em estoque *' : 'Quantidade *'}>
            <input
              autoFocus
              type="number"
              min={isAdjust ? '0' : '1'}
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

        <div className="border-2 border-zinc-950 bg-zinc-50 p-4 font-mono text-xs text-zinc-950">
          <p>
            <strong>Estoque atual:</strong> {currentStock}
          </p>
          <p className="mt-1">
            <strong>Estoque após:</strong>{' '}
            <span
              className={
                projectedStock < 0
                  ? 'font-black text-red-600'
                  : projectedStock === 0
                    ? 'font-black text-orange-600'
                    : 'font-black text-zinc-950'
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

      {error && <p className="mt-3 border border-red-300 bg-red-50 p-2 font-mono text-xs font-bold text-red-700">{error}</p>}

      <div className="mt-6 flex justify-end gap-2 border-t-2 border-zinc-200 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={submitting}
          className="border-2 border-zinc-950 bg-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="border-2 border-zinc-950 bg-zinc-950 px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 disabled:opacity-50 transition cursor-pointer"
        >
          {submitting ? 'Salvando…' : 'Confirmar movimentação'}
        </button>
      </div>

      <style jsx global>{`
        .form-input {
          width: 100%;
          border: 1px solid #d4d4d8;
          padding: 0.55rem 0.85rem;
          font-size: 0.9rem;
          font-family: inherit;
          line-height: 1.5;
          color: #09090b;
          background: white;
        }
        .form-input:focus {
          outline: none;
          border-color: #09090b;
        }
        .form-input::placeholder {
          color: #a1a1aa;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block font-mono text-xs font-bold uppercase tracking-wider text-zinc-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
