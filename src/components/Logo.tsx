// Opção A — SVG refinado: bracket externo vermelho, interno escuro, subtítulo legível
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* 3D Geometric Brackets - Technical Engineering Style */}
      <g transform="translate(10, 10)">
        {/* Outer Bracket — vermelho industrial */}
        <path
          d="M40 5L5 5L5 45L45 45"
          stroke="#E84C4C"
          strokeWidth="7"
          strokeLinejoin="miter"
          strokeMiterlimit="2"
        />
        {/* Inner Bracket — grafite escuro */}
        <path
          d="M30 15L15 15L15 35L35 35"
          stroke="#1A1A1E"
          strokeWidth="4"
          strokeLinejoin="miter"
          strokeMiterlimit="2"
          opacity="0.35"
        />
        {/* Core Accent Dot — aumentado para visibilidade */}
        <rect x="21.5" y="21.5" width="7" height="7" fill="#E84C4C" rx="1.5" />
      </g>

      {/* Technical Vertical Divider */}
      <rect x="75" y="14" width="1.5" height="32" fill="#1A1A1E" fillOpacity="0.12" />

      {/* Typography */}
      <g transform="translate(92, 38)">
        {/* 'cyber' */}
        <text
          fill="#1A1A1E"
          fontFamily="Rajdhani, Inter, system-ui, sans-serif"
          fontWeight="700"
          fontSize="36"
          letterSpacing="-0.01em"
          style={{ textTransform: 'lowercase' }}
        >
          cyber
        </text>
        {/* 'informática' — mais escuro e legível */}
        <text
          y="18"
          fill="#505060"
          fontFamily="JetBrains Mono, monospace"
          fontWeight="400"
          fontSize="12.5"
          letterSpacing="0.28em"
          style={{ textTransform: 'lowercase' }}
        >
          informática
        </text>
      </g>
    </svg>
  );
}
