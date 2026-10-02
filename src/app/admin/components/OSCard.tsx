import Link from 'next/link';
import { StatusBadge } from './StatusBadge';
import { StaleBadge } from './StaleBadge';
import {
  getEquipmentTypeLabel,
  resolveEquipmentCategory,
  type ServiceOrderWithStale,
} from '../types/database';

const TYPE_ICONS: Record<string, string> = {
  computador: '🖥️',
  notebook: '💻',
  impressora: '🖨️',
  celular: '📱',
  tablet: '📱',
  console: '🎮',
  monitor: '🖥️',
  outro: '📦',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}m`;
}

export function OSCard({
  so,
  currentUserId,
}: {
  so: ServiceOrderWithStale;
  currentUserId?: string;
}) {
  const category = resolveEquipmentCategory(
    so.equipment_type,
    so.equipment_brand,
    so.equipment_model,
  );
  const typeLabel = getEquipmentTypeLabel(
    so.equipment_type,
    so.equipment_brand,
    so.equipment_model,
  );
  const equip = [so.equipment_brand, so.equipment_model, so.equipment_color].filter(Boolean).join(' ');
  const hasQuote =
    Number(so.estimated_value ?? 0) > 0 ||
    Number((so as { labor_cost?: number | null }).labor_cost ?? 0) > 0;
  const isMine = Boolean(currentUserId && so.technician_id === currentUserId);

  return (
    <Link
      href={`/admin/os/${so.id}`}
      className={`block border bg-white p-4 shadow-2xs transition hover:border-zinc-950 hover:shadow-xs active:scale-[0.99] sm:p-5 ${
        isMine ? 'border-2 border-zinc-950 ring-1 ring-zinc-950/10' : 'border border-zinc-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-base font-bold tracking-tight text-zinc-950 sm:text-lg">
              {so.short_id}
            </span>
            <span className="font-mono text-xs font-medium text-zinc-400">
              #{so.os_number}
            </span>
            <StatusBadge status={so.status} hasQuote={hasQuote} />
            {so.days_since_update > 2 && <StaleBadge days={so.days_since_update} />}
          </div>
          <h3 className="mt-1.5 truncate text-base font-bold text-zinc-950">{so.customer_name}</h3>
          <p className="mt-0.5 text-xs text-zinc-600">
            <span className="mr-1.5">{TYPE_ICONS[category] ?? '📦'}</span>
            {typeLabel}
            {equip ? ` · ${equip}` : ''}
          </p>
          {so.reported_defect && (
            <p className="mt-2 line-clamp-2 text-xs text-zinc-600 border-l-2 border-zinc-300 pl-2">
              {so.reported_defect}
            </p>
          )}
          <div className="mt-2.5 flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-200">
            {so.technician_name ? (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[11px] font-semibold ${
                  isMine
                    ? 'bg-zinc-950 text-white'
                    : 'bg-zinc-100 text-zinc-900 border border-zinc-300'
                }`}
              >
                <span>👤</span>
                <span>{so.technician_name}</span>
                {isMine && <span className="text-[9px] uppercase opacity-80">· Minha</span>}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 border border-amber-300 bg-amber-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-950">
                <span>⚪</span>
                <span>Sem técnico</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <span className="font-mono text-[11px] text-zinc-400">{timeAgo(so.updated_at)}</span>
        </div>
      </div>
    </Link>
  );
}
