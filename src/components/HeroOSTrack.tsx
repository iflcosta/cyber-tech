'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

interface HeroOSTrackProps {
  className?: string;
  defaultVal?: string;
}

export default function HeroOSTrack({ className = '', defaultVal = '' }: HeroOSTrackProps) {
  const router = useRouter();
  const [term, setTerm] = useState(defaultVal);

  function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const clean = term.trim().replace(/^OS-?/i, '').replace(/^#/, '');
    if (!clean) return;
    router.push(`/status?q=${encodeURIComponent(clean)}`);
  }

  return (
    <div
      className={`p-3.5 sm:p-4 bg-zinc-900/90 border border-zinc-800 max-w-2xl ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2 text-[11px] font-mono">
        <span className="text-zinc-200 font-bold uppercase tracking-wider">
          Já deixou equipamento na bancada?
        </span>
        <span className="text-zinc-400 font-bold uppercase">
          Rastreio 24h
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-row gap-0 border border-zinc-700 bg-black">
        <div className="relative flex-1 min-w-0">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-zinc-500 text-xs select-none">
            OS #
          </span>
          <input
            type="text"
            enterKeyHint="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Nº da OS ou WhatsApp..."
            className="w-full bg-transparent pl-11 pr-2 py-2.5 text-base sm:text-sm text-white placeholder-zinc-500 font-mono focus:outline-none min-h-[44px]"
          />
        </div>
        <button
          type="submit"
          className="bg-white hover:bg-zinc-200 text-black font-mono font-bold uppercase tracking-wider py-2.5 px-4 sm:px-5 text-xs shrink-0 flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span>Consultar</span>
        </button>
      </form>
    </div>
  );
}
