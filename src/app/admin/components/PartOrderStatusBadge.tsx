import { PART_ORDER_STATUSES, type PartOrderStatusValue } from '../types/database';

const COLOR_CLASSES: Record<string, string> = {
  amber: 'border border-amber-600 bg-amber-100 text-amber-950',
  blue: 'border-2 border-zinc-950 bg-zinc-950 text-white',
  indigo: 'border-2 border-zinc-950 bg-zinc-950 text-white',
  orange: 'border border-amber-600 bg-amber-100 text-amber-950',
  emerald: 'border border-emerald-700 bg-emerald-100 text-emerald-950',
  slate: 'border border-zinc-300 bg-zinc-100 text-zinc-700',
  red: 'border border-red-600 bg-red-100 text-red-950',
};

export function PartOrderStatusBadge({
  status,
  className = '',
}: {
  status: PartOrderStatusValue | string;
  className?: string;
}) {
  const meta = PART_ORDER_STATUSES.find((s) => s.value === status);
  if (!meta) {
    return (
      <span className={`inline-flex items-center border border-zinc-300 bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-700 ${className}`}>
        {status}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${COLOR_CLASSES[meta.color]} ${className}`}>
      {meta.label}
    </span>
  );
}
