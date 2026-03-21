// Opção B — Wordmark HTML: sem FOUT, renderiza com as fontes reais do site

export default function LogoAlt({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Ícone: bracket em SVG puro (sem texto, sem dependência de fonte) */}
      <svg width="38" height="38" viewBox="0 0 38 38" fill="none" aria-hidden="true">
        {/* Bracket externo — vermelho */}
        <path
          d="M30 3L3 3L3 35L30 35"
          stroke="#E84C4C"
          strokeWidth="4.5"
          strokeLinejoin="miter"
          strokeLinecap="square"
        />
        {/* Bracket interno — grafite */}
        <path
          d="M23 11L11 11L11 27L23 27"
          stroke="#1A1A1E"
          strokeWidth="2.5"
          strokeLinejoin="miter"
          strokeLinecap="square"
          opacity="0.3"
        />
        {/* Ponto central */}
        <rect x="16" y="16" width="6" height="6" fill="#E84C4C" rx="1.5" />
      </svg>

      {/* Divisor */}
      <div className="w-px h-7 bg-black/10" />

      {/* Texto renderizado com CSS — sem FOUT */}
      <div className="flex flex-col justify-center gap-[3px]">
        <span
          style={{ fontFamily: 'var(--font-rajdhani), sans-serif' }}
          className="font-bold text-[26px] leading-none tracking-tight text-[#1A1A1E]"
        >
          cyber
        </span>
        <span
          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
          className="text-[9.5px] leading-none tracking-[0.28em] text-[#505060] lowercase"
        >
          informática
        </span>
      </div>
    </div>
  );
}
