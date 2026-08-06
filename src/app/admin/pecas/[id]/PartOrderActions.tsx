'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import {
  RETURN_REASONS,
  EXCHANGE_ELIGIBLE_REASONS,
  type PartOrderStatusValue,
  type ReturnReasonValue,
} from '@/app/admin/types/database';

const TERMINAL_STATUSES: PartOrderStatusValue[] = ['applied', 'returned', 'cancelled'];
const CANCELLABLE_STATUSES: PartOrderStatusValue[] = ['ordered', 'received', 'return_pending', 'awaiting_exchange'];

export function PartOrderActions({
  orderId,
  status,
  returnReason,
  currentUserId,
}: {
  orderId: string;
  status: PartOrderStatusValue;
  returnReason: ReturnReasonValue | null;
  currentUserId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showReturnForm, setShowReturnForm] = useState(false);
  const [reason, setReason] = useState<ReturnReasonValue>('not_the_issue');
  const [returnNote, setReturnNote] = useState('');

  const [wantsExchange, setWantsExchange] = useState(true);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelNote, setCancelNote] = useState('');

  async function transition(opts: {
    newStatus: PartOrderStatusValue;
    eventType: string;
    note?: string | null;
    extraUpdate?: Record<string, unknown>;
  }) {
    setBusy(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      const { error: upErr } = await supabase
        .from('part_orders')
        .update({ status: opts.newStatus, ...opts.extraUpdate })
        .eq('id', orderId);
      if (upErr) throw upErr;

      await supabase.from('part_order_events').insert({
        part_order_id: orderId,
        event_type: opts.eventType,
        from_value: status,
        to_value: opts.newStatus,
        note: opts.note || null,
        author_id: currentUserId,
      });

      router.refresh();
      setShowReturnForm(false);
      setShowCancel(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (TERMINAL_STATUSES.includes(status)) {
    return (
      <section className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
        <p className="text-xs text-slate-500">
          Pedido finalizado ({status === 'applied' ? 'aplicado na OS' : status === 'returned' ? 'devolvido' : 'cancelado'}).
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-900">Ações</h2>

      {status === 'ordered' && (
        <button
          onClick={() => transition({ newStatus: 'received', eventType: 'received' })}
          disabled={busy}
          className="mt-3 w-full rounded-md bg-blue-600 px-4 py-3 text-base font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
        >
          {busy ? 'Salvando…' : '📦 Confirmar recebimento'}
        </button>
      )}

      {status === 'received' && !showReturnForm && (
        <div className="mt-3 space-y-2">
          <button
            onClick={() => transition({ newStatus: 'applied', eventType: 'applied' })}
            disabled={busy}
            className="w-full rounded-md bg-emerald-700 px-4 py-3 text-base font-bold text-white shadow-sm transition hover:bg-emerald-800 active:scale-95 disabled:opacity-50"
          >
            {busy ? 'Salvando…' : '✅ Aplicado — resolveu o problema'}
          </button>
          <button
            onClick={() => setShowReturnForm(true)}
            disabled={busy}
            className="w-full rounded-md border border-orange-300 bg-white px-4 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-50"
          >
            ↩️ Sinalizar devolução
          </button>
        </div>
      )}

      {status === 'received' && showReturnForm && (
        <div className="mt-3 space-y-2.5">
          <label className="block">
            <span className="block text-xs font-medium text-slate-600">Motivo *</span>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReturnReasonValue)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {RETURN_REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600">Observação (opcional)</span>
            <textarea
              value={returnNote}
              onChange={(e) => setReturnNote(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Aparece na timeline"
            />
          </label>
          {error && <p className="rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => setShowReturnForm(false)}
              disabled={busy}
              className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={() =>
                transition({
                  newStatus: 'return_pending',
                  eventType: 'return_signaled',
                  note: returnNote.trim() || RETURN_REASONS.find((r) => r.value === reason)?.label,
                  extraUpdate: { return_reason: reason },
                })
              }
              disabled={busy}
              className="flex-1 rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
            >
              {busy ? 'Salvando…' : 'Confirmar sinalização'}
            </button>
          </div>
        </div>
      )}

      {status === 'return_pending' && (
        <div className="mt-3 space-y-2.5">
          <p className="rounded-md bg-white p-2.5 text-sm text-slate-700 ring-1 ring-slate-200">
            Motivo: <strong>{RETURN_REASONS.find((r) => r.value === returnReason)?.label ?? '—'}</strong>
          </p>
          {returnReason && EXCHANGE_ELIGIBLE_REASONS.includes(returnReason) && (
            <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900">
              <input
                type="checkbox"
                checked={wantsExchange}
                onChange={(e) => setWantsExchange(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              Fornecedor vai repor (aguardar troca)
            </label>
          )}
          {error && <p className="rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</p>}
          <button
            onClick={() =>
              returnReason && EXCHANGE_ELIGIBLE_REASONS.includes(returnReason) && wantsExchange
                ? transition({ newStatus: 'awaiting_exchange', eventType: 'exchange_awaited' })
                : transition({ newStatus: 'returned', eventType: 'returned' })
            }
            disabled={busy}
            className="w-full rounded-md bg-slate-800 px-4 py-3 text-base font-bold text-white shadow-sm transition hover:bg-slate-900 active:scale-95 disabled:opacity-50"
          >
            {busy
              ? 'Salvando…'
              : returnReason && EXCHANGE_ELIGIBLE_REASONS.includes(returnReason) && wantsExchange
                ? '🚚 Confirmar devolução (aguardando troca)'
                : '🚚 Confirmar devolução'}
          </button>
        </div>
      )}

      {status === 'awaiting_exchange' && (
        <button
          onClick={() => transition({ newStatus: 'received', eventType: 'exchange_received', extraUpdate: { return_reason: null } })}
          disabled={busy}
          className="mt-3 w-full rounded-md bg-indigo-600 px-4 py-3 text-base font-bold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
        >
          {busy ? 'Salvando…' : '📦 Reposição chegou'}
        </button>
      )}

      {CANCELLABLE_STATUSES.includes(status) && !showCancel && (
        <button
          onClick={() => setShowCancel(true)}
          disabled={busy}
          className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50"
        >
          Cancelar pedido
        </button>
      )}

      {showCancel && (
        <div className="mt-2 space-y-2 rounded-md border border-red-200 bg-white p-2.5">
          <textarea
            value={cancelNote}
            onChange={(e) => setCancelNote(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Motivo do cancelamento"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowCancel(false)}
              disabled={busy}
              className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Voltar
            </button>
            <button
              onClick={() => transition({ newStatus: 'cancelled', eventType: 'cancelled', note: cancelNote.trim() || null })}
              disabled={busy}
              className="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {busy ? 'Salvando…' : 'Confirmar cancelamento'}
            </button>
          </div>
        </div>
      )}

      {error && !showReturnForm && !showCancel && (
        <p className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</p>
      )}
    </section>
  );
}
