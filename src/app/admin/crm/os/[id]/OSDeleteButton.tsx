'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/crm/lib/supabase/client';

export function OSDeleteButton({
  osId,
  osShortId,
  isOwner,
}: {
  osId: string;
  osShortId: string;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOwner) return null;

  const canDelete = confirm.trim().toUpperCase() === 'APAGAR';

  async function handleDelete() {
    if (!canDelete) return;
    setDeleting(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      // Apaga primeiro os eventos (CASCADE ja faria, mas explicito e' mais seguro)
      await supabase
        .from('service_order_events')
        .delete()
        .eq('service_order_id', osId);
      // Depois a OS em si
      const { error: delErr } = await supabase
        .from('service_orders')
        .delete()
        .eq('id', osId);
      if (delErr) throw delErr;
      // Redireciona pra lista
      router.push('/admin/crm/os');
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setDeleting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
      >
        🗑️ Apagar esta OS
      </button>
    );
  }

  return (
    <section className="rounded-lg border-2 border-red-300 bg-red-50 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-red-900">
        ⚠️ Apagar {osShortId}?
      </h2>
      <p className="mt-2 text-xs text-red-800">
        Esta ação é <strong>irreversível</strong>. A OS, todos os eventos da timeline
        e qualquer foto associada serão apagados permanentemente.
      </p>

      <div className="mt-3">
        <label htmlFor="confirm-delete" className="block text-xs font-medium text-red-900">
          Digite <code className="rounded bg-red-100 px-1 py-0.5 font-mono text-red-800">APAGAR</code> para confirmar:
        </label>
        <input
          id="confirm-delete"
          type="text"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="off"
          className="mt-1 w-full rounded-md border border-red-300 bg-white px-2 py-1.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          placeholder="APAGAR"
        />
      </div>

      {error && (
        <p className="mt-2 rounded-md bg-red-100 p-2 text-xs text-red-900">{error}</p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setConfirm('');
            setError(null);
          }}
          disabled={deleting}
          className="flex-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={!canDelete || deleting}
          className="flex-1 rounded-md bg-red-600 px-2 py-1.5 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? 'Apagando…' : 'Apagar para sempre'}
        </button>
      </div>
    </section>
  );
}
