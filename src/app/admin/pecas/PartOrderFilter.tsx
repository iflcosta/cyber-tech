'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { PART_ORDER_STATUSES } from '@/app/admin/types/database';

export function PartOrderFilter() {
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
  // React com a URL via useEffect. `key={urlQ}` remonta o input com o
  // valor novo quando a URL muda por fora (voltar do navegador etc).
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
          placeholder="Buscar por peça, fornecedor, OS…"
          aria-label="Buscar por peça, fornecedor, OS"
          className="flex-1 border-2 border-zinc-950 bg-white px-3 py-2 font-mono text-xs text-zinc-950 placeholder:text-zinc-400 focus:outline-none"
        />
        <button
          type="submit"
          className="border-2 border-zinc-950 bg-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition cursor-pointer"
        >
          Buscar
        </button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        <FilterChip
          label="Todos"
          active={!params.get('status') || params.get('status') === 'all'}
          onClick={() => update('status', null)}
        />
        <FilterChip
          label="Aguardando entrega"
          active={params.get('status') === 'ordered'}
          onClick={() => update('status', 'ordered')}
        />
        {PART_ORDER_STATUSES.filter((s) => s.value !== 'ordered').map((s) => (
          <FilterChip
            key={s.value}
            label={s.label}
            active={params.get('status') === s.value}
            onClick={() => update('status', s.value)}
          />
        ))}
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap px-3 py-1 font-mono text-xs uppercase tracking-wider transition cursor-pointer ${
        active
          ? 'border-2 border-zinc-950 bg-zinc-950 text-white font-bold'
          : 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 font-medium'
      }`}
    >
      {label}
    </button>
  );
}
