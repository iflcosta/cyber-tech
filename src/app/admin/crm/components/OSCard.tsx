import Link from 'next/link';
import { StatusBadge } from './StatusBadge';
import { StaleBadge } from './StaleBadge';
import { EQUIPMENT_TYPES, type ServiceOrderWithStale } from '../types/database';

const TYPE_ICONS: Record<string, string> = {
  computador: '🖥️',
  notebook: '💻',
  celular: '📱',
  tablet: '📱',
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

export function OSCard({ so }: { so: ServiceOrderWithStale }) {
  const typeMeta = EQUIPMENT_TYPES.find((t) => t.value === so.equipment_type);
  const equip = [so.equipment_brand, so.equipment_model, so.equipment_color].filter(Boolean).join(' ');

  return (
    <Link
      href={`/admin/crm/os/${so.id}`}
      className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow active:scale-[0.99] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold tracking-tight text-slate-900">
              {so.short_id}
            </span>
            <span className="font-mono text-[10px] font-medium text-slate-400">
              {so.os_number}
            </span>
            <StatusBadge status={so.status} />
          </div>
          <h3 className="mt-1 truncate text-base font-semibold text-slate-900">{so.customer_name}</h3>
          <p className="mt-0.5 text-sm text-slate-600">
            <span className="mr-1">{TYPE_ICONS[so.equipment_type]}</span>
            {typeMeta?.label}
            {equip ? ` · ${equip}` : ''}
          </p>
          {so.reported_defect && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">{so.reported_defect}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <span className="text-xs text-slate-500">{timeAgo(so.updated_at)}</span>
          {so.assigned_to_name && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">@{so.assigned_to_name}</span>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StaleBadge days={so.days_since_update} />
        {so.blocking_reason && (
          <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-0.5 text-xs text-orange-800 ring-1 ring-inset ring-orange-200">
            Falta: {so.blocking_reason}
          </span>
        )}
      </div>
    </Link>
  );
}
