'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/crm/lib/supabase/client';

type Action = 'wipe_stock' | 'reset_quantities';

interface Result {
  items_deleted?: number;
  items_reset?: number;
  movements_deleted?: number;
  sales_with_item_link_cleared?: number;
}

const COPY: Record<Action, {
  title: string;
  warning: string;
  confirmText: string;
  buttonLabel: string;
  successMsg: (r: Result) => string;
}> = {
  wipe_stock: {
    title: 'Apagar TODO o estoque',
    warning:
      'Apaga TODOS os itens + TODO o histórico de movimentações. ' +
      'Vendas antigas mantêm o nome do item gravado, mas perdem o link com o catálogo. ' +
      'Use pra começar o estoque do zero.',
    confirmText: 'APAGAR TUDO',
    buttonLabel: '🗑️ Apagar estoque inteiro',
    successMsg: (r) =>
      `${r.items_deleted} itens + ${r.movements_deleted} movimentações apagadas. ` +
      `${r.sales_with_item_link_cleared ?? 0} vendas mantidas (só o link foi removido).`,
  },
  reset_quantities: {
    title: 'Zerar quantidades (manter itens)',
    warning:
      'Zera o current_stock de TODOS os itens e apaga o histórico de movimentações. ' +
      'Os itens em si continuam cadastrados (nome, preço, categoria), só os números voltam a 0. ' +
      'Útil pra começar contagem física nova.',
    confirmText: 'ZERAR',
    buttonLabel: '🔄 Zerar quantidades',
    successMsg: (r) =>
      `${r.items_reset} itens zerados + ${r.movements_deleted} movimentações apagadas.`,
  },
};

export function WipeStockButtons() {
  const router = useRouter();
  const [active, setActive] = useState<Action | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function open(action: Action) {
    setActive(action);
    setConfirmText('');
    setError(null);
    setSuccess(null);
  }

  function close() {
    setActive(null);
    setConfirmText('');
    setError(null);
  }

  async function execute() {
    if (!active) return;
    const expected = COPY[active].confirmText;
    if (confirmText.trim().toUpperCase() !== expected) {
      setError(`Digite exatamente "${expected}" pra confirmar`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      const fn = active === 'wipe_stock' ? 'wipe_stock' : 'reset_stock_quantities';
      const { data, error: rpcErr } = await supabase.rpc(fn);
      if (rpcErr) throw rpcErr;
      const result = (data ?? {}) as Result;
      setSuccess(COPY[active].successMsg(result));
      setSubmitting(false);
      setActive(null);
      setConfirmText('');
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => open('wipe_stock')}
          className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
        >
          {COPY.wipe_stock.buttonLabel}
        </button>
        <button
          type="button"
          onClick={() => open('reset_quantities')}
          className="rounded-md border border-orange-300 bg-white px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-50"
        >
          {COPY.reset_quantities.buttonLabel}
        </button>
      </div>

      {success && (
        <div className="mt-2 rounded-md bg-emerald-50 p-2 text-xs text-emerald-800">
          ✓ {success}
        </div>
      )}

      {active && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h2 className="text-lg font-bold text-red-700">{COPY[active].title}</h2>
            <div className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
              {COPY[active].warning}
            </div>

            <label className="mt-4 block">
              <span className="block text-sm font-medium text-slate-700">
                Digite <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-red-700">{COPY[active].confirmText}</code> pra confirmar
              </span>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={COPY[active].confirmText}
                className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                autoFocus
              />
            </label>

            {error && (
              <p className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                disabled={submitting}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-30"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={execute}
                disabled={submitting}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Apagando…' : COPY[active].confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}