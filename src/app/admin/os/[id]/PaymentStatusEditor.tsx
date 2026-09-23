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

  // Só pra feedback visual imediato (badge) — o valor que fica salvo em
  // service_orders.payment_status é recalculado no banco (trigger, ver
  // migration 0030), não escrito por este componente. Mesma fórmula dos
  // dois lados só pra badge e persistência baterem sempre.
  const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount), 0);
  const remaining = Math.max(0, grandTotal - totalPaid);
  const status: 'pending' | 'partial' | 'paid' =
    totalPaid <= 0 ? 'pending' : (grandTotal > 0 ? totalPaid >= grandTotal : totalPaid > 0) ? 'paid' : 'partial';

  function openRegister() {
    setAmount(
      remaining > 0
        ? remaining.toFixed(2).replace('.', ',')
        : grandTotal > 0
          ? grandTotal.toFixed(2).replace('.', ',')
          : '',
    );
    setError(null);
    setRegistering(true);
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
      // service_orders.payment_status é recalculado automaticamente
      // por trigger no banco (ver migration 0030/0034) — não precisa
      // (e não deve) ser escrito daqui.
      setRegistering(false);
      setSaving(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  async function deletePayment(id: string) {
    if (!confirm('Apagar esse pagamento? Só faz isso se foi um engano.')) return;
    setDeletingId(id);
    try {
      const supabase = createCRMBrowserClient();
      const { error: err } = await supabase.from('service_order_payments').delete().eq('id', id);
      if (err) throw err;
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeletingId(null);
    }
  }

  const badge =
    status === 'paid' ? (
      <span className="rounded bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-900">✓ Pago</span>
    ) : status === 'partial' ? (
      <span className="rounded bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-900">Parcial</span>
    ) : (
      <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">Pendente</span>
    );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        {badge}
        {canEdit && !registering && (
          <button
            type="button"
            onClick={openRegister}
            className="text-xs font-semibold text-zinc-900 underline hover:text-black"
          >
            {status === 'paid' ? '+ Adicionar pagamento' : 'Registrar pagamento'}
          </button>
        )}
      </div>

      {grandTotal > 0 ? (
        <p className="text-xs text-slate-600">
          Pago: <strong>{fmtBRL(totalPaid)}</strong> de {fmtBRL(grandTotal)}
          {remaining > 0 && (
            <>
              {' '}· falta <strong className="text-zinc-900">{fmtBRL(remaining)}</strong>
            </>
          )}
        </p>
      ) : totalPaid > 0 ? (
        <p className="text-xs text-slate-600">
          Pago: <strong>{fmtBRL(totalPaid)}</strong>
        </p>
      ) : null}

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
                    onClick={() => deletePayment(p.id)}
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
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
          <div className="grid grid-cols-3 gap-1.5">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMethod(m.value)}
                className={`rounded-md border-2 px-2 py-1.5 text-xs font-medium ${
                  method === m.value
                    ? 'border-black bg-zinc-100 text-black font-semibold'
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
              className="rounded-md bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
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
