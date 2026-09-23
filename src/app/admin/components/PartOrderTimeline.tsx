import type { PartOrderEvent } from '../types/database';
import { formatDateTimeShortBR } from '../lib/datetime';

const EVENT_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  created: { label: 'Pedido registrado', color: 'bg-zinc-200 text-zinc-900', icon: '📱' },
  received: { label: 'Recebido', color: 'bg-zinc-200 text-zinc-900', icon: '📦' },
  applied: { label: 'Aplicado na OS', color: 'bg-emerald-100 text-emerald-800', icon: '✅' },
  return_signaled: { label: 'Devolução sinalizada', color: 'bg-orange-100 text-orange-800', icon: '↩️' },
  returned: { label: 'Devolvido', color: 'bg-slate-100 text-slate-700', icon: '🚚' },
  exchange_awaited: { label: 'Aguardando troca', color: 'bg-amber-100 text-amber-800', icon: '⏳' },
  exchange_received: { label: 'Reposição recebida', color: 'bg-zinc-200 text-zinc-900', icon: '📦' },
  value_adjusted: { label: 'Valor ajustado', color: 'bg-slate-100 text-slate-700', icon: '💲' },
  note_added: { label: 'Anotação', color: 'bg-slate-100 text-slate-700', icon: '📝' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: '✖️' },
};

const formatTime = formatDateTimeShortBR;

export function PartOrderTimeline({
  events,
  authorNames,
}: {
  events: PartOrderEvent[];
  authorNames: Record<string, string>;
}) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-500">Nenhum evento registrado ainda.</p>;
  }

  return (
    <ol className="space-y-3">
      {events.map((ev) => {
        const meta = EVENT_LABELS[ev.event_type] ?? EVENT_LABELS.note_added;
        const author = authorNames[ev.author_id] ?? 'alguém';
        return (
          <li key={ev.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${meta.color}`}>
                {meta.icon}
              </span>
              <div className="mt-1 w-px flex-1 bg-slate-200" />
            </div>
            <div className="-mt-0.5 flex-1 pb-2">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-medium text-slate-900">{meta.label}</span>
                {ev.from_value && ev.to_value && (
                  <span className="text-xs text-slate-500">
                    ({ev.from_value} → <strong>{ev.to_value}</strong>)
                  </span>
                )}
              </div>
              {ev.note && <p className="mt-0.5 text-sm text-slate-700">{ev.note}</p>}
              <p className="mt-0.5 text-xs text-slate-500">
                {author} · {formatTime(ev.created_at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
