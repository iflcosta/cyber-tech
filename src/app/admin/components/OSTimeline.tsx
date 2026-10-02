import type { ServiceOrderEvent } from '../types/database';
import { formatDateTimeShortBR } from '../lib/datetime';

const EVENT_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  created: { label: 'OS criada', color: 'border border-zinc-300 bg-zinc-100 text-zinc-800', icon: '✨' },
  status_changed: { label: 'Mudou status', color: 'border-2 border-zinc-950 bg-zinc-950 text-white', icon: '🔄' },
  assigned: { label: 'Técnico atribuído', color: 'border border-zinc-300 bg-zinc-100 text-zinc-900', icon: '👤' },
  note_added: { label: 'Anotação', color: 'border border-zinc-300 bg-zinc-100 text-zinc-800', icon: '📝' },
  checklist_updated: { label: 'Checklist atualizado', color: 'border border-zinc-300 bg-zinc-100 text-zinc-800', icon: '✅' },
  part_resolved: { label: 'Peça resolvida', color: 'border border-emerald-700 bg-emerald-100 text-emerald-950', icon: '🧩' },
  delivered: { label: 'Entregue', color: 'border border-emerald-700 bg-emerald-100 text-emerald-950', icon: '📦' },
};

const formatTime = formatDateTimeShortBR;

export function OSTimeline({ events, authorNames }: {
  events: ServiceOrderEvent[];
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
