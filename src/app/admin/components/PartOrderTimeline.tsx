import type { PartOrderEvent } from '../types/database';
import { formatDateTimeShortBR } from '../lib/datetime';

const EVENT_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  created: { label: 'Pedido registrado', color: 'border border-zinc-300 bg-zinc-100 text-zinc-900', icon: '📱' },
  received: { label: 'Recebido', color: 'border-2 border-zinc-950 bg-zinc-950 text-white', icon: '📦' },
  applied: { label: 'Aplicado na OS', color: 'border border-emerald-700 bg-emerald-100 text-emerald-950', icon: '✅' },
  return_signaled: { label: 'Devolução sinalizada', color: 'border border-orange-600 bg-orange-100 text-orange-950', icon: '↩️' },
  returned: { label: 'Devolvido', color: 'border border-zinc-300 bg-zinc-100 text-zinc-700', icon: '🚚' },
  exchange_awaited: { label: 'Aguardando troca', color: 'border border-amber-600 bg-amber-100 text-amber-950', icon: '⏳' },
  exchange_received: { label: 'Reposição recebida', color: 'border-2 border-zinc-950 bg-zinc-950 text-white', icon: '📦' },
  value_adjusted: { label: 'Valor ajustado', color: 'border border-zinc-300 bg-zinc-100 text-zinc-700', icon: '💲' },
  note_added: { label: 'Anotação', color: 'border border-zinc-300 bg-zinc-100 text-zinc-700', icon: '📝' },
  cancelled: { label: 'Cancelado', color: 'border border-red-600 bg-red-100 text-red-950', icon: '✖️' },
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
    return <p className="font-mono text-xs text-zinc-500">Nenhum evento registrado ainda.</p>;
  }

  return (
    <ol className="space-y-3 font-mono">
      {events.map((ev) => {
        const meta = EVENT_LABELS[ev.event_type] ?? EVENT_LABELS.note_added;
        const author = authorNames[ev.author_id] ?? 'alguém';
        return (
          <li key={ev.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className={`flex h-6 w-6 items-center justify-center text-xs ${meta.color}`}>
                {meta.icon}
              </span>
              <div className="mt-1 w-px flex-1 bg-zinc-300" />
            </div>
            <div className="-mt-0.5 flex-1 pb-2">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-950">{meta.label}</span>
                {ev.from_value && ev.to_value && (
                  <span className="text-[11px] text-zinc-500">
                    ({ev.from_value} → <strong className="text-zinc-950">{ev.to_value}</strong>)
                  </span>
                )}
              </div>
              {ev.note && <p className="mt-1 text-xs text-zinc-700">{ev.note}</p>}
              <p className="mt-1 text-[11px] text-zinc-400">
                {author} · {formatTime(ev.created_at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
