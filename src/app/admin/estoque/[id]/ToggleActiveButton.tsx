'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import { Modal } from '@/app/admin/components/Modal';

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
  const titleId = useId();
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
        className={`border px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
          active
            ? 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
            : 'border-emerald-600 bg-emerald-50 text-emerald-950 hover:bg-emerald-100'
        }`}
      >
        {active ? 'Desativar' : 'Reativar'}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} titleId={titleId}>
        <h2 id={titleId} className="font-mono text-lg font-black uppercase tracking-tight text-zinc-950">
          {active ? 'Desativar item?' : 'Reativar item?'}
        </h2>
        <p className="mt-1 font-mono text-xs text-zinc-500">
          <strong className="text-zinc-950">{itemName}</strong>
        </p>

        <div className="mt-3 border border-zinc-300 bg-zinc-50 p-3 font-mono text-xs text-zinc-700">
          {active ? (
            <>
              Item vai <strong>sair da lista</strong> e do PDV (não dá mais pra
              bipar). Mas o <strong>histórico de vendas e movimentações</strong>
              {' '}fica intacto. Pode reativar depois.
            </>
          ) : (
            <>
              Item volta a aparecer na lista e no PDV (pronto pra bipar).
            </>
          )}
        </div>

        {error && (
          <p className="mt-3 border border-red-300 bg-red-50 p-2 font-mono text-xs font-bold text-red-700">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2 border-t-2 border-zinc-200 pt-4">
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={submitting}
            className="border-2 border-zinc-950 bg-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={toggle}
            disabled={submitting}
            className={`px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50 cursor-pointer ${
              active
                ? 'border-2 border-zinc-950 bg-zinc-950 hover:bg-zinc-800'
                : 'border-2 border-emerald-700 bg-emerald-700 hover:bg-emerald-800'
            }`}
          >
            {submitting ? 'Salvando…' : active ? 'Desativar' : 'Reativar'}
          </button>
        </div>
      </Modal>
    </>
  );
}
