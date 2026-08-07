'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import { PAYMENT_METHODS, type PaymentMethodValue } from '@/app/admin/types/database';
import { formatDateTimeBR } from '@/app/admin/lib/datetime';

/**
 * Status de pagamento da OS — independente do status de entrega.
 * Existia caso real que motivou isso: computador entregue numa
 * farmácia pra avaliação, cliente só paga no dia seguinte se ficar
 * com o produto. Sem isso, "entreguei mas ainda não recebi" não tinha
 * onde ficar registrado.
 */
export function PaymentStatusEditor({
  osId,
  paymentStatus,
  paymentMethod,
  paidAt,
  canEdit,
}: {
  osId: string;
  paymentStatus: 'pending' | 'paid';
  paymentMethod: PaymentMethodValue | null;
  paidAt: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [marking, setMarking] = useState(false);
  const [method, setMethod] = useState<PaymentMethodValue>('pix');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markPaid() {
    setSaving(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      const { error: err } = await supabase
        .from('service_orders')
        .update({ payment_status: 'paid', payment_method: method, paid_at: new Date().toISOString() })
        .eq('id', osId);
      if (err) throw err;
      setMarking(false);
      setSaving(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  async function undoPaid() {
    if (!confirm('Desfazer o pagamento? Volta pra "Pendente".')) return;
    setSaving(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      const { error: err } = await supabase
        .from('service_orders')
        .update({ payment_status: 'pending', payment_method: null, paid_at: null })
        .eq('id', osId);
      if (err) throw err;
      setSaving(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  if (paymentStatus === 'paid') {
    const methodLabel = PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label ?? paymentMethod;
    return (
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
            ✓ Pago
          </span>
          <p className="mt-1 text-xs text-slate-500">
            {methodLabel}
            {paidAt && ` · ${formatDateTimeBR(paidAt)}`}
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={undoPaid}
            disabled={saving}
            className="text-xs text-slate-500 underline hover:text-slate-700 disabled:opacity-30"
          >
            Desfazer
          </button>
        )}
      </div>
    );
  }

  if (!marking) {
    return (
      <div className="flex items-center justify-between gap-2">
        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
          Pendente
        </span>
        {canEdit && (
          <button
            type="button"
            onClick={() => setMarking(true)}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Marcar como pago
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1.5">
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMethod(m.value)}
            className={`rounded-md border-2 px-2 py-1.5 text-xs font-medium ${
              method === m.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMarking(false)}
          disabled={saving}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-30"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={markPaid}
          disabled={saving}
          className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {saving ? 'Salvando…' : 'Confirmar pagamento'}
        </button>
      </div>
    </div>
  );
}
