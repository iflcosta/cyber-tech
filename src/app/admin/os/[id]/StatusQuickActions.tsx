'use client';

import { useId, useState, useTransition } from 'react';
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
  const n = Number(v.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
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
  approved: '✅ Aprovar',
  in_progress: '🔧 Em bancada',
  waiting_part: '⏸️ Aguardando peça',
  ready: '📦 Pronto',
  delivered: '🤝 Entregar',
};

// Normaliza telefone BR para wa.me (mesma lógica do WhatsAppButton)
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
  grandTotal,
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
  /** Pré-preenche o valor no modal de aprovação, se já foi orçado antes. */
  currentEstimatedValue?: number | null;
  grandTotal?: number;
  payments?: { amount: number; payment_method: PaymentMethodValue }[];
  paymentStatus?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);

  // Modal de aprovação — só aparece na transição awaiting_approval -> approved.
  const approvalTitleId = useId();
  const [approving, setApproving] = useState(false);
  const [approvalMethod, setApprovalMethod] = useState<ApprovalMethodValue>('whatsapp');

  // Modal de entrega — permite registrar quem retirou e o pagamento no ato
  const totalPaid = (payments ?? []).reduce((acc, p) => acc + Number(p.amount), 0);
  const effectiveGrandTotal = (grandTotal ?? 0) > 0 ? (grandTotal ?? 0) : Number(currentEstimatedValue ?? 0);
  const remainingToPay = Math.max(0, effectiveGrandTotal - totalPaid);
  const isAlreadyPaid = paymentStatus === 'paid' || (totalPaid >= effectiveGrandTotal && effectiveGrandTotal > 0);

  const deliveryTitleId = useId();
  const [delivering, setDelivering] = useState(false);
  const [recipientName, setRecipientName] = useState(customerName ?? '');
  const [registerPaymentOnDelivery, setRegisterPaymentOnDelivery] = useState(!isAlreadyPaid && effectiveGrandTotal > 0);
  const [paymentAmount, setPaymentAmount] = useState(
    remainingToPay > 0
      ? remainingToPay.toFixed(2).replace('.', ',')
      : effectiveGrandTotal > 0
        ? effectiveGrandTotal.toFixed(2).replace('.', ',')
        : '',
  );
  const [deliveryPayMethod, setDeliveryPayMethod] = useState<PaymentMethodValue>('pix');

  if (!canEdit) return null;

  const nextOrNull = STATUS_FLOW[currentStatus as OSStatusValue];
  if (!nextOrNull) {
    return (
      <section className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
        <p className="text-xs text-slate-500">OS em status final ({currentStatus}).</p>
      </section>
    );
  }
  // Rebinding pra um const próprio: TS não propaga o narrowing de `nextOrNull`
  // pra dentro de funções aninhadas declaradas mais abaixo (handleNextClick).
  const next: OSStatusValue = nextOrNull;

  // Mostra o proximo passo grande, mais os "atalhos" pros status secundarios.
  // Celular primeiro: botao grande do next, depois linha com 2-3 opcoes secundarias.
  const secondary: OSStatusValue[] = (['waiting_part', 'ready', 'cancelled'] as OSStatusValue[]).filter(
    (s) => s !== next && s !== currentStatus,
  );

  async function changeTo(newStatus: OSStatusValue, note?: string) {
    setError(null);
    setActiveStatus(newStatus);
    try {
      const supabase = createCRMBrowserClient();
      const { error: upErr } = await supabase
        .from('service_orders')
        .update({ status: newStatus })
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

      // Notifica o cliente automaticamente quando fica pronto pra retirada —
      // abre o WhatsApp já com a mensagem pronta, sem precisar navegar até
      // o botão manual. Só dispara se tiver telefone cadastrado.
      if (newStatus === 'ready' && customerPhone) {
        const msg = `Olá ${customerName ?? ''}! Aqui é da Cyber Informática. Seu aparelho${
          osLabel ? ` (OS ${osLabel})` : ''
        } já está pronto para retirada. 🙂`;
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

  async function confirmApproval() {
    const methodLabel = APPROVAL_METHODS.find((m) => m.value === approvalMethod)?.label ?? approvalMethod;
    const valuePart = currentEstimatedValue != null
      ? ` — orçamento de ${fmtBRL(currentEstimatedValue)}`
      : '';
    const note = `Aprovado por ${methodLabel}${valuePart}`;
    setApproving(false);
    await changeTo('approved', note);
  }

  async function confirmDelivery() {
    setError(null);
    setActiveStatus('delivered');
    const who = recipientName.trim() || customerName || 'Cliente';

    try {
      const supabase = createCRMBrowserClient();
      let paymentNote = '';

      if (registerPaymentOnDelivery && !isAlreadyPaid) {
        const num = parseBRL(paymentAmount);
        if (num === null || num <= 0) {
          setError('Informe um valor de pagamento válido.');
          setActiveStatus(null);
          return;
        }

        const { error: payErr } = await supabase.from('service_order_payments').insert({
          service_order_id: osId,
          amount: num,
          payment_method: deliveryPayMethod,
          author_id: currentUserId,
        } as never);
        if (payErr) throw payErr;

        const methodMeta = PAYMENT_METHODS.find((m) => m.value === deliveryPayMethod)?.label ?? deliveryPayMethod;
        paymentNote = ` · Pagamento de ${fmtBRL(num)} recebido via ${methodMeta}`;
      }

      const now = new Date().toISOString();
      const { error: upErr } = await supabase
        .from('service_orders')
        .update({
          status: 'delivered',
          delivered_at: now,
          delivered_to_name: who,
        })
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

  return (
    <section className="rounded-lg border-2 border-zinc-300 bg-zinc-50 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900">Mudar status</h2>
      <p className="mt-1 text-xs text-zinc-700">
        Status atual: <strong>{OS_STATUSES.find((s) => s.value === currentStatus)?.label ?? currentStatus}</strong>
      </p>

      <button
        onClick={handleNextClick}
        disabled={pending || activeStatus !== null}
        className="mt-3 w-full rounded-md bg-black px-4 py-3 text-base font-bold text-white shadow-sm transition hover:bg-zinc-800 active:scale-95 disabled:opacity-50"
      >
        {activeStatus === next ? 'Salvando…' : `→ ${STATUS_QUICK_LABEL[next] ?? OS_STATUSES.find((s) => s.value === next)?.label}`}
      </button>

      <div className="mt-2 grid grid-cols-3 gap-2">
        {secondary.map((s) => (
          <button
            key={s}
            onClick={() => handleSecondaryClick(s)}
            disabled={pending || activeStatus !== null}
            className="rounded-md border border-slate-300 bg-white px-2 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
          >
            {activeStatus === s ? '…' : STATUS_QUICK_LABEL[s] ?? OS_STATUSES.find((x) => x.value === s)?.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</p>}

      <p className="mt-2 text-[10px] leading-tight text-slate-500">
        Quem mudou: <strong>{currentUserName}</strong>. A mudança aparece na timeline automaticamente.
      </p>

      <Modal open={approving} onClose={() => setApproving(false)} titleId={approvalTitleId}>
        <h2 id={approvalTitleId} className="text-lg font-bold text-slate-900">Aprovar orçamento</h2>
        <p className="mt-1 text-sm text-slate-500">
          Fica registrado na timeline — sem depender de lembrar depois como e quanto foi combinado.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <span className="block text-sm font-medium text-slate-700">Valor orçado</span>
            {currentEstimatedValue != null ? (
              <p className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
                {fmtBRL(currentEstimatedValue)}
              </p>
            ) : (
              <p className="mt-1 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                Ainda não orçado
              </p>
            )}
            <a
              href="#orcamento-section"
              onClick={() => setApproving(false)}
              className="mt-1 inline-block text-xs font-semibold text-zinc-900 underline hover:text-black"
            >
              Editar na seção Orçamento →
            </a>
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-700">Como o cliente aprovou?</span>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {APPROVAL_METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setApprovalMethod(m.value)}
                  className={`rounded-md border-2 px-3 py-2 text-sm font-medium ${
                    approvalMethod === m.value
                      ? 'border-black bg-zinc-100 text-black font-semibold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setApproving(false)}
            disabled={activeStatus !== null}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-30"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmApproval}
            disabled={activeStatus !== null}
            className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {activeStatus === 'approved' ? 'Salvando…' : 'Confirmar aprovação'}
          </button>
        </div>
      </Modal>

      <Modal open={delivering} onClose={() => setDelivering(false)} titleId={deliveryTitleId}>
        <h2 id={deliveryTitleId} className="text-lg font-bold text-slate-900">
          Entregar aparelho {osLabel ? `· OS ${osLabel}` : ''}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Finaliza a ordem de serviço e registra quem retirou e o pagamento no balcão.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Quem está retirando? *
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Nome de quem retirou"
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Pagamento na Entrega
            </h3>

            {isAlreadyPaid ? (
              <p className="mt-2 text-sm font-medium text-zinc-900">
                ✓ Esta OS já está com pagamento concluído ({fmtBRL(totalPaid)}).
              </p>
            ) : (
              <div className="mt-2 space-y-3">
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <input
                      type="radio"
                      name="deliveryPaymentMode"
                      checked={registerPaymentOnDelivery}
                      onChange={() => setRegisterPaymentOnDelivery(true)}
                      className="h-4 w-4 text-black focus:ring-black"
                    />
                    Receber pagamento agora
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <input
                      type="radio"
                      name="deliveryPaymentMode"
                      checked={!registerPaymentOnDelivery}
                      onChange={() => setRegisterPaymentOnDelivery(false)}
                      className="h-4 w-4 text-black focus:ring-black"
                    />
                    Entregar sem receber agora (pagar depois / faturado)
                  </label>
                </div>

                {registerPaymentOnDelivery && (
                  <div className="space-y-2 border-t border-zinc-200 pt-2">
                    <div>
                      <span className="block text-xs font-medium text-slate-600">Valor a receber</span>
                      <div className="relative mt-1">
                        <span className="pointer-events-none absolute left-3 top-2 text-sm text-slate-500">R$</span>
                        <input
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder="0,00"
                          inputMode="decimal"
                          className="block w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 py-2 text-sm font-mono text-zinc-950 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>
                      {remainingToPay > 0 && (
                        <p className="mt-1 text-[11px] text-slate-500">
                          Saldo restante da OS: <strong>{fmtBRL(remainingToPay)}</strong>
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="block text-xs font-medium text-slate-600">Forma de pagamento</span>
                      <div className="mt-1 grid grid-cols-3 gap-1.5">
                        {PAYMENT_METHODS.map((m) => (
                          <button
                            key={m.value}
                            type="button"
                            onClick={() => setDeliveryPayMethod(m.value)}
                            className={`rounded-md border-2 px-2 py-1.5 text-xs font-medium ${
                              deliveryPayMethod === m.value
                                ? 'border-black bg-zinc-100 text-black font-semibold'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
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
                  <p className="text-xs text-amber-800 bg-amber-50 rounded p-2 border border-amber-200">
                    Aparelho será entregue e a OS constará como <strong>"Entregue, não pago"</strong> no painel até que o pagamento seja registrado.
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
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-30"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmDelivery}
            disabled={activeStatus !== null}
            className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {activeStatus === 'delivered' ? 'Salvando…' : registerPaymentOnDelivery && !isAlreadyPaid ? 'Confirmar Pagamento e Entrega' : 'Confirmar Entrega'}
          </button>
        </div>
      </Modal>
    </section>
  );
}
