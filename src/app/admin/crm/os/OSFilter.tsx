'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useEffect, useTransition } from 'react';

type Profile = { id: string; full_name: string; role: string };

export function OSFilter({ technicians }: { technicians: Profile[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setQ(params.get('q') ?? '');
  }, [params]);

  function update(key: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    // Deteccao automatica de IMEI: 14-16 digitos (com ou sem separador)
    const digits = term.replace(/\D/g, '');
    if (digits.length >= 14 && digits.length <= 16) {
      // Salva o IMEI canonico (so digitos) na URL pra query exata no banco
      update('imei', digits);
      update('q', null);
    } else {
      update('q', term || null);
      update('imei', null);
    }
  }

  const currentAssigned = params.get('assigned');
  const currentImei = params.get('imei');
  const isMine = params.get('mine') === '1';

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
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {pending ? 'Buscando…' : 'Buscar'}
        </button>
      </form>

      {/* Banner quando IMEI e' detectado (so pra UX) */}
      {currentImei && (
        <div className="flex items-center gap-2 rounded-md bg-purple-50 px-3 py-1.5 text-xs text-purple-800">
          <span>🔍 Busca por IMEI: <strong className="font-mono">{currentImei}</strong></span>
          <button
            type="button"
            onClick={() => update('imei', null)}
            className="ml-auto rounded-full px-2 py-0.5 text-purple-700 hover:bg-purple-100"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <FilterChip
          label="Ativas"
          active={!params.get('status') || params.get('status') === 'all'}
          onClick={() => update('status', null)}
        />
        <FilterChip
          label="Minhas"
          active={isMine}
          onClick={() => update('mine', isMine ? null : '1')}
        />
        {technicians.length > 0 && (
          <select
            value={currentAssigned ?? ''}
            onChange={(e) => update('assigned', e.target.value || null)}
            className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Técnico: qualquer</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
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
