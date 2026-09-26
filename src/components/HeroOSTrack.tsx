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
      className={`p-3.5 sm:p-4 bg-zinc-900/80 border border-zinc-800 max-w-2xl ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2.5 text-[11px] font-mono">
        <span className="text-zinc-300 font-bold uppercase tracking-wider">
          Já deixou equipamento na bancada? Consulte sua OS:
        </span>
        <span className="text-zinc-500 hidden sm:inline">
          ACOMPANHAMENTO 24H
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-row gap-0 border border-zinc-700 bg-black">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-zinc-500 text-xs select-none">
            OS #
          </span>
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Nº da OS ou seu WhatsApp..."
            className="w-full bg-transparent pl-11 pr-3 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 font-mono focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="bg-zinc-800 hover:bg-zinc-700 text-white border-l border-zinc-700 font-mono font-bold uppercase tracking-wider py-2.5 px-4 sm:px-5 text-xs shrink-0 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Consultar</span>
        </button>
      </form>
    </div>
  );
}
