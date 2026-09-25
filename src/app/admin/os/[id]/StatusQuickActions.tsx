'use client';

import { useId, useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import {
  OS_STATUSES,
  APPROVAL_METHODS,
  PAYMENT_METHODS,
  type OSStatusValue,
  type ApprovalMethodValue,
  type PaymentMethodValue,
} from '@/app/admin/types/database';
import { Modal } from '@/app/admin/components/Modal';

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseBRL(v: string): number | null {
  if (!v.trim()) return null;
  const normalized = v.includes(',')
    ? v.replace(/\./g, '').replace(',', '.')
    : v;
  const n = Number(normalized);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

const STATUS_FLOW: Record<OSStatusValue, OSStatusValue | null> = {
  awaiting_approval: 'approved',
  approved: 'in_progress',
  in_progress: 'ready',
  waiting_part: 'in_progress',
  ready: 'delivered',
  delivered: null,
  cancelled: null,
};

const STATUS_QUICK_LABEL: Partial<Record<OSStatusValue, string>> = {
  approved: '✅ Aprovar orçamento',
  in_progress: '🔧 Iniciar em bancada',
  waiting_part: '⏸️ Aguardando peça',
  ready: '📦 Marcar como Pronto',
  delivered: '🤝 Entregar aparelho',
};

function toWhatsAppLink(phone: string | null | undefined, message: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  const withCountry = digits.startsWith('55') && digits.length >= 12 ? digits : '55' + digits;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

export function StatusQuickActions({
  osId,
  currentStatus,
  currentUserId,
  currentUserName,
  customerPhone,
  customerName,
  osLabel,
  canEdit,
  currentEstimatedValue,
  currentLaborCost = 0,
  partsTotal = 0,
  grandTotal,
  reportedDefect,
  repairNotes,
  payments,
  paymentStatus,
}: {
  osId: string;
  currentStatus: string;
  currentUserId: string;
  currentUserName: string;
  customerPhone?: string | null;
  customerName?: string;
  osLabel?: string;
  canEdit: boolean;
  currentEstimatedValue?: number | null;
  currentLaborCost?: number;
  partsTotal?: number;
  grandTotal?: number;
  reportedDefect?: string;
  repairNotes?: string | null;
  payments?: { amount: number; payment_method: PaymentMethodValue }[];
  paymentStatus?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);

  const effectiveGrandTotal =
    (grandTotal ?? 0) > 0
      ? (grandTotal ?? 0)
      : currentLaborCost + partsTotal > 0
        ? currentLaborCost + partsTotal
        : Number(currentEstimatedValue ?? 0);

  const initialServiceVal =
    currentLaborCost > 0
      ? currentLaborCost
      : Math.max(0, Number(currentEstimatedValue ?? 0) - partsTotal);

  // Modal de aprovação unificado
  const approvalTitleId = useId();
  const [approving, setApproving] = useState(false);
  const [approvalMethod, setApprovalMethod] = useState<ApprovalMethodValue>('whatsapp');
  const [approvalServiceInput, setApprovalServiceInput] = useState(
    initialServiceVal > 0 ? initialServiceVal.toFixed(2).replace('.', ',') : '',
  );
  const [startBenchImmediately, setStartBenchImmediately] = useState(true);

  useEffect(() => {
    setApprovalServiceInput(
      initialServiceVal > 0 ? initialServiceVal.toFixed(2).replace('.', ',') : '',
    );
  }, [initialServiceVal]);

  // Modal de entrega
  const totalPaid = (payments ?? []).reduce((acc, p) => acc + Number(p.amount), 0);
  const remainingToPay = Math.max(0, effectiveGrandTotal - totalPaid);
  const isAlreadyPaid =
    paymentStatus === 'paid' || (totalPaid >= effectiveGrandTotal && effectiveGrandTotal > 0);

  const deliveryTitleId = useId();
  const [delivering, setDelivering] = useState(false);
  const [recipientName, setRecipientName] = useState(customerName ?? '');
  const [registerPaymentOnDelivery, setRegisterPaymentOnDelivery] = useState(
    !isAlreadyPaid && effectiveGrandTotal > 0,
  );
  const [paymentAmount, setPaymentAmount] = useState(
    remainingToPay > 0
      ? remainingToPay.toFixed(2).replace('.', ',')
      : effectiveGrandTotal > 0
        ? effectiveGrandTotal.toFixed(2).replace('.', ',')
        : '',
  );
  const [deliveryPayMethod, setDeliveryPayMethod] = useState<PaymentMethodValue>('pix');

  useEffect(() => {
    setRegisterPaymentOnDelivery(!isAlreadyPaid && effectiveGrandTotal > 0);
    setPaymentAmount(
      remainingToPay > 0
        ? remainingToPay.toFixed(2).replace('.', ',')
        : effectiveGrandTotal > 0
          ? effectiveGrandTotal.toFixed(2).replace('.', ',')
          : '',
    );
  }, [isAlreadyPaid, effectiveGrandTotal, remainingToPay]);

  if (!canEdit) return null;

  const nextOrNull = STATUS_FLOW[currentStatus as OSStatusValue];
  if (!nextOrNull) {
    return (
      <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-center">
        <p className="text-xs text-zinc-500">OS em status final ({currentStatus}).</p>
      </section>
    );
  }
  const next: OSStatusValue = nextOrNull;

  const secondary: OSStatusValue[] = (
    ['waiting_part', 'ready', 'cancelled'] as OSStatusValue[]
  ).filter((s) => s !== next && s !== currentStatus);

  async function changeTo(
    newStatus: OSStatusValue,
    note?: string,
    extraFields?: Record<string, unknown>,
  ) {
    setError(null);
    setActiveStatus(newStatus);
    try {
      const supabase = createCRMBrowserClient();
      const { error: upErr } = await supabase
        .from('service_orders')
        .update({ status: newStatus, ...extraFields })
        .eq('id', osId);
      if (upErr) throw upErr;

      await supabase.from('service_order_events').insert({
        service_order_id: osId,
        event_type: 'status_changed',
        from_value: currentStatus,
        to_value: newStatus,
        note: note ?? null,
        author_id: currentUserId,
      });

      if (newStatus === 'ready' && customerPhone) {
        const totalMsg =
          effectiveGrandTotal > 0 ? ` Valor total: ${fmtBRL(effectiveGrandTotal)}.` : '';
        const msg = `Olá ${customerName ?? ''}! Aqui é da Cyber Informática. Seu aparelho${
          osLabel ? ` (OS ${osLabel})` : ''
        } já está pronto para retirada.${totalMsg} 🙂`;
        const link = toWhatsAppLink(customerPhone, msg);
        if (link) window.open(link, '_blank');
      }

      startTransition(() => router.refresh());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActiveStatus(null);
    }
  }

  const isApprovalStep = currentStatus === 'awaiting_approval' && next === 'approved';

  function handleNextClick() {
    if (isApprovalStep) {
      setApproving(true);
      return;
    }
    if (next === 'delivered') {
      setDelivering(true);
      return;
    }
    changeTo(next);
  }

  function handleSecondaryClick(s: OSStatusValue) {
    if (s === 'delivered') {
      setDelivering(true);
      return;
    }
    changeTo(s);
  }

  function sendQuoteWhatsApp(customTotal?: number) {
    if (!customerPhone) return;
    const totalToSend = customTotal ?? effectiveGrandTotal;
    const serviceDesc = repairNotes?.trim() || reportedDefect || 'manutenção técnica';
    const valStr = totalToSend > 0 ? `\n*Valor total:* ${fmtBRL(totalToSend)}` : '';
    const msg = [
      `Olá *${customerName ?? ''}*! Aqui é da *Cyber Informática*.`,
      `Segue o orçamento referente à sua OS *${osLabel ?? ''}*:`,
      `• *Diagnóstico / Serviço:* ${serviceDesc}${valStr}`,
      ``,
      `Podemos prosseguir com o serviço?`,
    ].join('\n');
    const link = toWhatsAppLink(customerPhone, msg);
    if (link) window.open(link, '_blank');
  }

  async function confirmApproval() {
    const parsedService = parseBRL(approvalServiceInput) ?? 0;
    const totalApproved = parsedService + partsTotal;
    const targetStatus: OSStatusValue = startBenchImmediately ? 'in_progress' : 'approved';
    const methodLabel =
      APPROVAL_METHODS.find((m) => m.value === approvalMethod)?.label ?? approvalMethod;
    const valuePart = totalApproved > 0 ? ` — Total aprovado: ${fmtBRL(totalApproved)}` : '';
    const note = `Aprovado por ${methodLabel}${valuePart}`;

    setApproving(false);
    await changeTo(targetStatus, note, {
      labor_cost: parsedService,
      estimated_value: totalApproved > 0 ? totalApproved : null,
    });
  }

  async function confirmDelivery() {
    setError(null);
    setActiveStatus('delivered');
    const who = recipientName.trim() || customerName || 'Cliente';

    try {
      const supabase = createCRMBrowserClient();
      let paymentNote = '';
      let paidNum = 0;

      if (registerPaymentOnDelivery && !isAlreadyPaid) {
        const num = parseBRL(paymentAmount);
        if (num === null || num <= 0) {
          setError('Informe um valor de pagamento válido.');
          setActiveStatus(null);
          return;
        }
        paidNum = num;

        const { error: payErr } = await supabase.from('service_order_payments').insert({
          service_order_id: osId,
          amount: num,
          payment_method: deliveryPayMethod,
          author_id: currentUserId,
        } as never);
        if (payErr) throw payErr;

        const methodMeta =
          PAYMENT_METHODS.find((m) => m.value === deliveryPayMethod)?.label ?? deliveryPayMethod;
        paymentNote = ` · Pagamento de ${fmtBRL(num)} recebido via ${methodMeta}`;
      }

      const now = new Date().toISOString();
      const updatePayload: Record<string, unknown> = {
        status: 'delivered',
        delivered_at: now,
        delivered_to_name: who,
      };
      // Se a OS estava sem valor preenchido mas recebeu pagamento no ato, sincroniza o valor
      if (effectiveGrandTotal === 0 && paidNum > 0) {
        updatePayload.labor_cost = paidNum;
        updatePayload.estimated_value = paidNum;
      }

      const { error: upErr } = await supabase
        .from('service_orders')
        .update(updatePayload)
        .eq('id', osId);
      if (upErr) throw upErr;

      await supabase.from('service_order_events').insert({
        service_order_id: osId,
        event_type: 'delivered',
        from_value: currentStatus,
        to_value: 'delivered',
        note: `Aparelho entregue para ${who}${paymentNote}`,
        author_id: currentUserId,
      });

      setDelivering(false);
      startTransition(() => router.refresh());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActiveStatus(null);
    }
  }

  const modalServiceVal = parseBRL(approvalServiceInput) ?? 0;
  const modalTotalVal = modalServiceVal + partsTotal;

  return (
    <section className="rounded-lg border-2 border-zinc-300 bg-zinc-50 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
          Fluxo da OS
        </h2>
        <span className="text-xs font-medium text-zinc-600">
          Atual: <strong className="text-zinc-950">{OS_STATUSES.find((s) => s.value === currentStatus)?.label ?? currentStatus}</strong>
        </span>
      </div>

      <button
        type="button"
        onClick={handleNextClick}
        disabled={pending || activeStatus !== null}
        className="mt-3 w-full rounded-md bg-black px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-zinc-800 active:scale-95 disabled:opacity-50 cursor-pointer"
      >
        {activeStatus === next
          ? 'Salvando…'
          : `→ ${STATUS_QUICK_LABEL[next] ?? OS_STATUSES.find((s) => s.value === next)?.label}`}
      </button>

      {isApprovalStep && customerPhone && (
        <button
          type="button"
          onClick={() => sendQuoteWhatsApp()}
          className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 transition hover:bg-zinc-100 cursor-pointer"
        >
          📲 Enviar orçamento no WhatsApp {effectiveGrandTotal > 0 ? `(${fmtBRL(effectiveGrandTotal)})` : ''}
        </button>
      )}

      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {secondary.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleSecondaryClick(s)}
            disabled={pending || activeStatus !== null}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-[11px] font-medium text-zinc-700 transition hover:bg-zinc-100 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {activeStatus === s ? '…' : STATUS_QUICK_LABEL[s] ?? OS_STATUSES.find((x) => x.value === s)?.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</p>}

      <p className="mt-2 text-[10px] leading-tight text-zinc-500">
        Operador: <strong>{currentUserName}</strong> · Registrado automaticamente na linha do tempo.
      </p>

      {/* MODAL UNIFICADO DE APROVAÇÃO E ORÇAMENTO */}
      <Modal open={approving} onClose={() => setApproving(false)} titleId={approvalTitleId}>
        <h2 id={approvalTitleId} className="text-lg font-bold text-zinc-950">
          Aprovar Orçamento {osLabel ? `· OS ${osLabel}` : ''}
        </h2>
        <p className="mt-1 text-xs text-zinc-600">
          Confirme o valor do serviço e como o cliente autorizou o reparo.
        </p>

        <div className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-600">
              Valor do Serviço / Mão de Obra (R$)
            </label>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute left-3 top-2 text-sm text-zinc-500">
                R$
              </span>
              <input
                type="text"
                inputMode="decimal"
                autoFocus
                value={approvalServiceInput}
                onChange={(e) => setApprovalServiceInput(e.target.value)}
                placeholder="0,00"
                className="block w-full rounded-md border border-zinc-300 bg-white py-2 pl-10 pr-3 font-mono text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="mt-2 flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs">
              <span className="text-zinc-600">
                Serviço ({fmtBRL(modalServiceVal)}) + Peças ({fmtBRL(partsTotal)})
              </span>
              <strong className="font-mono text-sm text-zinc-950">
                Total: {fmtBRL(modalTotalVal)}
              </strong>
            </div>

            {customerPhone && modalTotalVal > 0 && (
              <button
                type="button"
                onClick={() => sendQuoteWhatsApp(modalTotalVal)}
                className="mt-1.5 text-xs font-semibold text-zinc-900 underline hover:text-black cursor-pointer"
              >
                📲 Enviar este valor ({fmtBRL(modalTotalVal)}) no WhatsApp do cliente →
              </button>
            )}
          </div>

          <div>
            <span className="block text-xs font-semibold uppercase tracking-wide text-zinc-600">
              Como o cliente aprovou?
            </span>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {APPROVAL_METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setApprovalMethod(m.value)}
                  className={`rounded-md border-2 px-3 py-2 text-xs font-medium cursor-pointer ${
                    approvalMethod === m.value
                      ? 'border-black bg-zinc-100 text-black font-semibold'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-900 cursor-pointer">
            <input
              type="checkbox"
              checked={startBenchImmediately}
              onChange={(e) => setStartBenchImmediately(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 accent-black text-black"
            />
            <span>Já mover direto para <strong>Em bancada</strong> (iniciar reparo)</span>
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setApproving(false)}
            disabled={activeStatus !== null}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-30 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmApproval}
            disabled={activeStatus !== null}
            className="rounded-md bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
          >
            {activeStatus !== null ? 'Salvando…' : 'Confirmar aprovação'}
          </button>
        </div>
      </Modal>

      {/* MODAL DE ENTREGA E RECEBIMENTO */}
      <Modal open={delivering} onClose={() => setDelivering(false)} titleId={deliveryTitleId}>
        <h2 id={deliveryTitleId} className="text-lg font-bold text-zinc-950">
          Entregar aparelho {osLabel ? `· OS ${osLabel}` : ''}
        </h2>
        <p className="mt-1 text-xs text-zinc-600">
          Finaliza a ordem de serviço e registra quem retirou e o pagamento no balcão.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-600">
              Quem está retirando? *
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Nome de quem retirou"
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
              Pagamento na Entrega
            </h3>

            {isAlreadyPaid ? (
              <p className="mt-2 text-sm font-medium text-zinc-900">
                ✓ Esta OS já está com pagamento concluído ({fmtBRL(totalPaid)}).
              </p>
            ) : (
              <div className="mt-2 space-y-3">
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-zinc-900 cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryPaymentMode"
                      checked={registerPaymentOnDelivery}
                      onChange={() => setRegisterPaymentOnDelivery(true)}
                      className="h-4 w-4 accent-black text-black focus:ring-black"
                    />
                    Receber pagamento agora
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-zinc-900 cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryPaymentMode"
                      checked={!registerPaymentOnDelivery}
                      onChange={() => setRegisterPaymentOnDelivery(false)}
                      className="h-4 w-4 accent-black text-black focus:ring-black"
                    />
                    Entregar sem receber agora (pagar depois / faturado)
                  </label>
                </div>

                {registerPaymentOnDelivery && (
                  <div className="space-y-2 border-t border-zinc-200 pt-2">
                    <div>
                      <span className="block text-xs font-medium text-zinc-600">Valor a receber</span>
                      <div className="relative mt-1">
                        <span className="pointer-events-none absolute left-3 top-2 text-sm text-zinc-500">
                          R$
                        </span>
                        <input
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder="0,00"
                          inputMode="decimal"
                          className="block w-full rounded-md border border-zinc-300 bg-white py-2 pl-10 pr-3 font-mono text-sm text-zinc-950 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>
                      {remainingToPay > 0 && (
                        <p className="mt-1 text-[11px] text-zinc-500">
                          Saldo restante da OS: <strong>{fmtBRL(remainingToPay)}</strong>
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="block text-xs font-medium text-zinc-600">Forma de pagamento</span>
                      <div className="mt-1 grid grid-cols-3 gap-1.5">
                        {PAYMENT_METHODS.map((m) => (
                          <button
                            key={m.value}
                            type="button"
                            onClick={() => setDeliveryPayMethod(m.value)}
                            className={`rounded-md border-2 px-2 py-1.5 text-xs font-medium cursor-pointer ${
                              deliveryPayMethod === m.value
                                ? 'border-black bg-zinc-100 text-black font-semibold'
                                : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {!registerPaymentOnDelivery && (
                  <p className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
                    Aparelho será entregue e a OS constará como <strong>&quot;Entregue, não pago&quot;</strong> no painel até que o pagamento seja registrado.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {error && <p className="mt-3 rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDelivering(false)}
            disabled={activeStatus !== null}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-30 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmDelivery}
            disabled={activeStatus !== null}
            className="rounded-md bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
          >
            {activeStatus === 'delivered'
              ? 'Salvando…'
              : registerPaymentOnDelivery && !isAlreadyPaid
                ? 'Confirmar Pagamento e Entrega'
                : 'Confirmar Entrega'}
          </button>
        </div>
      </Modal>
    </section>
  );
}
