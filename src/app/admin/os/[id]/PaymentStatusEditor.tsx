'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import { PAYMENT_METHODS, type PaymentMethodValue } from '@/app/admin/types/database';
import { formatDateTimeBR } from '@/app/admin/lib/datetime';

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseBRL(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number(v.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

type Payment = {
  id: string;
  amount: number;
  payment_method: PaymentMethodValue;
  paid_at: string;
};

/**
 * Pagamento da OS — registra CADA pagamento recebido (não só um
 * booleano pago/não pago), porque é comum receber parcial na entrega
 * e o resto depois. "Restante" é sempre total da OS (mão de obra +
 * peças) menos a soma do que já foi registrado aqui.
 */
export function PaymentStatusEditor({
  osId,
  grandTotal,
  payments,
  canEdit,
  canDelete,
}: {
  osId: string;
  grandTotal: number;
  payments: Payment[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [registering, setRegistering] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethodValue>('pix');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount), 0);
  const remaining = Math.max(0, grandTotal - totalPaid);
  const status: 'pending' | 'partial' | 'paid' =
    totalPaid <= 0 ? 'pending' : totalPaid >= grandTotal && grandTotal > 0 ? 'paid' : 'partial';

  function openRegister() {
    setAmount(remaining > 0 ? remaining.toFixed(2).replace('.', ',') : '');
    setError(null);
    setRegistering(true);
  }

  async function syncStatus(newTotalPaid: number) {
    const newStatus: 'pending' | 'partial' | 'paid' =
      newTotalPaid <= 0 ? 'pending' : newTotalPaid >= grandTotal && grandTotal > 0 ? 'paid' : 'partial';
    await createCRMBrowserClient()
      .from('service_orders')
      .update({ payment_status: newStatus })
      .eq('id', osId);
  }

  async function registerPayment() {
    const num = parseBRL(amount);
    if (num === null || num <= 0) {
      setError('Valor inválido.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      const { data: userData } = await supabase.auth.getUser();
      const { error: err } = await supabase.from('service_order_payments').insert({
        service_order_id: osId,
        amount: num,
        payment_method: method,
        author_id: userData.user?.id,
      } as never);
      if (err) throw err;
      await syncStatus(totalPaid + num);
      setRegistering(false);
      setSaving(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  async function deletePayment(id: string, paidAmount: number) {
    if (!confirm('Apagar esse pagamento? Só faz isso se foi um engano.')) return;
    setDeletingId(id);
    try {
      const supabase = createCRMBrowserClient();
      const { error: err } = await supabase.from('service_order_payments').delete().eq('id', id);
      if (err) throw err;
      await syncStatus(totalPaid - paidAmount);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeletingId(null);
    }
  }

  const badge =
    status === 'paid' ? (
      <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">✓ Pago</span>
    ) : status === 'partial' ? (
      <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">Parcial</span>
    ) : (
      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Pendente</span>
    );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        {badge}
        {canEdit && remaining > 0 && !registering && (
          <button
            type="button"
            onClick={openRegister}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Registrar pagamento
          </button>
        )}
      </div>

      {grandTotal > 0 && (
        <p className="text-xs text-slate-600">
          Pago: <strong>{fmtBRL(totalPaid)}</strong> de {fmtBRL(grandTotal)}
          {remaining > 0 && (
            <>
              {' '}· falta <strong className="text-amber-700">{fmtBRL(remaining)}</strong>
            </>
          )}
        </p>
      )}

      {payments.length > 0 && (
        <ul className="space-y-1 border-t border-slate-100 pt-2">
          {payments.map((p) => {
            const methodLabel = PAYMENT_METHODS.find((m) => m.value === p.payment_method)?.label ?? p.payment_method;
            return (
              <li key={p.id} className="flex items-center justify-between gap-2 text-xs text-slate-600">
                <span>
                  {fmtBRL(Number(p.amount))} · {methodLabel} · {formatDateTimeBR(p.paid_at)}
                </span>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => deletePayment(p.id, Number(p.amount))}
                    disabled={deletingId === p.id}
                    className="text-slate-400 hover:text-red-600 disabled:opacity-30"
                    aria-label="Apagar pagamento"
                  >
                    ✕
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {registering && (
        <div className="space-y-2 border-t border-slate-100 pt-2">
          <input
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            inputMode="decimal"
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
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
              onClick={() => setRegistering(false)}
              disabled={saving}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-30"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={registerPayment}
              disabled={saving}
              className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {saving ? 'Salvando…' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}

      {!registering && error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
