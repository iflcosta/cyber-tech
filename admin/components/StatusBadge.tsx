import { OS_STATUSES, type OSStatusValue } from '../types/database';

const COLOR_CLASSES: Record<string, string> = {
  amber: 'bg-amber-100 text-amber-800 ring-amber-200',
  blue: 'bg-blue-100 text-blue-800 ring-blue-200',
  indigo: 'bg-indigo-100 text-indigo-800 ring-indigo-200',
  orange: 'bg-orange-100 text-orange-800 ring-orange-200',
  emerald: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  red: 'bg-red-100 text-red-800 ring-red-200',
};

export function StatusBadge({ status, className = '' }: { status: OSStatusValue | string; className?: string }) {
  const meta = OS_STATUSES.find((s) => s.value === status);
  if (!meta) {
    return (
      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset bg-slate-100 text-slate-700 ${className}`}>
        {status}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${COLOR_CLASSES[meta.color]} ${className}`}>
      {meta.label}
    </span>
  );
}
