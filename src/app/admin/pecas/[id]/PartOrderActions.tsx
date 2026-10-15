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
  serviceOrderId,
  serviceOrderShortId,
  partDescription = '',
  partVariant,
  partValue = 0,
}: {
  orderId: string;
  status: PartOrderStatusValue;
  returnReason: ReturnReasonValue | null;
  currentUserId: string;
  serviceOrderId?: string | null;
  serviceOrderShortId?: string | null;
  partDescription?: string;
  partVariant?: string | null;
  partValue?: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const [applyPrice, setApplyPrice] = useState(
    partValue > 0 ? partValue.toFixed(2).replace('.', ',') : '0,00'
  );

  const [showReturnForm, setShowReturnForm] = useState(false);
  const [reason, setReason] = useState<ReturnReasonValue>('not_the_issue');
  const [returnNote, setReturnNote] = useState('');

  const [wantsExchange, setWantsExchange] = useState(true);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelNote, setCancelNote] = useState('');

  async function handleApply() {
    if (serviceOrderId) {
      setShowApplyConfirm(true);
      return;
    }
    await transition({ newStatus: 'applied', eventType: 'applied' });
  }

  async function confirmApplyToOS() {
    setBusy(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      const itemName = [partDescription, partVariant].filter(Boolean).join(' - ');
      const cleanPrice = Number(applyPrice.replace(/\./g, '').replace(',', '.'));
      const numValue = Number.isFinite(cleanPrice) && cleanPrice > 0 ? cleanPrice : (partValue || 0);

      if (serviceOrderId && numValue > 0) {
        // Lança saída de estoque atômica para a OS
        const { error: rpcErr } = await supabase.rpc(
          'create_stock_item_and_use',
          {
            p_name: itemName || 'Peça Encomendada',
            p_unit_price: numValue,
            p_quantity: 1,
            p_service_order_id: serviceOrderId,
            p_category: 'Peça Encomendada',
          } as never,
        );
        if (rpcErr) throw rpcErr;

        // Atualiza valor estimado da OS para refletir no recibo e portal
        try {
          const { data: currentOS } = await supabase
            .from('service_orders')
            .select('estimated_value')
            .eq('id', serviceOrderId)
            .single();

          if (currentOS) {
            const currentEst = Number(currentOS.estimated_value || 0);
            const newEst = Math.round((currentEst + numValue) * 100) / 100;
            await supabase
              .from('service_orders')
              .update({
                estimated_value: newEst,
                updated_at: new Date().toISOString(),
              })
              .eq('id', serviceOrderId);
          }
        } catch {
          // não bloqueia
        }
      }

      // Atualiza status do pedido
      const { error: upErr } = await supabase
        .from('part_orders')
        .update({ status: 'applied', updated_at: new Date().toISOString() })
        .eq('id', orderId);
      if (upErr) throw upErr;

      await supabase.from('part_order_events').insert({
        part_order_id: orderId,
        event_type: 'applied',
        from_value: status,
        to_value: 'applied',
        note: serviceOrderId
          ? `Peça aplicada e debitada automaticamente na OS #${serviceOrderShortId ?? ''} (R$ ${numValue.toFixed(2)})`
          : 'Peça aplicada com sucesso',
        author_id: currentUserId,
      });

      setShowApplyConfirm(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

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
      <section className="border-2 border-zinc-950 bg-zinc-50 p-4 text-center space-y-2">
        <p className="font-mono text-xs font-bold text-zinc-950">
          {status === 'applied'
            ? '✅ Pedido Finalizado — Peça Aplicada'
            : status === 'returned'
              ? '↩️ Pedido Finalizado — Devolvido'
              : '❌ Pedido Cancelado'}
        </p>
        {status === 'applied' && serviceOrderId && (
          <p className="font-mono text-[11px] text-zinc-600">
            Lançada na{' '}
            <a
              href={`/admin/os/${serviceOrderId}`}
              className="font-bold underline text-emerald-800 hover:text-emerald-950"
            >
              OS #{serviceOrderShortId}
            </a>
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="border-2 border-zinc-950 bg-zinc-50 p-4">
      <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-950">Ações do Pedido</h2>

      {status === 'ordered' && (
        <button
          onClick={() => transition({ newStatus: 'received', eventType: 'received' })}
          disabled={busy}
          className="mt-3 w-full border-2 border-zinc-950 bg-zinc-950 px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider text-white transition hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
        >
          {busy ? 'Salvando…' : '📦 Confirmar recebimento'}
        </button>
      )}

      {status === 'received' && !showReturnForm && !showApplyConfirm && (
        <div className="mt-3 space-y-2">
          <button
            onClick={handleApply}
            disabled={busy}
            className="w-full border-2 border-zinc-950 bg-zinc-950 px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider text-white transition hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
          >
            {busy ? 'Salvando…' : '✅ Aplicado — debitar e vincular na OS'}
          </button>
          <button
            onClick={() => setShowReturnForm(true)}
            disabled={busy}
            className="w-full border-2 border-zinc-950 bg-white px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition cursor-pointer"
          >
            ↩️ Sinalizar devolução
          </button>
        </div>
      )}

      {/* Confirmação de Aplicação Automática na OS */}
      {status === 'received' && showApplyConfirm && (
        <div className="mt-3 space-y-3 border-2 border-emerald-600 bg-emerald-50/50 p-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🔬</span>
            <h3 className="font-mono text-xs font-black uppercase text-emerald-950">
              Lançar Peça na OS #{serviceOrderShortId}
            </h3>
          </div>
          <p className="font-mono text-[11px] text-zinc-700 leading-snug">
            Ao confirmar, a peça <strong>{partDescription}</strong> será debitada do estoque e lançada automaticamente como custo de peça na OS vinculada.
          </p>

          <label className="block">
            <span className="block font-mono text-[10px] font-bold uppercase text-zinc-800">
              Valor da Peça a lançar na OS (R$)
            </span>
            <input
              type="text"
              value={applyPrice}
              onChange={(e) => setApplyPrice(e.target.value)}
              className="mt-1 w-full border border-zinc-400 bg-white px-2.5 py-1.5 font-mono text-xs font-bold text-zinc-950 focus:border-emerald-600 focus:outline-none"
              placeholder="0,00"
            />
          </label>

          {error && <p className="border border-red-300 bg-red-50 p-2 font-mono text-xs text-red-700">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={() => setShowApplyConfirm(false)}
              disabled={busy}
              className="flex-1 border-2 border-zinc-950 bg-white px-3 py-2 font-mono text-xs font-bold uppercase text-zinc-950 hover:bg-zinc-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={confirmApplyToOS}
              disabled={busy}
              className="flex-1 border-2 border-emerald-800 bg-emerald-800 px-3 py-2 font-mono text-xs font-bold uppercase text-white hover:bg-emerald-900 disabled:opacity-50 cursor-pointer"
            >
              {busy ? 'Gravando…' : 'Confirmar e Debitar'}
            </button>
          </div>
        </div>
      )}

      {status === 'received' && showReturnForm && (
        <div className="mt-3 space-y-2.5">
          <label className="block">
            <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-700">Motivo *</span>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReturnReasonValue)}
              className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2 font-mono text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
            >
              {RETURN_REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-700">Observação (opcional)</span>
            <textarea
              value={returnNote}
              onChange={(e) => setReturnNote(e.target.value)}
              rows={2}
              className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2 font-mono text-xs text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
              placeholder="Aparece na timeline"
            />
          </label>
          {error && <p className="border border-red-300 bg-red-50 p-2 font-mono text-xs text-red-700">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => setShowReturnForm(false)}
              disabled={busy}
              className="flex-1 border-2 border-zinc-950 bg-white px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 cursor-pointer"
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
              className="flex-1 border-2 border-amber-600 bg-amber-600 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
            >
              {busy ? 'Salvando…' : 'Confirmar sinalização'}
            </button>
          </div>
        </div>
      )}

      {status === 'return_pending' && (
        <div className="mt-3 space-y-2.5">
          <p className="border border-zinc-300 bg-white p-2.5 font-mono text-xs text-zinc-700">
            Motivo: <strong className="text-zinc-950">{RETURN_REASONS.find((r) => r.value === returnReason)?.label ?? '—'}</strong>
          </p>
          {returnReason && EXCHANGE_ELIGIBLE_REASONS.includes(returnReason) && (
            <label className="flex items-center gap-2 border border-zinc-300 bg-white px-3 py-2 font-mono text-xs text-zinc-950 cursor-pointer">
              <input
                type="checkbox"
                checked={wantsExchange}
                onChange={(e) => setWantsExchange(e.target.checked)}
                className="h-4 w-4 border-zinc-400 text-zinc-950 focus:ring-zinc-950"
              />
              Fornecedor vai repor (aguardar troca)
            </label>
          )}
          {error && <p className="border border-red-300 bg-red-50 p-2 font-mono text-xs text-red-700">{error}</p>}
          <button
            onClick={() =>
              returnReason && EXCHANGE_ELIGIBLE_REASONS.includes(returnReason) && wantsExchange
                ? transition({ newStatus: 'awaiting_exchange', eventType: 'exchange_awaited' })
                : transition({ newStatus: 'returned', eventType: 'returned' })
            }
            disabled={busy}
            className="w-full border-2 border-zinc-950 bg-zinc-950 px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider text-white transition hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
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
          className="mt-3 w-full border-2 border-zinc-950 bg-zinc-950 px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider text-white transition hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
        >
          {busy ? 'Salvando…' : '📦 Reposição chegou'}
        </button>
      )}

      {CANCELLABLE_STATUSES.includes(status) && !showCancel && (
        <button
          onClick={() => setShowCancel(true)}
          disabled={busy}
          className="mt-2 w-full border border-zinc-300 bg-white px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 cursor-pointer"
        >
          Cancelar pedido
        </button>
      )}

      {showCancel && (
        <div className="mt-2 space-y-2 border border-red-300 bg-white p-3">
          <textarea
            value={cancelNote}
            onChange={(e) => setCancelNote(e.target.value)}
            rows={2}
            className="w-full border border-zinc-300 bg-white px-3 py-2 font-mono text-xs text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
            placeholder="Motivo do cancelamento"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowCancel(false)}
              disabled={busy}
              className="flex-1 border-2 border-zinc-950 bg-white px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 cursor-pointer"
            >
              Voltar
            </button>
            <button
              onClick={() => transition({ newStatus: 'cancelled', eventType: 'cancelled', note: cancelNote.trim() || null })}
              disabled={busy}
              className="flex-1 border-2 border-red-600 bg-red-600 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
            >
              {busy ? 'Salvando…' : 'Confirmar cancelamento'}
            </button>
          </div>
        </div>
      )}

      {error && !showReturnForm && !showCancel && (
        <p className="mt-2 border border-red-300 bg-red-50 p-2 font-mono text-xs text-red-700">{error}</p>
      )}
    </section>
  );
}
