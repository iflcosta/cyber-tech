'use client';

import { useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import { OS_STATUSES, APPROVAL_METHODS, type OSStatusValue, type ApprovalMethodValue } from '@/app/admin/types/database';
import { Modal } from '@/app/admin/components/Modal';

function parseBRL(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number(v.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

type Profile = { id: string; full_name: string };

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
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);

  // Modal de aprovação — só aparece na transição awaiting_approval -> approved.
  // Registra valor orçado + como o cliente aprovou, pra não depender de
  // ninguém lembrar depois "combinei por WhatsApp" sem prova nenhuma.
  const approvalTitleId = useId();
  const [approving, setApproving] = useState(false);
  const [approvalValue, setApprovalValue] = useState(
    currentEstimatedValue != null ? currentEstimatedValue.toFixed(2).replace('.', ',') : '',
  );
  const [approvalMethod, setApprovalMethod] = useState<ApprovalMethodValue>('whatsapp');
  const [approvalError, setApprovalError] = useState<string | null>(null);

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

  async function changeTo(newStatus: OSStatusValue, note?: string, extraUpdate?: { estimated_value: number }) {
    setError(null);
    setActiveStatus(newStatus);
    try {
      const supabase = createCRMBrowserClient();
      const { error: upErr } = await supabase
        .from('service_orders')
        .update({ status: newStatus, ...extraUpdate })
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
      setApprovalError(null);
      setApproving(true);
      return;
    }
    changeTo(next);
  }

  async function confirmApproval() {
    const num = approvalValue.trim() ? parseBRL(approvalValue) : null;
    if (approvalValue.trim() && num === null) {
      setApprovalError('Valor inválido.');
      return;
    }
    const methodLabel = APPROVAL_METHODS.find((m) => m.value === approvalMethod)?.label ?? approvalMethod;
    const valuePart = num !== null
      ? ` — orçamento de ${num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
      : '';
    const note = `Aprovado por ${methodLabel}${valuePart}`;
    setApproving(false);
    await changeTo('approved', note, num !== null ? { estimated_value: num } : undefined);
  }

  return (
    <section className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-900">Mudar status</h2>
      <p className="mt-1 text-xs text-blue-700">
        Status atual: <strong>{OS_STATUSES.find((s) => s.value === currentStatus)?.label ?? currentStatus}</strong>
      </p>

      <button
        onClick={handleNextClick}
        disabled={pending || activeStatus !== null}
        className="mt-3 w-full rounded-md bg-blue-600 px-4 py-3 text-base font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
      >
        {activeStatus === next ? 'Salvando…' : `→ ${STATUS_QUICK_LABEL[next] ?? OS_STATUSES.find((s) => s.value === next)?.label}`}
      </button>

      <div className="mt-2 grid grid-cols-3 gap-2">
        {secondary.map((s) => (
          <button
            key={s}
            onClick={() => changeTo(s)}
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
          <label className="block">
            <span className="block text-sm font-medium text-slate-700">Valor orçado (opcional)</span>
            <input
              autoFocus
              value={approvalValue}
              onChange={(e) => setApprovalValue(e.target.value)}
              placeholder="0,00"
              inputMode="decimal"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>

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
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {approvalError && (
          <p className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{approvalError}</p>
        )}

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
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {activeStatus === 'approved' ? 'Salvando…' : 'Confirmar aprovação'}
          </button>
        </div>
      </Modal>
    </section>
  );
}
