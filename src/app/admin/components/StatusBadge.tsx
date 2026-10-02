import { OS_STATUSES, type OSStatusValue } from '../types/database';

const COLOR_CLASSES: Record<string, string> = {
  amber: 'bg-amber-50 text-amber-950 border border-amber-300',
  blue: 'bg-zinc-100 text-zinc-900 border border-zinc-300',
  indigo: 'bg-zinc-950 text-white border border-zinc-950',
  orange: 'bg-orange-50 text-orange-950 border border-orange-300',
  emerald: 'bg-emerald-50 text-emerald-950 border border-emerald-300',
  slate: 'bg-zinc-100 text-zinc-800 border border-zinc-300',
  red: 'bg-red-50 text-red-950 border border-red-300',
};

export function StatusBadge({
  status,
  hasQuote,
  className = '',
}: {
  status: OSStatusValue | string;
  hasQuote?: boolean;
  className?: string;
}) {
  const meta = OS_STATUSES.find((s) => s.value === status);
  if (!meta) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-800 border border-zinc-300 ${className}`}>
        {status}
      </span>
    );
  }
  const label =
    status === 'awaiting_approval' && hasQuote === false
      ? 'Em triagem / diagnóstico'
      : meta.label;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider ${COLOR_CLASSES[meta.color] ?? 'bg-zinc-100 text-zinc-800 border border-zinc-300'} ${className}`}>
      {label}
    </span>
  );
}
