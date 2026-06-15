'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { OS_STATUSES } from '../../types/database';

export function OSFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');

  useEffect(() => {
    setQ(params.get('q') ?? '');
  }, [params]);

  function update(key: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    update('q', q.trim() || null);
  }

  return (
    <div className="space-y-2">
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome, OS, telefone, IMEI, modelo…"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-base text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Buscar
        </button>
      </form>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <FilterChip
          label="Ativas"
          value=""
          active={!params.get('status') || params.get('status') === 'all'}
          onClick={() => update('status', null)}
        />
        {OS_STATUSES.filter((s) => s.value !== 'cancelled').map((s) => (
          <FilterChip
            key={s.value}
            label={s.label}
            value={s.value}
            active={params.get('status') === s.value}
            onClick={() => update('status', s.value)}
          />
        ))}
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; value: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium ring-1 transition ${
        active
          ? 'bg-slate-900 text-white ring-slate-900'
          : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );
}
