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
          className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner"
        />
        <button
          type="submit"
          className="rounded-lg bg-white px-4 py-2.5 text-xs font-mono font-bold text-zinc-950 hover:bg-zinc-200 transition shadow"
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
      className={`whitespace-nowrap rounded-md px-3 py-1 text-xs font-mono font-medium transition ${
        active
          ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
          : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800/80 hover:bg-zinc-800 hover:text-zinc-200'
      }`}
    >
      {label}
    </button>
  );
}
