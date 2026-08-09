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

  // Input não controlado (sem useState) — evita sincronizar estado do
  // React com a URL via useEffect (o "empurra o valor de novo" que
  // causava re-render em cascata). Quando a URL muda por fora (voltar
  // do navegador, por ex), o `key={urlQ}` força o React a remontar o
  // input do zero com o valor novo — sem isso, um input não controlado
  // continuaria mostrando o texto antigo mesmo com a URL diferente.
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get('q');
    update('q', typeof value === 'string' && value.trim() ? value.trim() : null);
  }

  return (
    <div className="space-y-2">
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          key={urlQ}
          name="q"
          type="search"
          defaultValue={urlQ}
          placeholder="Buscar por nome, OS, telefone, IMEI, modelo…"
          aria-label="Buscar por nome, OS, telefone, IMEI, modelo"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-base text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
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
