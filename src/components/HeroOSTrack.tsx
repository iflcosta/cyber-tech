'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ShieldCheck, ArrowRight, Zap } from 'lucide-react';

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
    <div className={`p-4 sm:p-5 bg-[#0f0f13] border border-[#242429] rounded-sm max-w-2xl ${className}`}>
      {/* Header do Painel Milled Chassis */}
      <div className="flex items-center justify-between mb-3 font-mono text-[11px]">
        <span className="text-zinc-300 font-bold uppercase flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>CONSULTA DE PROTOCOLO PERICIAL</span>
        </span>
        <span className="text-zinc-400 text-[10px] hidden xs:inline">
          SN-OS-2026 // LGPD SAFE
        </span>
      </div>

      {/* Formulário de Busca */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-zinc-400 text-xs select-none">
            OS-
          </span>
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Digite o nº da OS (ex: 1042) ou celular..."
            className="w-full bg-[#15151a] border border-[#2e2e36] pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-400 font-mono focus:outline-none focus:border-white transition-colors rounded-sm"
          />
        </div>
        <button
          type="submit"
          className="btn-tactile-primary !py-2.5 !px-5 text-xs shrink-0 flex items-center justify-center gap-1.5"
        >
          <Search className="w-3.5 h-3.5" />
          <span>INSPECIONAR OS</span>
        </button>
      </form>

      {/* Micro-Chips de Atalho e Telemetria */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-zinc-400 border-t border-[#1a1a20] pt-2.5">
        <div className="flex items-center gap-2">
          <span>Demonstração:</span>
          <button
            type="button"
            onClick={() => handleQuickSample('1042')}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#17171f] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-[#2a2a35] hover:border-zinc-500 rounded-sm cursor-pointer transition-colors"
          >
            <Zap className="w-2.5 h-2.5 text-emerald-400" />
            <span className="font-bold">Testar OS #1042</span>
          </button>
        </div>

        <div className="flex items-center gap-1 text-emerald-400 font-bold ml-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>TEMPO REAL 24/7</span>
        </div>
      </div>
    </div>
  );
}
