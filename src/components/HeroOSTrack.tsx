'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight } from 'lucide-react';

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

  function handleQuickSample(sampleNumber: string) {
    setTerm(sampleNumber);
    router.push(`/status?q=${encodeURIComponent(sampleNumber)}`);
  }

  return (
    <div
      className={`p-5 bg-zinc-900/90 border border-zinc-800 max-w-2xl ${className}`}
    >
      <div className="flex items-center justify-between mb-3 text-xs font-mono">
        <span className="text-zinc-200 font-bold uppercase tracking-wider">
          Rastreio de Ordem de Serviço
        </span>
        <span className="text-zinc-400 text-[11px] hidden sm:inline">
          FOTOS DE ENTRADA · ORÇAMENTO · GARANTIA 90D
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-0 border border-zinc-700 bg-black">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-zinc-500 text-xs select-none">
            OS #
          </span>
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Nº da OS (ex: 1042) ou seu WhatsApp..."
            className="w-full bg-transparent pl-12 pr-3.5 py-3.5 text-xs sm:text-sm text-white placeholder-zinc-500 font-mono focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="bg-white hover:bg-zinc-200 text-black font-mono font-bold uppercase tracking-wider py-3.5 px-6 text-xs shrink-0 flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Consultar OS</span>
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-zinc-400">
        <div className="flex items-center gap-2">
          <span>Demonstração do portal:</span>
          <button
            type="button"
            onClick={() => handleQuickSample('1042')}
            className="inline-flex items-center gap-1 text-white hover:text-zinc-300 underline underline-offset-4 cursor-pointer font-bold transition-colors"
          >
            <span>Ver OS #1042</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <span className="text-zinc-500 hidden sm:inline">
          CONSULTA 24H PELO CELULAR
        </span>
      </div>
    </div>
  );
}
