'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { OS_STATUSES } from '@/app/admin/types/database';

export function OSFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const urlQ = params.get('q') ?? '';

  function update(key: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get('q');
    update('q', typeof value === 'string' && value.trim() ? value.trim() : null);
  }

  return (
    <div className="space-y-3">
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          key={urlQ}
          name="q"
          type="search"
          defaultValue={urlQ}
          placeholder="Buscar por nome, OS (#1042), telefone, IMEI, modelo…"
          aria-label="Buscar por nome, OS, telefone, IMEI, modelo"
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-xs"
        />
        <button
          type="submit"
          className="rounded-lg bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-sky-700 transition shadow-xs"
        >
          Buscar
        </button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        <FilterChip
          label="Ativas"
          value=""
          active={!params.get('status') || params.get('status') === 'all'}
          onClick={() => update('status', null)}
        />
        {OS_STATUSES.map((s) => (
          <FilterChip
            key={s.value}
            label={s.label}
            value={s.value}
            active={params.get('status') === s.value}
            onClick={() => update('status', s.value)}
          />
        ))}
        <FilterChip
          label="🛡️ Em garantia"
          value="warranty"
          active={params.get('status') === 'warranty'}
          onClick={() => update('status', 'warranty')}
        />
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; value: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? 'bg-sky-600 text-white border border-sky-600 shadow-xs'
          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {label}
    </button>
  );
}
