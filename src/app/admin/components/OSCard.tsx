'use client';

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

  function openLabel(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    window.open(`/admin/os/${so.id}/label`, '_blank');
  }

  return (
    <Link
      href={`/admin/os/${so.id}`}
      className="group block rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-sky-300 hover:shadow-md active:scale-[0.99] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              {so.short_id}
            </span>
            <span className="font-mono text-xs font-medium text-slate-400">
              #{so.os_number}
            </span>
            <StatusBadge status={so.status} />
            {so.days_since_update > 2 && <StaleBadge days={so.days_since_update} />}
          </div>
          <h3 className="mt-1.5 truncate text-base font-bold text-slate-900">{so.customer_name}</h3>
          <p className="mt-0.5 text-xs text-slate-600">
            <span className="mr-1.5">{TYPE_ICONS[so.equipment_type]}</span>
            {typeMeta?.label}
            {equip ? ` · ${equip}` : ''}
          </p>
          {so.reported_defect && (
            <p className="mt-2 line-clamp-2 text-xs text-slate-500 border-l-2 border-slate-200 pl-2">
              {so.reported_defect}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end justify-between gap-2.5 text-right self-stretch">
          <span className="font-mono text-[11px] text-slate-400">{timeAgo(so.updated_at)}</span>
          <button
            type="button"
            onClick={openLabel}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-mono font-semibold text-slate-700 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700 transition cursor-pointer"
            title="Imprimir etiqueta térmica 58mm rápida"
          >
            <span>🖨️ 58mm</span>
          </button>
        </div>
      </div>
    </Link>
  );
}
