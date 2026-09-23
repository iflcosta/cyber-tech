'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ShieldCheck } from 'lucide-react';

export default function HeroOSTrack() {
  const router = useRouter();
  const [term, setTerm] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!term.trim()) return;
    router.push(`/status?q=${encodeURIComponent(term.trim())}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full bg-[#111114]/90 backdrop-blur-md border border-white/15 p-2 rounded-lg shadow-2xl focus-within:border-white/40 transition-colors"
    >
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Digite o nº da sua OS ou celular..."
            className="w-full bg-transparent pl-10 pr-3 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-400 font-mono focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 bg-white text-zinc-950 font-mono font-bold text-xs uppercase tracking-wider rounded-md hover:bg-zinc-200 transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Rastrear OS</span>
        </button>
      </div>
      <div className="mt-2 px-1 flex items-center justify-between text-[11px] font-mono text-zinc-400">
        <span>Bancada Ativa · Bragança Paulista</span>
        <span className="text-emerald-400">Telemetria em Tempo Real</span>
      </div>
    </form>
  );
}
