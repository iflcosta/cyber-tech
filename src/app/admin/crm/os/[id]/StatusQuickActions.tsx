'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/crm/lib/supabase/client';
import { OS_STATUSES, type OSStatusValue } from '@/app/admin/crm/types/database';

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

export function StatusQuickActions({
  osId,
  currentStatus,
  currentUserId,
  currentUserName,
  canEdit,
}: {
  osId: string;
  currentStatus: string;
  currentUserId: string;
  currentUserName: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);

  if (!canEdit) return null;

  const next = STATUS_FLOW[currentStatus as OSStatusValue];
  if (!next) {
    return (
      <section className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
        <p className="text-xs text-slate-500">OS em status final ({currentStatus}).</p>
      </section>
    );
  }

  // Mostra o proximo passo grande, mais os "atalhos" pros status secundarios.
  // Celular primeiro: botao grande do next, depois linha com 2-3 opcoes secundarias.
  const secondary: OSStatusValue[] = (['waiting_part', 'ready', 'cancelled'] as OSStatusValue[]).filter(
    (s) => s !== next && s !== currentStatus,
  );

  async function changeTo(newStatus: OSStatusValue) {
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
        author_id: currentUserId,
      });
      startTransition(() => router.refresh());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActiveStatus(null);
    }
  }

  return (
    <section className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-900">Mudar status</h2>
      <p className="mt-1 text-xs text-blue-700">
        Status atual: <strong>{OS_STATUSES.find((s) => s.value === currentStatus)?.label ?? currentStatus}</strong>
      </p>

      <button
        onClick={() => changeTo(next)}
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
    </section>
  );
}
