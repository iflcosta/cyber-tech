'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import { Modal } from '@/app/admin/components/Modal';

export function CancelSaleButton({
  saleId,
  saleNumber,
  disabled,
}: {
  saleId: string;
  saleNumber: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    if (!reason.trim()) {
      setError('Motivo eh obrigatorio.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      const { error: rpcErr } = await supabase.rpc('cancel_sale', {
        p_sale_id: saleId,
        p_reason: reason.trim(),
      } as never);
      if (rpcErr) throw rpcErr;
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  if (disabled) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-2 border-red-600 bg-white px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 transition"
      >
        ✕ Cancelar venda
      </button>

      <Modal open={open} onClose={() => setOpen(false)} titleId={titleId}>
        <h2 id={titleId} className="text-lg font-black uppercase tracking-tight text-zinc-950">Cancelar venda</h2>
        <p className="mt-1 text-xs font-mono uppercase text-zinc-600">
          <span className="font-bold text-zinc-950">{saleNumber}</span> — cancelamento
          estorna o estoque dos itens vendidos.
        </p>

        <div className="mt-4">
          <label htmlFor={`${titleId}-reason`} className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-950">
            Motivo (obrigatório)
          </label>
          <textarea
            id={`${titleId}-reason`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Ex: cliente desistiu, erro de digitação, devolução…"
            className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2 text-sm font-mono text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
          />
        </div>

        {error && (
          <p className="mt-3 border border-red-600 bg-red-50 p-2 font-mono text-xs font-bold uppercase text-red-700">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={submitting}
            className="border border-zinc-300 bg-white px-4 py-2 font-mono text-xs font-bold uppercase text-zinc-700 hover:border-zinc-950 hover:bg-zinc-100 disabled:opacity-30"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={cancel}
            disabled={submitting || !reason.trim()}
            className="border-2 border-red-600 bg-red-600 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-red-700 disabled:opacity-50"
          >
            {submitting ? 'Cancelando…' : 'Confirmar cancelamento'}
          </button>
        </div>
      </Modal>
    </>
  );
}
