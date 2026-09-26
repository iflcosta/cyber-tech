'use client';

import { useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import { OS_STATUSES, APPROVAL_METHODS, type OSStatusValue, type ApprovalMethodValue } from '@/app/admin/types/database';
import { Modal } from '@/app/admin/components/Modal';

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
  // Registra COMO o cliente aprovou, pra não depender de ninguém lembrar
  // depois "combinei por WhatsApp" sem prova nenhuma. O valor orçado em
  // si NÃO é editável aqui — é só exibido (já foi definido na seção
  // "Orçamento"); ter os dois campos editáveis na mesma página, um deles
  // dentro de um modal, é redundância pura e só cria chance de divergir.
  const approvalTitleId = useId();
  const [approving, setApproving] = useState(false);
  const [approvalMethod, setApprovalMethod] = useState<ApprovalMethodValue>('whatsapp');

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
      // abre o WhatsApp já com a mensagem pronta e link do portal /status
      if (newStatus === 'ready' && customerPhone) {
        const cleanOsCode = (osLabel ?? '').replace(/^OS-?/i, '').replace(/^#/, '');
        const trackUrl =
          typeof window !== 'undefined'
            ? `${window.location.origin}/status?q=${encodeURIComponent(cleanOsCode || osId)}`
            : `https://cyberinformatica.tech/status?q=${encodeURIComponent(cleanOsCode || osId)}`;
        const msg = `Olá ${customerName ?? ''}! Aqui é da Cyber Informática. Seu equipamento${
          osLabel ? ` (OS ${osLabel})` : ''
        } já passou pelos testes finais e está *pronto para retirada*! 🎉\n\nVocê pode conferir o resumo, fotos e garantia em tempo real aqui:\n${trackUrl}`;
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
    changeTo(next);
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

    function sendReadyWhatsApp() {
    if (!customerPhone) return;
    const cleanOsCode = (osLabel ?? '').replace(/^OS-?/i, '').replace(/^#/, '');
    const trackUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/status?q=${encodeURIComponent(cleanOsCode || osId)}`
        : `https://cyberinformatica.tech/status?q=${encodeURIComponent(cleanOsCode || osId)}`;
    const valorText = currentEstimatedValue != null ? `\n💰 *Valor Total:* ${fmtBRL(currentEstimatedValue)} (Pix ou Cartão)` : '';
    const msg = `Olá ${customerName ?? ''}! Aqui é da *Cyber Informática* (Centro de Bragança Paulista).\n\nSeu equipamento${
      osLabel ? ` *(OS ${osLabel})*` : ''
    } já passou por todos os testes de bancada e está *PRONTO PARA RETIRADA*! 🎉${valorText}\n\n📍 *Endereço para retirada:*\nRua Coronel Teófilo Leme, 967 — Centro, Bragança Paulista\n\n🔗 *Conferir laudo pericial e garantia CDC 90 dias:*\n${trackUrl}`;
    const link = toWhatsAppLink(customerPhone, msg);
    if (link && typeof window !== 'undefined') {
      window.open(link, '_blank');
    }
  }

function sendPortalTrackingWhatsApp() {
    if (!customerPhone) return;
    const cleanOsCode = (osLabel ?? '').replace(/^OS-?/i, '').replace(/^#/, '');
    const trackUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/status?q=${encodeURIComponent(cleanOsCode || osId)}`
        : `https://cyberinformatica.tech/status?q=${encodeURIComponent(cleanOsCode || osId)}`;

    const statusText =
      currentStatus === 'awaiting_approval' && currentEstimatedValue != null
        ? `O diagnóstico e orçamento (${fmtBRL(currentEstimatedValue)}) da sua OS ${osLabel ?? ''} já estão disponíveis para sua conferência e aprovação.`
        : `Acompanhe em tempo real o andamento, fotos de entrada e status da sua OS ${osLabel ?? ''}.`;

    const msg = `Olá ${customerName ?? ''}! Aqui é da Cyber Informática (Centro de Bragança Paulista).\n\n${statusText}\n\n🔗 Acesse seu Portal de Acompanhamento:\n${trackUrl}`;
    const link = toWhatsAppLink(customerPhone, msg);
    if (link && typeof window !== 'undefined') {
      window.open(link, '_blank');
    }
  }

  return (
    <section className="rounded-xl border border-sky-200 bg-sky-50/70 p-4 shadow-xs">
      <h2 className="text-xs font-bold uppercase tracking-wider text-sky-900">Fluxo de Bancada & Status</h2>
      <p className="mt-1 text-xs text-sky-800">
        Status atual: <strong>{OS_STATUSES.find((s) => s.value === currentStatus)?.label ?? currentStatus}</strong>
      </p>

      <button
        onClick={handleNextClick}
        disabled={pending || activeStatus !== null}
        className="mt-3 w-full rounded-lg bg-sky-600 px-4 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-sky-700 active:scale-95 disabled:opacity-50 cursor-pointer"
      >
        {activeStatus === next ? 'Salvando…' : `→ ${STATUS_QUICK_LABEL[next] ?? OS_STATUSES.find((s) => s.value === next)?.label}`}
      </button>

      <div className="mt-2 flex flex-col sm:flex-row gap-2">
        {secondary.map((s) => (
          <button
            key={s}
            onClick={() => changeTo(s)}
            disabled={pending || activeStatus !== null}
            className="flex-1 sm:flex-none min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {activeStatus === s ? '…' : STATUS_QUICK_LABEL[s] ?? OS_STATUSES.find((x) => x.value === s)?.label}
          </button>
        ))}
      </div>

      {customerPhone && (
        <button
          type="button"
          onClick={sendPortalTrackingWhatsApp}
          className="mt-2.5 w-full rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>📲 Enviar Link do Portal (/status) no WhatsApp</span>
        </button>
      )}

      {error && <p className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</p>}

      <p className="mt-2 text-[10px] leading-tight text-slate-500">
        Operador: <strong>{currentUserName}</strong>. A mudança fica registrada na linha do tempo.
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
              className="mt-1 inline-block text-xs font-medium text-blue-600 hover:text-blue-700"
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
