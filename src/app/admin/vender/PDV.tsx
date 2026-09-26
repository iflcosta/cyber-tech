'use client';

import { useState, useRef, useEffect, useCallback, useMemo, useId } from 'react';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import { PAYMENT_METHODS, STOCK_CATEGORY_SUGGESTIONS, type PaymentMethodValue } from '@/app/admin/types/database';
import { Modal } from '@/app/admin/components/Modal';

type Item = {
  id: string;
  ean13: string | null;
  internal_sku?: string | null;
  shelf_location?: string | null;
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
  initialCustomer,
}: {
  items: Item[];
  currentUserId: string;
  currentUserName: string;
  /** Pré-vincula a venda a esse cliente (ex: veio da ficha do cliente). */
  initialCustomer?: { id: string; name: string; phone: string | null };
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [code, setCode] = useState('');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  // Modal de finalizar venda
  const finalizeTitleId = useId();
  const [finalizing, setFinalizing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodValue>('pix');
  const [customerName, setCustomerName] = useState(initialCustomer?.name ?? '');
  const [customerPhone, setCustomerPhone] = useState(initialCustomer?.phone ?? '');
  const [discount, setDiscount] = useState('');
  const [notes, setNotes] = useState('');

  // Busca cliente já cadastrado enquanto digita — mesmo padrão da tela
  // de Nova OS. Vincular a venda a um cliente existente (customer_id)
  // é o que permite ver o histórico de compras dele na ficha depois;
  // sem selecionar ninguém, continua indo como venda de balcão avulsa
  // (só o texto digitado, sem link).
  type CustomerMatch = { id: string; name: string; phone: string | null };
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerMatch | null>(
    initialCustomer ?? null,
  );
  const [customerMatches, setCustomerMatches] = useState<CustomerMatch[]>([]);
  const [searchingCustomer, setSearchingCustomer] = useState(false);

  // Modal "cadastrar peça e vender" — pra montagem de computador: peça
  // (processador, placa-mãe, GPU...) que ainda não tá no catálogo de
  // estoque. Cadastra o item, registra a entrada (compra da peça pra
  // essa montagem) e já bota no carrinho — a saída acontece normal,
  // junto com o resto da venda, quando finalizar.
  const newPartTitleId = useId();
  const [addingPart, setAddingPart] = useState(false);
  const [newPartName, setNewPartName] = useState('');
  const [newPartCategory, setNewPartCategory] = useState('');
  const [newPartPrice, setNewPartPrice] = useState('');
  const [newPartQty, setNewPartQty] = useState('1');
  const [newPartSubmitting, setNewPartSubmitting] = useState(false);
  const [newPartError, setNewPartError] = useState<string | null>(null);

  // Mantem foco no input sempre (leitor USB-HID bipa rapido)
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Busca cliente já cadastrado enquanto digita nome/telefone no
  // fechamento da venda — evita duplicar cadastro e é o que liga a
  // venda ao histórico do cliente.
  useEffect(() => {
    if (!finalizing || selectedCustomer) return;
    const digits = customerPhone.replace(/\D/g, '');
    const nameQuery = customerName.trim();
    if (digits.length < 4 && nameQuery.length < 3) {
      setCustomerMatches([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearchingCustomer(true);
      try {
        const supabase = createCRMBrowserClient();
        let query = supabase.from('customers').select('id, name, phone').limit(5);
        query = digits.length >= 4
          ? query.ilike('phone_search', `%${digits}%`)
          : query.ilike('name', `%${nameQuery}%`);
        const { data } = await query;
        setCustomerMatches((data ?? []) as CustomerMatch[]);
      } finally {
        setSearchingCustomer(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [customerPhone, customerName, selectedCustomer, finalizing]);

  function pickCustomer(match: CustomerMatch) {
    setSelectedCustomer(match);
    setCustomerName(match.name);
    setCustomerPhone(match.phone ?? '');
    setCustomerMatches([]);
  }

  function clearCustomerSelection() {
    setSelectedCustomer(null);
    setCustomerName('');
    setCustomerPhone('');
  }

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

  function openAddPart() {
    setNewPartName(search.trim());
    setNewPartCategory('');
    setNewPartPrice('');
    setNewPartQty('1');
    setNewPartError(null);
    setAddingPart(true);
  }

  // Cadastra a peça no catálogo (current_stock começa em 0, igual ao
  // fluxo normal de "Novo item" em Estoque), registra a ENTRADA da
  // quantidade comprada pra essa montagem (current_stock sobe via
  // trigger) e já adiciona ao carrinho. A SAÍDA acontece no fluxo
  // normal do PDV quando a venda for finalizada — fica o rastro
  // completo: peça entrou pra montar, peça saiu na venda.
  async function submitNewPart() {
    const name = newPartName.trim();
    if (!name) {
      setNewPartError('Nome é obrigatório.');
      return;
    }
    const price = parseBRL(newPartPrice);
    if (price === null || price <= 0) {
      setNewPartError('Preço de venda é obrigatório e deve ser maior que zero.');
      return;
    }
    const qty = parseInt(newPartQty, 10);
    if (!Number.isFinite(qty) || qty <= 0) {
      setNewPartError('Quantidade deve ser maior que zero.');
      return;
    }

    setNewPartSubmitting(true);
    setNewPartError(null);
    try {
      const supabase = createCRMBrowserClient();

      const { data: newItem, error: insErr } = await supabase
        .from('stock_items')
        .insert({
          name,
          category: newPartCategory.trim() || null,
          unit_price: price,
        })
        .select('id, ean13, internal_sku, name, brand, model, unit_price, current_stock, min_stock')
        .single();
      if (insErr) throw insErr;

      const { error: movErr } = await supabase.from('stock_movements').insert({
        stock_item_id: newItem.id,
        movement_type: 'in',
        quantity: qty,
        unit_price: price,
        total_amount: price * qty,
        reference: null,
        notes: 'Peça comprada pra montagem de computador (venda PDV)',
        author_id: currentUserId,
      });
      if (movErr) throw movErr;

      addItem({ ...newItem, current_stock: qty }, qty);
      setAddingPart(false);
      setSearch('');
      setNewPartSubmitting(false);
      inputRef.current?.focus();
    } catch (e) {
      setNewPartError((e as Error).message);
      setNewPartSubmitting(false);
    }
  }

  // Processa codigo digitado/bipado (Enter submete)
  function submitCode(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim();
    if (!c) return;

    // 1. Tenta por EAN-13 (fornecedor) ou SKU interno (Cyber)
    const cUpper = c.toUpperCase();
    let found = items.find((i) => i.ean13 === c)
              ?? items.find((i) => i.internal_sku === cUpper);
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
        p_customer_id: selectedCustomer?.id ?? null,
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
      window.open(`/admin/vendas/${saleId}/recibo`, '_blank');
      // Limpa carrinho pra proxima venda
      setCart([]);
      setFinalizing(false);
      setDiscount('');
      setNotes('');
      setCustomerName('');
      setCustomerPhone('');
      setSelectedCustomer(null);
      setCustomerMatches([]);
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
          (i.ean13?.includes(s) ?? false) ||
                      (i.internal_sku?.toUpperCase().includes(s.toUpperCase()) ?? false),
      )
      .slice(0, 8);
  }, [search, items]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">PDV Rápido · Balcão Cyber</h1>
          <p className="text-xs text-slate-500">
            Bipe o código de barras/SKU ou digite o nome. Operador: <span className="font-semibold text-slate-700">{currentUserName}</span>.
          </p>
        </div>
      </div>

      {/* Input de bipagem — SEMPRE com autofocus (leitor envia rapido) */}
      <form
        onSubmit={submitCode}
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
      >
        <label className="block">
          <span className="block text-xs font-mono font-bold uppercase tracking-wider text-sky-700">
            Bipar / buscar (EAN-13 ou SKU Interno)
          </span>
          <input
            ref={inputRef}
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Bipe o código ou digite o SKU/nome do item…"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-lg font-mono text-slate-900 placeholder-slate-400 focus:border-sky-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600/20"
          />
        </label>
        {flash && (
          <p className="mt-2 text-sm font-semibold text-emerald-700">{flash}</p>
        )}
      </form>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>
      )}

      {/* Busca manual (caso leitor nao funcione) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ou busque manualmente por nome, marca ou SKU…"
          aria-label="Buscar item por nome ou marca"
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
        />
        <button
          type="button"
          onClick={openAddPart}
          className="mt-2 text-xs font-semibold text-sky-700 hover:text-sky-800 transition cursor-pointer"
        >
          ➕ Não achou? Cadastrar peça nova e vender
          {search.trim() && <span className="text-slate-500"> — &quot;{search.trim()}&quot;</span>}
        </button>
        {searchSuggestions.length > 0 && (
          <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100 pt-2">
            {searchSuggestions.map((i) => (
              <li
                key={i.id}
                className="flex items-center justify-between gap-2 py-2 text-sm hover:bg-slate-50 px-2 rounded-lg transition"
              >
                <button
                  type="button"
                  onClick={() => {
                    addItem(i);
                    setSearch('');
                  }}
                  className="flex-1 text-left hover:text-sky-700 transition cursor-pointer"
                >
                  <span className="font-bold text-slate-900">{i.name}</span>
                  {i.brand && (
                    <span className="ml-1 text-xs text-slate-500">· {i.brand}</span>
                  )}
                  {i.internal_sku && (
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                      {i.internal_sku}
                    </span>
                  )}
                  {i.shelf_location && (
                    <span className="ml-1.5 rounded bg-sky-50 px-1.5 py-0.5 text-[11px] font-semibold text-sky-700 border border-sky-200">
                      📍 {i.shelf_location}
                    </span>
                  )}
                  {i.ean13 && (
                    <span className="ml-2 font-mono text-xs text-slate-400">
                      {i.ean13}
                    </span>
                  )}
                </button>
                <span className="text-xs font-semibold text-slate-600">
                  {i.current_stock} em estoque · <span className="font-mono text-emerald-700">{fmtBRL(i.unit_price)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Carrinho */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <header className="border-b border-slate-200 px-4 py-3 bg-slate-50">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">
            Carrinho ({cart.length})
          </h2>
        </header>
        {cart.length === 0 ? (
          <p className="p-8 text-center text-xs font-mono text-slate-500">
            Bipe um código ou adicione um item acima para começar.
          </p>
        ) : (
          <>
            <ul className="divide-y divide-slate-200 font-mono text-xs text-slate-700">
              {cart.map((c) => (
                <li key={c.stock_item_id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/80">
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">{c.name}</p>
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
                    className="w-16 rounded-md border border-slate-300 bg-white px-2 py-1 text-center font-mono text-sm text-slate-900 focus:border-sky-600 focus:outline-none"
                  />
                  <span className="w-24 text-right font-mono font-bold text-emerald-700">
                    {fmtBRL(c.unit_price * c.quantity)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(c.stock_item_id)}
                    className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
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
                  <p className="text-xl font-black font-mono text-emerald-700">
                    {fmtBRL(subtotal)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFinalizing(true)}
                  disabled={cart.length === 0}
                  className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-emerald-700 transition disabled:opacity-30 cursor-pointer"
                >
                  Finalizar venda →
                </button>
              </div>
            </footer>
          </>
        )}
      </section>

      {/* Modal de finalizacao */}
      <Modal open={finalizing} onClose={() => setFinalizing(false)} titleId={finalizeTitleId}>
            <h2 id={finalizeTitleId} className="text-lg font-bold text-slate-900">Finalizar venda</h2>
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
                {selectedCustomer ? (
                  <div className="mt-1 flex items-center justify-between gap-2 rounded-md border-2 border-emerald-300 bg-emerald-50 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{selectedCustomer.name}</p>
                      {selectedCustomer.phone && (
                        <p className="text-xs text-slate-600">{selectedCustomer.phone}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={clearCustomerSelection}
                      className="text-xs font-medium text-slate-600 underline hover:text-slate-800"
                    >
                      Trocar
                    </button>
                  </div>
                ) : (
                  <>
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
                    {searchingCustomer && (
                      <p className="mt-1 text-xs text-slate-500">Buscando cliente cadastrado…</p>
                    )}
                    {customerMatches.length > 0 && (
                      <ul className="mt-1 space-y-1 rounded-md border border-blue-200 bg-blue-50/60 p-1.5">
                        {customerMatches.map((m) => (
                          <li key={m.id}>
                            <button
                              type="button"
                              onClick={() => pickCustomer(m)}
                              className="flex w-full items-center justify-between gap-2 rounded-md border border-blue-200 bg-white px-2.5 py-1.5 text-left text-xs hover:border-blue-400 hover:bg-blue-50"
                            >
                              <span className="font-medium text-slate-900">{m.name}</span>
                              <span className="text-slate-500">{m.phone}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-1 text-xs text-slate-500">
                      Sem cliente cadastrado? Só digite o nome — a venda fica de balcão.
                    </p>
                  </>
                )}
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
                className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {submitting ? 'Salvando…' : 'Confirmar venda'}
              </button>
            </div>
      </Modal>

      {/* Modal "cadastrar peça e vender" — montagem de computador */}
      <Modal open={addingPart} onClose={() => setAddingPart(false)} titleId={newPartTitleId}>
        <h2 id={newPartTitleId} className="text-lg font-bold text-slate-900">
          Cadastrar peça e vender
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Pra montagem de computador: cadastra a peça no catálogo, registra a entrada
          (compra pra essa montagem) e já bota no carrinho. A saída acontece normal, junto
          com o resto da venda.
        </p>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="block text-sm font-medium text-slate-700">Nome *</span>
            <input
              autoFocus
              value={newPartName}
              onChange={(e) => setNewPartName(e.target.value)}
              placeholder="Ex: Processador Ryzen 5 5600"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-slate-700">Categoria (opcional)</span>
            <input
              list="pdv-new-part-category-suggestions"
              value={newPartCategory}
              onChange={(e) => setNewPartCategory(e.target.value)}
              placeholder="Ex: Processadores"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <datalist id="pdv-new-part-category-suggestions">
              {STOCK_CATEGORY_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-sm font-medium text-slate-700">Preço de venda *</span>
              <input
                value={newPartPrice}
                onChange={(e) => setNewPartPrice(e.target.value)}
                placeholder="0,00"
                inputMode="decimal"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-slate-700">Quantidade</span>
              <input
                type="number"
                min="1"
                value={newPartQty}
                onChange={(e) => setNewPartQty(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        {newPartError && (
          <p className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{newPartError}</p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setAddingPart(false)}
            disabled={newPartSubmitting}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-30"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submitNewPart}
            disabled={newPartSubmitting}
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {newPartSubmitting ? 'Cadastrando…' : 'Cadastrar e adicionar'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
