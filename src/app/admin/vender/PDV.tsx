'use client';

import { useState, useRef, useEffect, useCallback, useMemo, useId } from 'react';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import { PAYMENT_METHODS, STOCK_CATEGORY_SUGGESTIONS, type PaymentMethodValue } from '@/app/admin/types/database';
import { Modal } from '@/app/admin/components/Modal';
import { ensureValidEAN13 } from '@/app/admin/components/Barcode128';

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
  const isSubmittingRef = useRef(false);

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
      inputRef.current?.focus();
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

  // Processa código digitado ou vindo do leitor
  const processScannedCode = useCallback(
    (raw: string) => {
      const c = raw.trim();
      if (!c) return;

      // 1. Tenta por EAN-13 (fornecedor) ou SKU interno (Cyber)
      const cUpper = c.toUpperCase();
      let found = items.find((i) => i.ean13 === c)
                ?? items.find((i) => i.internal_sku?.toUpperCase() === cUpper);

      // 2. Tenta pelos formatos automáticos gerados pela etiqueta da Cyber
      if (!found) {
        found = items.find((i) => {
          const shortHex = i.id.replace(/-/g, '').slice(0, 6).toUpperCase();
          const numericStr = (parseInt(shortHex, 16) % 900000 + 100000).toString();
          const generatedEan = ensureValidEAN13(i.ean13 || i.id);
          return (
            c === generatedEan ||
            cUpper === `CY${shortHex}` ||
            cUpper === `CY-${shortHex}` ||
            cUpper === `CY-SKU-${shortHex}` ||
            cUpper === shortHex ||
            c === numericStr ||
            i.id.toLowerCase() === c.toLowerCase()
          );
        });
      }

      // 3. Tenta por nome exato
      if (!found) found = items.find((i) => i.name.toLowerCase() === c.toLowerCase());
      // 4. Tenta match parcial no nome (se for digitado)
      if (!found && c.length >= 3) {
        found = items.find((i) =>
          i.name.toLowerCase().includes(c.toLowerCase()),
        );
      }

      if (!found) {
        setError(`Nenhum item com codigo "${c}".`);
        setCode('');
        inputRef.current?.focus();
        return;
      }
      addItem(found, 1);
      setCode('');
      inputRef.current?.focus();
    },
    [items, addItem],
  );

  function submitCode(e: React.FormEvent) {
    e.preventDefault();
    processScannedCode(code);
  }

  // Se veio redirecionado com ?scan=... (bipagem originada em qualquer tela do ERP)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const scanParam = params.get('scan');
    if (scanParam && items.length > 0) {
      processScannedCode(scanParam);
      window.history.replaceState({}, '', '/admin/vender');
    }
  }, [items, processScannedCode]);

  // Listener para evento disparado pelo scanner global (quando o operador estiver no PDV fora do input)
  useEffect(() => {
    function handleCustomScan(e: Event) {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        processScannedCode(customEvent.detail);
      }
    }
    window.addEventListener('cyber-barcode-scanned', handleCustomScan);
    return () => window.removeEventListener('cyber-barcode-scanned', handleCustomScan);
  }, [processScannedCode]);

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
    inputRef.current?.focus();
  }

  function removeItem(stockItemId: string) {
    setCart((prev) => prev.filter((c) => c.stock_item_id !== stockItemId));
    inputRef.current?.focus();
  }

  async function finalizarVenda(methodOverride?: PaymentMethodValue) {
    if (isSubmittingRef.current) return;
    if (cart.length === 0) {
      setError('Carrinho vazio.');
      return;
    }
    const chosenMethod = methodOverride || paymentMethod;
    isSubmittingRef.current = true;
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
        p_payment_method: chosenMethod,
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

      // Abre recibo em NOVA JANELA: gesto do user (clique em botao rapido ou F2/F3/F4)
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
      // Volta foco pro input de bipagem
      inputRef.current?.focus();
    } catch (e) {
      setError((e as Error).message);
      setFinalizing(false);
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  }

  // Atalhos de teclado no PDV:
  // F2 -> Venda Direta no PIX
  // F3 -> Venda Direta em Dinheiro
  // F4 -> Venda Direta no Cartao
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (addingPart) return;

      if (finalizing) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setFinalizing(false);
        }
        return;
      }

      if (cart.length > 0 && !submitting && !isSubmittingRef.current) {
        if (e.key === 'F2') {
          e.preventDefault();
          finalizarVenda('pix');
        } else if (e.key === 'F3') {
          e.preventDefault();
          finalizarVenda('cash');
        } else if (e.key === 'F4') {
          e.preventDefault();
          finalizarVenda('card');
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, submitting, addingPart, finalizing, paymentMethod, customerName, customerPhone, selectedCustomer, discountNum, notes]);

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
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-zinc-950 pb-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-950">PDV Rápido · Balcão Cyber</h1>
          <p className="text-xs font-mono uppercase text-zinc-600">
            Bipe o código de barras/SKU ou digite o nome. Operador: <span className="font-bold text-zinc-950">{currentUserName}</span>.
          </p>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-600">
          <span className="hidden sm:inline">Venda direta:</span>
          <span className="border border-emerald-600 bg-emerald-50 px-1.5 py-0.5 font-bold text-emerald-800">F2 PIX</span>
          <span className="border border-zinc-950 bg-zinc-100 px-1.5 py-0.5 font-bold text-zinc-950">F3 Dinheiro</span>
          <span className="border border-zinc-300 bg-white px-1.5 py-0.5 font-bold text-zinc-700">F4 Cartão</span>
        </div>
      </div>

      {/* Input de bipagem — SEMPRE com autofocus (leitor envia rapido) */}
      <form
        onSubmit={submitCode}
        className="border-2 border-zinc-950 bg-white p-4 shadow-sm"
      >
        <label className="block">
          <span className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-950">
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
            className="mt-2 w-full border border-zinc-300 bg-zinc-50 px-4 py-3 text-lg font-mono text-zinc-950 placeholder-zinc-400 focus:border-zinc-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
          />
        </label>
        {flash && (
          <p className="mt-2 text-xs font-mono font-bold uppercase text-emerald-700">{flash}</p>
        )}
      </form>

      {error && (
        <div className="border-2 border-red-600 bg-red-50 p-3 text-xs font-mono font-bold uppercase text-red-700">{error}</div>
      )}

      {/* Busca manual (caso leitor nao funcione) */}
      <div className="border border-zinc-300 bg-white p-4 shadow-sm">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ou busque manualmente por nome, marca ou SKU…"
          aria-label="Buscar item por nome ou marca"
          className="w-full border border-zinc-300 bg-white px-3.5 py-2 text-sm font-mono text-zinc-950 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
        />
        <button
          type="button"
          onClick={openAddPart}
          className="mt-2 text-xs font-mono font-bold uppercase text-zinc-950 hover:underline transition cursor-pointer"
        >
          ➕ Não achou? Cadastrar peça nova e vender
          {search.trim() && <span className="text-zinc-500"> — &quot;{search.trim()}&quot;</span>}
        </button>
        {searchSuggestions.length > 0 && (
          <ul className="mt-3 divide-y divide-zinc-200 border-t border-zinc-200 pt-2">
            {searchSuggestions.map((i) => (
              <li
                key={i.id}
                className="flex items-center justify-between gap-2 py-2 text-sm hover:bg-zinc-50 px-2 transition"
              >
                <button
                  type="button"
                  onClick={() => {
                    addItem(i);
                    setSearch('');
                  }}
                  className="flex-1 text-left hover:text-zinc-950 transition cursor-pointer"
                >
                  <span className="font-bold text-zinc-950">{i.name}</span>
                  {i.brand && (
                    <span className="ml-1 text-xs text-zinc-500">· {i.brand}</span>
                  )}
                  {i.internal_sku && (
                    <span className="ml-2 border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-zinc-900">
                      {i.internal_sku}
                    </span>
                  )}
                  {i.shelf_location && (
                    <span className="ml-1.5 border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-zinc-900">
                      📍 {i.shelf_location}
                    </span>
                  )}
                  {i.ean13 && (
                    <span className="ml-2 font-mono text-xs text-zinc-400">
                      {i.ean13}
                    </span>
                  )}
                </button>
                <span className="text-xs font-mono font-semibold text-zinc-600">
                  {i.current_stock} em estoque · <span className="font-mono font-bold text-zinc-950">{fmtBRL(i.unit_price)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Carrinho */}
      <section className="border-2 border-zinc-950 bg-white shadow-sm overflow-hidden">
        <header className="border-b-2 border-zinc-950 px-4 py-3 bg-zinc-100">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-950">
            Carrinho ({cart.length})
          </h2>
        </header>
        {cart.length === 0 ? (
          <p className="p-8 text-center text-xs font-mono uppercase text-zinc-500">
            Bipe um código ou adicione um item acima para começar.
          </p>
        ) : (
          <>
            <ul className="divide-y divide-zinc-200 font-mono text-xs text-zinc-800">
              {cart.map((c) => (
                <li key={c.stock_item_id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50">
                  <div className="flex-1">
                    <p className="font-bold text-zinc-950">{c.name}</p>
                    <p className="text-xs text-zinc-500">
                      {fmtBRL(c.unit_price)} cada · {c.stock_available} em estoque
                    </p>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max={c.stock_available}
                    value={c.quantity}
                    onChange={(e) => updateQty(c.stock_item_id, Number(e.target.value))}
                    className="w-16 border border-zinc-300 bg-white px-2 py-1 text-center font-mono text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
                  />
                  <span className="w-24 text-right font-mono font-bold text-zinc-950">
                    {fmtBRL(c.unit_price * c.quantity)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(c.stock_item_id)}
                    className="p-1 font-mono text-zinc-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                    aria-label="Remover"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            <footer className="border-t-2 border-zinc-950 bg-zinc-50 px-4 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-mono uppercase text-zinc-500">
                    Subtotal ({cart.reduce((acc, i) => acc + i.quantity, 0)} {cart.reduce((acc, i) => acc + i.quantity, 0) === 1 ? 'unidade' : 'unidades'})
                  </p>
                  <p className="text-2xl font-black font-mono text-zinc-950">
                    {fmtBRL(subtotal)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => finalizarVenda('pix')}
                    disabled={cart.length === 0 || submitting}
                    className="border-2 border-emerald-600 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-2 shadow-xs transition disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                    title="Confirmar e imprimir no PIX direto (Atalho: F2)"
                  >
                    <span>⚡ PIX</span>
                    <span className="rounded-none bg-emerald-800 px-1 py-0.5 text-[10px] font-mono">F2</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => finalizarVenda('cash')}
                    disabled={cart.length === 0 || submitting}
                    className="border-2 border-zinc-950 bg-zinc-950 hover:bg-zinc-800 text-white font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-2 shadow-xs transition disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                    title="Confirmar e imprimir em Dinheiro direto (Atalho: F3)"
                  >
                    <span>💵 Dinheiro</span>
                    <span className="rounded-none bg-zinc-800 px-1 py-0.5 text-[10px] font-mono">F3</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => finalizarVenda('card')}
                    disabled={cart.length === 0 || submitting}
                    className="border-2 border-zinc-950 bg-white hover:bg-zinc-100 text-zinc-950 font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-2 shadow-xs transition disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                    title="Confirmar e imprimir no Cartão direto (Atalho: F4)"
                  >
                    <span>💳 Cartão</span>
                    <span className="rounded-none bg-zinc-200 px-1 py-0.5 text-[10px] font-mono text-zinc-800">F4</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFinalizing(true)}
                    disabled={cart.length === 0 || submitting}
                    className="border border-zinc-400 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-mono text-xs font-semibold uppercase tracking-wider px-3 py-2 transition disabled:opacity-40 cursor-pointer"
                    title="Abrir opções com desconto, cliente identificado ou observações"
                  >
                    + Opções
                  </button>
                </div>
              </div>
            </footer>
          </>
        )}
      </section>

      {/* Modal de finalizacao */}
      <Modal open={finalizing} onClose={() => setFinalizing(false)} titleId={finalizeTitleId}>
            <h2 id={finalizeTitleId} className="text-lg font-black uppercase tracking-tight text-zinc-950">Finalizar venda</h2>
            <p className="mt-1 text-xs font-mono uppercase text-zinc-600">
              {cart.length} {cart.length === 1 ? 'item' : 'itens'} ·{' '}
              {fmtBRL(subtotal)}
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-950">
                  Forma de pagamento
                </label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPaymentMethod(m.value)}
                      className={`border-2 px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider transition ${
                        paymentMethod === m.value
                          ? 'border-zinc-950 bg-zinc-950 text-white'
                          : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-950'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-950">
                  Desconto (opcional)
                </label>
                <input
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0,00"
                  inputMode="decimal"
                  className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2 text-sm font-mono text-zinc-950 focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-950">
                  Cliente (opcional)
                </label>
                {selectedCustomer ? (
                  <div className="mt-1 flex items-center justify-between gap-2 border-2 border-zinc-950 bg-zinc-100 px-3 py-2">
                    <div>
                      <p className="text-sm font-bold text-zinc-950">{selectedCustomer.name}</p>
                      {selectedCustomer.phone && (
                        <p className="text-xs font-mono text-zinc-600">{selectedCustomer.phone}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={clearCustomerSelection}
                      className="text-xs font-mono font-bold uppercase text-zinc-700 underline hover:text-zinc-950"
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
                      className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2 text-sm font-mono text-zinc-950 focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
                    />
                    <input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Telefone"
                      className="mt-2 w-full border border-zinc-300 bg-white px-3 py-2 text-sm font-mono text-zinc-950 focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
                    />
                    {searchingCustomer && (
                      <p className="mt-1 text-xs font-mono text-zinc-500">Buscando cliente cadastrado…</p>
                    )}
                    {customerMatches.length > 0 && (
                      <ul className="mt-1 space-y-1 border border-zinc-300 bg-zinc-50 p-1.5">
                        {customerMatches.map((m) => (
                          <li key={m.id}>
                            <button
                              type="button"
                              onClick={() => pickCustomer(m)}
                              className="flex w-full items-center justify-between gap-2 border border-zinc-200 bg-white px-2.5 py-1.5 text-left text-xs font-mono hover:border-zinc-950 hover:bg-zinc-100"
                            >
                              <span className="font-bold text-zinc-950">{m.name}</span>
                              <span className="text-zinc-500">{m.phone}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-1 text-xs font-mono text-zinc-500">
                      Sem cliente cadastrado? Só digite o nome — a venda fica de balcão.
                    </p>
                  </>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-950">
                  Observações (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2 text-sm font-mono text-zinc-950 focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
                />
              </div>

              <div className="border border-zinc-300 bg-zinc-50 p-3 font-mono">
                <div className="flex justify-between text-xs uppercase text-zinc-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-zinc-950">{fmtBRL(subtotal)}</span>
                </div>
                {discountNum > 0 && (
                  <div className="mt-1 flex justify-between text-xs uppercase text-red-600">
                    <span>Desconto</span>
                    <span className="font-bold">
                      − {fmtBRL(discountNum)}
                    </span>
                  </div>
                )}
                <div className="mt-2 flex justify-between border-t border-zinc-300 pt-2 text-sm uppercase">
                  <span className="font-black text-zinc-950">Total</span>
                  <span className="font-black text-zinc-950">{fmtBRL(total)}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFinalizing(false)}
                disabled={submitting}
                className="border border-zinc-300 bg-white px-4 py-2 font-mono text-xs font-bold uppercase text-zinc-700 hover:bg-zinc-100 hover:border-zinc-950 disabled:opacity-30"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => finalizarVenda()}
                disabled={submitting || total <= 0}
                className="bg-zinc-950 hover:bg-zinc-800 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
              >
                {submitting ? 'Salvando…' : 'Confirmar venda'}
              </button>
            </div>
      </Modal>

      {/* Modal "cadastrar peça e vender" — montagem de computador */}
      <Modal open={addingPart} onClose={() => setAddingPart(false)} titleId={newPartTitleId}>
        <h2 id={newPartTitleId} className="text-lg font-black uppercase tracking-tight text-zinc-950">
          Cadastrar peça e vender
        </h2>
        <p className="mt-1 text-xs font-mono uppercase text-zinc-600">
          Pra montagem de computador: cadastra a peça no catálogo, registra a entrada
          (compra pra essa montagem) e já bota no carrinho.
        </p>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-950">Nome *</span>
            <input
              autoFocus
              value={newPartName}
              onChange={(e) => setNewPartName(e.target.value)}
              placeholder="Ex: Processador Ryzen 5 5600"
              className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2 text-sm font-mono text-zinc-950 focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
            />
          </label>

          <label className="block">
            <span className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-950">Categoria (opcional)</span>
            <input
              list="pdv-new-part-category-suggestions"
              value={newPartCategory}
              onChange={(e) => setNewPartCategory(e.target.value)}
              placeholder="Ex: Processadores"
              className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2 text-sm font-mono text-zinc-950 focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
            />
            <datalist id="pdv-new-part-category-suggestions">
              {STOCK_CATEGORY_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-950">Preço de venda *</span>
              <input
                value={newPartPrice}
                onChange={(e) => setNewPartPrice(e.target.value)}
                placeholder="0,00"
                inputMode="decimal"
                className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2 text-sm font-mono text-zinc-950 focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-950">Quantidade</span>
              <input
                type="number"
                min="1"
                value={newPartQty}
                onChange={(e) => setNewPartQty(e.target.value)}
                className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2 text-sm font-mono text-zinc-950 focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
              />
            </label>
          </div>
        </div>

        {newPartError && (
          <p className="mt-3 border border-red-600 bg-red-50 p-2 text-xs font-mono font-bold uppercase text-red-700">{newPartError}</p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setAddingPart(false)}
            disabled={newPartSubmitting}
            className="border border-zinc-300 bg-white px-4 py-2 font-mono text-xs font-bold uppercase text-zinc-700 hover:bg-zinc-100 hover:border-zinc-950 disabled:opacity-30"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submitNewPart}
            disabled={newPartSubmitting}
            className="bg-zinc-950 hover:bg-zinc-800 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
          >
            {newPartSubmitting ? 'Cadastrando…' : 'Cadastrar e adicionar'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
