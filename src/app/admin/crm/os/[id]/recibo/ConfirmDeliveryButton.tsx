'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/crm/lib/supabase/client';

export function ConfirmDeliveryButton({ osId, osNumber }: { osId: string; osNumber: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!name.trim()) {
      setError('Informe o nome de quem retirou');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const supabase = createCRMBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Sessao expirou. Faca login novamente.');
        setSubmitting(false);
        return;
      }

      const now = new Date().toISOString();

      // 1. Atualiza a OS
      const { error: updateErr } = await supabase
        .from('service_orders')
        .update({
          status: 'delivered',
          delivered_at: now,
          delivered_to_name: name.trim(),
        })
        .eq('id', osId);

      if (updateErr) {
        setError('Erro ao atualizar OS: ' + updateErr.message);
        setSubmitting(false);
        return;
      }

      // 2. Insere evento na timeline
      await supabase.from('service_order_events').insert({
        service_order_id: osId,
        event_type: 'delivered',
        to_value: `Entregue para ${name.trim()}`,
        author_id: user.id,
      });

      setOpen(false);
      router.refresh();
    } catch (e) {
      setError('Erro inesperado: ' + (e as Error).message);
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Confirmar entrega
        </button>
        <span className="text-xs text-slate-500">
          Marca a OS como entregue e registra quem retirou
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-emerald-200 bg-white p-3">
      <h3 className="text-sm font-semibold text-slate-900">Confirmar entrega da {osNumber}</h3>
      <p className="mt-1 text-xs text-slate-600">
        Quem retirou o aparelho? Pode ser o cliente ou outra pessoa autorizada.
      </p>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome completo de quem retirou"
        className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        autoFocus
      />
      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? 'Confirmando...' : 'Confirmar'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null); }}
          disabled={submitting}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}