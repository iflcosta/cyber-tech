'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/crm/lib/supabase/client';

export function ToggleActiveButton({
  itemId,
  itemName,
  active,
}: {
  itemId: string;
  itemName: string;
  active: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      const { error: updErr } = await supabase
        .from('stock_items')
        .update({ active: !active })
        .eq('id', itemId);
      if (updErr) throw updErr;
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
          active
            ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            : 'border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50'
        }`}
      >
        {active ? 'Desativar' : 'Reativar'}
      </button>

      {open && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">
              {active ? 'Desativar item?' : 'Reativar item?'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              <strong>{itemName}</strong>
            </p>

            <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
              {active ? (
                <>
                  Item vai <strong>sair da lista</strong> e do PDV (nao da mais pra
                  bipar). Mas o <strong>historico de vendas e movimentacoes</strong>
                  {' '}fica intacto. Pode reativar depois.
                </>
              ) : (
                <>
                  Item volta a aparecer na lista e no PDV (pronto pra bipar).
                </>
              )}
            </div>

            {error && (
              <p className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-30"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={toggle}
                disabled={submitting}
                className={`rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                  active
                    ? 'bg-slate-600 hover:bg-slate-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {submitting ? 'Salvando…' : active ? 'Desativar' : 'Reativar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
