'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';

type StockItemOption = {
  id: string;
  name: string;
  ean13: string | null;
  internal_sku: string | null;
  unit_price: number;
  current_stock: number;
};

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function UsePartForm({
  serviceOrderId,
  currentUserId,
  items,
}: {
  serviceOrderId: string;
  currentUserId: string;
  items: StockItemOption[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<StockItemOption | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestions = useMemo(() => {
    if (!search.trim() || selected) return [];
    const s = search.toLowerCase().trim();
    return items
      .filter(
        (i) =>
          i.name.toLowerCase().includes(s) ||
          (i.ean13?.includes(s) ?? false) ||
          (i.internal_sku?.toLowerCase().includes(s) ?? false),
      )
      .slice(0, 6);
  }, [search, items, selected]);

  async function submit() {
    if (!selected) {
      setError('Escolha uma peça do estoque.');
      return;
    }
    const qty = parseInt(quantity, 10);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError('Quantidade inválida.');
      return;
    }
    if (qty > selected.current_stock) {
      setError(`Estoque insuficiente: ${selected.name} tem ${selected.current_stock}.`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      const total = selected.unit_price * qty;
      const { error: insErr } = await supabase.from('stock_movements').insert({
        stock_item_id: selected.id,
        movement_type: 'out',
        quantity: qty,
        unit_price: selected.unit_price,
        total_amount: total,
        service_order_id: serviceOrderId,
        author_id: currentUserId,
      });
      if (insErr) throw insErr;

      setSelected(null);
      setSearch('');
      setQuantity('1');
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Usar peça do estoque
      </h3>
      {!selected ? (
        <div className="mt-1.5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cabo, SSD, RAM…"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {suggestions.length > 0 && (
            <ul className="mt-1.5 divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
              {suggestions.map((i) => (
                <li key={i.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(i);
                      setSearch('');
                    }}
                    className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm hover:bg-slate-50"
                  >
                    <span className="text-slate-900">{i.name}</span>
                    <span className="text-xs text-slate-500">
                      {i.current_stock} em estoque · {fmtBRL(i.unit_price)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="mt-1.5 flex items-center gap-2 rounded-md border border-slate-300 bg-white p-2">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900">{selected.name}</p>
            <p className="text-xs text-slate-500">
              {selected.current_stock} em estoque · {fmtBRL(selected.unit_price)} cada
            </p>
          </div>
          <input
            type="number"
            min="1"
            max={selected.current_stock}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-16 rounded-md border border-slate-300 px-2 py-1 text-center font-mono text-sm"
          />
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? '…' : 'Usar'}
          </button>
          <button
            type="button"
            onClick={() => setSelected(null)}
            disabled={submitting}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
            aria-label="Cancelar"
          >
            ✕
          </button>
        </div>
      )}
      {error && <p className="mt-1.5 rounded-md bg-red-50 p-1.5 text-xs text-red-700">{error}</p>}
    </div>
  );
}
