'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { OS_STATUSES } from '@/app/admin/types/database';

export type TechSummaryItem = {
  id: string;
  full_name: string;
  count: number;
};

export function OSFilter({
  currentUserId,
  currentUserName,
  activeTech,
  counts,
  otherTechnicians,
}: {
  currentUserId: string;
  currentUserName: string;
  activeTech: string; // 'me' | 'all' | 'unassigned' | uuid
  counts: {
    mine: number;
    all: number;
    unassigned: number;
  };
  otherTechnicians: TechSummaryItem[];
}) {
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
      {/* 1. Seletor de Bancada / Técnico (Destaque Principal) */}
      <div className="flex flex-wrap items-center gap-2 border border-zinc-300 bg-white p-2.5 shadow-xs">
        <span className="px-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-500">
          Bancada:
        </span>

        <TechScopeButton
          active={activeTech === 'me' || activeTech === currentUserId}
          onClick={() => update('tech', 'me')}
          icon="👤"
          label={`Minhas OS (${currentUserName})`}
          count={counts.mine}
          highlight
        />

        <TechScopeButton
          active={activeTech === 'all'}
          onClick={() => update('tech', 'all')}
          icon="🌐"
          label="Todas da Loja"
          count={counts.all}
        />

        <TechScopeButton
          active={activeTech === 'unassigned'}
          onClick={() => update('tech', 'unassigned')}
          icon="⚠️"
          label="Sem Técnico"
          count={counts.unassigned}
          warn={counts.unassigned > 0}
        />

        {otherTechnicians.length > 0 && (
          <div className="hidden sm:block h-5 w-px bg-zinc-200 mx-0.5" />
        )}

        {otherTechnicians.map((tech) => (
          <TechScopeButton
            key={tech.id}
            active={activeTech === tech.id}
            onClick={() => update('tech', tech.id)}
            icon="🔧"
            label={tech.full_name}
            count={tech.count}
          />
        ))}
      </div>

      {/* 2. Busca por texto */}
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

      {/* 3. Filtro por Status */}
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

function TechScopeButton({
  active,
  onClick,
  icon,
  label,
  count,
  highlight,
  warn,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  count: number;
  highlight?: boolean;
  warn?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
        active
          ? 'bg-zinc-950 text-white shadow-xs'
          : warn
            ? 'border border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100'
            : highlight
              ? 'border border-zinc-300 bg-zinc-100 text-zinc-950 hover:bg-zinc-200'
              : 'border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
      <span
        className={`ml-0.5 px-1.5 py-0.2 text-[11px] font-extrabold ${
          active
            ? 'bg-white text-zinc-950'
            : warn
              ? 'bg-amber-200/80 text-amber-950'
              : 'bg-zinc-200/80 text-zinc-800'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  value: string;
  active: boolean;
  onClick: () => void;
}) {
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
