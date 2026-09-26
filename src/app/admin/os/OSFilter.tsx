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
          placeholder="Buscar por cliente, nº da OS, telefone, série/IMEI ou modelo…"
          aria-label="Buscar por nome, OS, telefone, IMEI, modelo"
          className="flex-1 border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-950 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none"
        />
        <button
          type="submit"
          className="bg-zinc-950 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition cursor-pointer"
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
          label="Em Garantia"
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
      className={`whitespace-nowrap px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
        active
          ? 'bg-zinc-950 text-white border border-zinc-950'
          : 'bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-100 hover:text-zinc-950'
      }`}
    >
      {label}
    </button>
  );
}
