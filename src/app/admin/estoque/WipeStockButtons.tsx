'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import { Modal } from '@/app/admin/components/Modal';

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
  const titleId = useId();
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
          className="border-2 border-red-500 bg-white px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 transition cursor-pointer"
        >
          {COPY.wipe_stock.buttonLabel}
        </button>
        <button
          type="button"
          onClick={() => open('reset_quantities')}
          className="border-2 border-amber-500 bg-white px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-amber-700 hover:bg-amber-50 transition cursor-pointer"
        >
          {COPY.reset_quantities.buttonLabel}
        </button>
      </div>

      {success && (
        <div className="mt-2 border border-emerald-500 bg-emerald-50 p-2 font-mono text-xs font-bold text-emerald-950">
          ✓ {success}
        </div>
      )}

      <Modal open={!!active} onClose={close} titleId={titleId}>
        {active && (
          <>
            <h2 id={titleId} className="font-mono text-lg font-black uppercase tracking-tight text-red-700">{COPY[active].title}</h2>
            <div className="mt-3 border border-amber-300 bg-amber-50 p-3 font-mono text-xs text-amber-950">
              {COPY[active].warning}
            </div>

            <label className="mt-4 block">
              <span className="block font-mono text-xs font-bold uppercase tracking-wider text-zinc-700">
                Digite <code className="border border-zinc-300 bg-zinc-100 px-1 py-0.5 font-mono text-red-700 font-bold">{COPY[active].confirmText}</code> pra confirmar
              </span>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={COPY[active].confirmText}
                className="mt-2 block w-full border-2 border-zinc-950 px-3 py-2 font-mono text-xs text-zinc-950 placeholder:text-zinc-400 focus:outline-none"
                autoFocus
              />
            </label>

            {error && (
              <p className="mt-3 border border-red-300 bg-red-50 p-2 font-mono text-xs font-bold text-red-700">
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2 border-t-2 border-zinc-200 pt-4">
              <button
                type="button"
                onClick={close}
                disabled={submitting}
                className="border-2 border-zinc-950 bg-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={execute}
                disabled={submitting}
                className="border-2 border-red-600 bg-red-600 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-red-700 disabled:opacity-50 transition cursor-pointer"
              >
                {submitting ? 'Apagando…' : COPY[active].confirmText}
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}