'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/crm/lib/supabase/client';

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
        className="rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
      >
        ✕ Cancelar venda
      </button>

      {open && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Cancelar venda</h2>
            <p className="mt-1 text-sm text-slate-500">
              <span className="font-mono">{saleNumber}</span> — cancelamento
              estorna o estoque dos itens vendidos.
            </p>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700">
                Motivo (obrigatorio)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Ex: cliente desistiu, erro de digitacao, devolucao…"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
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
                Voltar
              </button>
              <button
                type="button"
                onClick={cancel}
                disabled={submitting || !reason.trim()}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Cancelando…' : 'Confirmar cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
