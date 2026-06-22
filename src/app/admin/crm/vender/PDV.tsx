'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/crm/lib/supabase/client';
import { PAYMENT_METHODS, type PaymentMethodValue } from '@/app/admin/crm/types/database';

type Item = {
  id: string;
  ean13: string | null;
  name: string;
  brand: string | null;
  model: string | null;
  unit_price: number;
  current_stock: number;
  min_stock: number;
};

type CartItem = {
  stock_item_id: string;
  name: string;
  unit_price: number;
  quantity: number;
  stock_available: number;
};

function parseBRL(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number(v.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function PDV({
  items,
  currentUserId,
  currentUserName,
}: {
  items: Item[];
  currentUserId: string;
  currentUserName: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [code, setCode] = useState('');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  // Modal de finalizar venda
  const [finalizing, setFinalizing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodValue>('pix');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState('');
  const [notes, setNotes] = useState('');

  // Mantem foco no input sempre (leitor USB-HID bipa rapido)
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Flash mensagem some em 1.5s
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 1500);
    return () => clearTimeout(t);
  }, [flash]);

  const subtotal = useMemo(
    () => cart.reduce((sum, c) => sum + c.unit_price * c.quantity, 0),
    [cart],
  );
  const discountNum = parseBRL(discount) ?? 0;
  const total = Math.max(0, subtotal - discountNum);

  // Adiciona item ao carrinho (incrementa qty se ja existe)
  const addItem = useCallback(
    (item: Item, qty: number = 1) => {
      setError(null);
      setCart((prev) => {
        const existing = prev.find((c) => c.stock_item_id === item.id);
        const stockAvail = item.current_stock;
        if (existing) {
          const newQty = existing.quantity + qty;
          if (newQty > stockAvail) {
            setError(
              `Estoque insuficiente: ${item.name} tem ${stockAvail}, carrinho ja tem ${existing.quantity}.`,
            );
            return prev;
          }
          return prev.map((c) =>
            c.stock_item_id === item.id ? { ...c, quantity: newQty } : c,
          );
        }
        if (qty > stockAvail) {
          setError(`Estoque insuficiente: ${item.name} tem ${stockAvail}.`);
          return prev;
        }
        return [
          ...prev,
          {
            stock_item_id: item.id,
            name: item.name,
            unit_price: item.unit_price,
            quantity: qty,
            stock_available: stockAvail,
          },
        ];
      });
      setFlash(`+ ${item.name}`);
    },
    [],
  );

  // Processa codigo digitado/bipado (Enter submete)
  function submitCode(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim();
    if (!c) return;

    // 1. Tenta por EAN-13 (prioridade — leitor sempre manda EAN)
    let found = items.find((i) => i.ean13 === c);
    // 2. Tenta por nome exato
    if (!found) found = items.find((i) => i.name.toLowerCase() === c.toLowerCase());
    // 3. Tenta match parcial no nome (se for digitado)
    if (!found && c.length >= 3) {
      found = items.find((i) =>
        i.name.toLowerCase().includes(c.toLowerCase()),
      );
    }

    if (!found) {
      setError(`Nenhum item com codigo "${c}".`);
      setCode('');
      return;
    }
    addItem(found, 1);
    setCode('');
  }

  function updateQty(stockItemId: string, qty: number) {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.stock_item_id !== stockItemId) return c;
          const newQty = Math.max(1, Math.floor(qty));
          if (newQty > c.stock_available) {
            setError(`Maximo em estoque: ${c.stock_available}.`);
            return c;
          }
          return { ...c, quantity: newQty };
        })
        .filter(Boolean),
    );
  }

  function removeItem(stockItemId: string) {
    setCart((prev) => prev.filter((c) => c.stock_item_id !== stockItemId));
  }

  async function finalizarVenda() {
    if (cart.length === 0) {
      setError('Carrinho vazio.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      const payload = {
        p_items: cart.map((c) => ({
          stock_item_id: c.stock_item_id,
          quantity: c.quantity,
          unit_price: c.unit_price,
        })),
        p_payment_method: paymentMethod,
        p_customer_name: customerName.trim() || null,
        p_customer_phone: customerPhone.trim() || null,
        p_discount: discountNum,
        p_notes: notes.trim() || null,
      };
      const { data: saleId, error: rpcErr } = await supabase.rpc(
        'create_sale',
        payload as never,
      );
      if (rpcErr) throw rpcErr;

      // Abre recibo em NOVA JANELA: gesto do user (clique em "Confirmar venda")
      // permite auto-print sem bloqueio do Chrome. Janela anterior fica no PDV
      // pra iniciar proxima venda.
      window.open(`/admin/crm/vendas/${saleId}/recibo`, '_blank');
      // Limpa carrinho pra proxima venda
      setCart([]);
      setFinalizing(false);
      setDiscount('');
      setNotes('');
      setCustomerName('');
      setCustomerPhone('');
      setSubmitting(false);
      // Volta foco pro input de bipagem
      inputRef.current?.focus();
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
      setFinalizing(false);
    }
  }

  // Sugestoes da busca manual
  const searchSuggestions = useMemo(() => {
    if (!search.trim()) return [];
    const s = search.toLowerCase().trim();
    return items
      .filter(
        (i) =>
          i.name.toLowerCase().includes(s) ||
          (i.brand?.toLowerCase().includes(s) ?? false) ||
          (i.ean13?.includes(s) ?? false),
      )
      .slice(0, 8);
  }, [search, items]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vender (PDV)</h1>
          <p className="text-sm text-slate-500">
            Bipe o codigo de barras ou digite o nome. Operador: {currentUserName}.
          </p>
        </div>
      </div>

      {/* Input de bipagem — SEMPRE com autofocus (leitor envia rapido) */}
      <form
        onSubmit={submitCode}
        className="rounded-lg border-2 border-blue-300 bg-blue-50 p-4 shadow-sm"
      >
        <label className="block">
          <span className="block text-sm font-semibold uppercase tracking-wide text-blue-700">
            Bipar / buscar
          </span>
          <input
            ref={inputRef}
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Bipe o codigo ou digite o nome do item…"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="mt-1 w-full rounded-md border border-blue-300 bg-white px-4 py-3 text-lg font-mono focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        {flash && (
          <p className="mt-2 text-sm font-medium text-emerald-700">{flash}</p>
        )}
      </form>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Busca manual (caso leitor nao funcione) */}
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ou busque manualmente por nome/marca…"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {searchSuggestions.length > 0 && (
          <ul className="mt-2 divide-y divide-slate-200">
            {searchSuggestions.map((i) => (
              <li
                key={i.id}
                className="flex items-center justify-between gap-2 py-1.5 text-sm"
              >
                <button
                  type="button"
                  onClick={() => {
                    addItem(i);
                    setSearch('');
                  }}
                  className="flex-1 text-left hover:text-blue-700"
                >
                  <span className="font-medium text-slate-900">{i.name}</span>
                  {i.brand && (
                    <span className="ml-1 text-xs text-slate-500">· {i.brand}</span>
                  )}
                  <span className="ml-2 font-mono text-xs text-slate-400">
                    {i.ean13}
                  </span>
                </button>
                <span className="text-xs text-slate-500">
                  {i.current_stock} em estoque · {fmtBRL(i.unit_price)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Carrinho */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <header className="border-b border-slate-200 px-4 py-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Carrinho ({cart.length})
          </h2>
        </header>
        {cart.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">
            Bipe um codigo ou adicione um item acima pra comecar.
          </p>
        ) : (
          <>
            <ul className="divide-y divide-slate-200">
              {cart.map((c) => (
                <li key={c.stock_item_id} className="flex items-center gap-3 px-4 py-2">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-500">
                      {fmtBRL(c.unit_price)} cada · {c.stock_available} em estoque
                    </p>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max={c.stock_available}
                    value={c.quantity}
                    onChange={(e) => updateQty(c.stock_item_id, Number(e.target.value))}
                    className="w-16 rounded-md border border-slate-300 px-2 py-1 text-center font-mono text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <span className="w-24 text-right font-mono font-medium text-slate-900">
                    {fmtBRL(c.unit_price * c.quantity)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(c.stock_item_id)}
                    className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Remover"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            <footer className="border-t border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">Subtotal</p>
                  <p className="text-lg font-bold text-slate-900">
                    {fmtBRL(subtotal)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFinalizing(true)}
                  disabled={cart.length === 0}
                  className="rounded-md bg-emerald-600 px-5 py-2.5 text-base font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-30"
                >
                  Finalizar venda →
                </button>
              </div>
            </footer>
          </>
        )}
      </section>

      {/* Modal de finalizacao */}
      {finalizing && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Finalizar venda</h2>
            <p className="mt-1 text-sm text-slate-500">
              {cart.length} {cart.length === 1 ? 'item' : 'itens'} ·{' '}
              {fmtBRL(subtotal)}
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Forma de pagamento
                </label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPaymentMethod(m.value)}
                      className={`rounded-md border-2 px-3 py-2 text-sm font-medium ${
                        paymentMethod === m.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Desconto (opcional)
                </label>
                <input
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0,00"
                  inputMode="decimal"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Cliente (opcional)
                </label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nome"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Telefone"
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Observações (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="rounded-md bg-slate-50 p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium">{fmtBRL(subtotal)}</span>
                </div>
                {discountNum > 0 && (
                  <div className="mt-1 flex justify-between text-sm">
                    <span className="text-slate-600">Desconto</span>
                    <span className="font-medium text-red-600">
                      − {fmtBRL(discountNum)}
                    </span>
                  </div>
                )}
                <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="font-bold text-slate-900">{fmtBRL(total)}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFinalizing(false)}
                disabled={submitting}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-30"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={finalizarVenda}
                disabled={submitting || total <= 0}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? 'Salvando…' : 'Confirmar venda'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
