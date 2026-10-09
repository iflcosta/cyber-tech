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

function parseBRLInput(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number(v.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
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

  // Peça que não está cadastrada no estoque: cadastra e já usa na
  // mesma operação (RPC atômica), em vez de obrigar sair da OS pra
  // cadastrar em /admin/estoque/new e voltar.
  const [newItemMode, setNewItemMode] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [newSubmitting, setNewSubmitting] = useState(false);
  const [newError, setNewError] = useState<string | null>(null);
  const [newSaved, setNewSaved] = useState(false);

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

      // Sincroniza o valor estimado da OS para refletir a peça no rastreio público e recibos
      try {
        const { data: currentOS } = await supabase
          .from('service_orders')
          .select('estimated_value')
          .eq('id', serviceOrderId)
          .single();

        if (currentOS) {
          const currentEst = Number(currentOS.estimated_value || 0);
          const newEstimated = Math.round((currentEst + total) * 100) / 100;
          await supabase
            .from('service_orders')
            .update({
              estimated_value: newEstimated,
              updated_at: new Date().toISOString(),
            })
            .eq('id', serviceOrderId);
        }
      } catch {
        // Falha não-bloqueante na atualização de estimativa
      }

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

  async function submitNewItem() {
    const price = parseBRLInput(newPrice);
    const qty = parseInt(newQty, 10);
    if (!newName.trim()) {
      setNewError('Nome da peça é obrigatório.');
      return;
    }
    if (price === null || price <= 0) {
      setNewError('Preço deve ser maior que zero.');
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setNewError('Quantidade inválida.');
      return;
    }
    setNewSubmitting(true);
    setNewError(null);
    try {
      const supabase = createCRMBrowserClient();
      const { error: rpcErr } = await supabase.rpc(
        'create_stock_item_and_use',
        {
          p_name: newName.trim(),
          p_unit_price: price,
          p_quantity: qty,
          p_service_order_id: serviceOrderId,
          p_category: newCategory.trim() || null,
        } as never,
      );
      if (rpcErr) throw rpcErr;

      // Sincroniza o valor estimado da OS com a nova peça avulsa
      try {
        const totalNew = price * qty;
        const { data: currentOS } = await supabase
          .from('service_orders')
          .select('estimated_value')
          .eq('id', serviceOrderId)
          .single();

        if (currentOS && totalNew > 0) {
          const currentEst = Number(currentOS.estimated_value || 0);
          const newEstimated = Math.round((currentEst + totalNew) * 100) / 100;
          await supabase
            .from('service_orders')
            .update({
              estimated_value: newEstimated,
              updated_at: new Date().toISOString(),
            })
            .eq('id', serviceOrderId);
        }
      } catch {
        // Falha não-bloqueante
      }

      setNewName('');
      setNewCategory('');
      setNewPrice('');
      setNewQty('1');
      setNewItemMode(false);
      setNewSaved(true);
      router.refresh();
      setTimeout(() => setNewSaved(false), 2500);
    } catch (e) {
      setNewError((e as Error).message);
    } finally {
      setNewSubmitting(false);
    }
  }

  return (
    <div>
      <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">
        Usar peça do estoque
      </h3>
      {newItemMode ? (
        <div className="mt-2 space-y-3 border-2 border-zinc-950 bg-zinc-50 p-3">
          <p className="font-mono text-xs text-zinc-600">
            Cadastra a peça no estoque e já registra o uso nesta OS numa operação só.
          </p>
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome da peça (ex: Conector USB-C avulso)"
            className="w-full border border-zinc-300 bg-white px-3 py-2 font-mono text-xs text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Categoria (opcional)"
              className="col-span-1 border border-zinc-300 bg-white px-2.5 py-1.5 font-mono text-xs text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
            />
            <input
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              inputMode="decimal"
              placeholder="Preço R$"
              title="Preço de venda cobrado do cliente."
              className="col-span-1 border border-zinc-300 bg-white px-2.5 py-1.5 font-mono text-xs text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
            />
            <input
              type="number"
              min="1"
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
              className="col-span-1 border border-zinc-300 bg-white px-2 py-1.5 text-center font-mono text-xs text-zinc-950"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={submitNewItem}
              disabled={newSubmitting}
              className="border-2 border-zinc-950 bg-zinc-950 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
            >
              {newSubmitting ? 'Cadastrando…' : 'Cadastrar e usar'}
            </button>
            <button
              type="button"
              onClick={() => {
                setNewItemMode(false);
                setNewError(null);
              }}
              disabled={newSubmitting}
              className="border-2 border-zinc-950 bg-white px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 cursor-pointer"
            >
              Cancelar
            </button>
          </div>
          {newError && <p className="border border-red-300 bg-red-50 p-1.5 font-mono text-xs font-bold text-red-700">{newError}</p>}
        </div>
      ) : !selected ? (
        <div className="mt-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cabo, SSD, RAM…"
            aria-label="Buscar peça no estoque"
            className="w-full border-2 border-zinc-950 bg-white px-3 py-2 font-mono text-xs text-zinc-950 placeholder:text-zinc-400 focus:outline-none"
          />
          {suggestions.length > 0 && (
            <ul className="mt-1 divide-y divide-zinc-200 border-2 border-zinc-950 bg-white font-mono text-xs">
              {suggestions.map((i) => (
                <li key={i.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(i);
                      setSearch('');
                    }}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-zinc-100 transition cursor-pointer"
                  >
                    <span className="font-bold text-zinc-950">{i.name}</span>
                    <span className="text-[11px] text-zinc-500">
                      {i.current_stock} em estoque · {fmtBRL(i.unit_price)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => setNewItemMode(true)}
            className="mt-1.5 inline-block font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 underline hover:text-zinc-700 cursor-pointer"
          >
            Não achou? Cadastrar peça nova →
          </button>
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-2 border-2 border-zinc-950 bg-white p-2.5 font-mono text-xs">
          <div className="flex-1">
            <p className="font-bold text-zinc-950">{selected.name}</p>
            <p className="text-[11px] text-zinc-500">
              {selected.current_stock} em estoque · {fmtBRL(selected.unit_price)} cada
            </p>
          </div>
          <input
            type="number"
            min="1"
            max={selected.current_stock}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-16 border border-zinc-300 bg-white px-2 py-1 text-center font-mono text-xs text-zinc-950"
          />
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="border-2 border-zinc-950 bg-zinc-950 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? '…' : 'Usar'}
          </button>
          <button
            type="button"
            onClick={() => setSelected(null)}
            disabled={submitting}
            className="border-2 border-zinc-950 p-1.5 font-mono text-xs font-bold text-zinc-950 hover:bg-zinc-100 cursor-pointer"
            aria-label="Cancelar"
          >
            ✕
          </button>
        </div>
      )}
      {error && <p className="mt-2 border border-red-300 bg-red-50 p-1.5 font-mono text-xs font-bold text-red-700">{error}</p>}
      {newSaved && (
        <p className="mt-2 border border-emerald-500 bg-emerald-50 p-1.5 font-mono text-xs font-bold text-emerald-950">
          ✓ Peça cadastrada e usada nesta OS
        </p>
      )}
    </div>
  );
}
