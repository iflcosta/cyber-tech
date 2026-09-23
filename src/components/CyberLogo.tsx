export default function CyberLogo({ height = 32, className = "" }: { height?: number; className?: string }) {
  // Logo horizontal Cyber Informática — industrial tech, navy + circuit-green accent.
  // SVG inline pra evitar 404 e garantir que sempre renderize.
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 240 56"
      height={height}
      className={className}
      role="img"
      aria-label="Cyber Informática — Loja técnica em Bragança Paulista"
    >
      {/* Monograma "C" estilizada à esquerda */}
      <g transform="translate(0, 0)">
        <defs>
          <linearGradient id="cy-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#27272a" />
            <stop offset="100%" stopColor="#18181b" />
          </linearGradient>
        </defs>
        {/* Quadrado com cantos chanfrados sutis */}
        <rect x="0" y="0" width="56" height="56" rx="8" fill="url(#cy-grad-1)" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
        {/* "C" estilizada — gap aberto à direita */}
        <path
          d="M 38 18 A 14 14 0 1 0 38 38"
          stroke="#ffffff"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Dot de status (Laser White / Acento Pericial) */}
        <circle cx="44" cy="14" r="3" fill="#09090b" />
        <circle cx="44" cy="14" r="2" fill="#ffffff" />
      </g>

      {/* Texto */}
      <g transform="translate(68, 0)">
        <text
          x="0"
          y="26"
          fill="#ffffff"
          fontFamily="Space Grotesk, Inter, sans-serif"
          fontWeight="700"
          fontSize="20"
          letterSpacing="-0.5"
        >
          Cyber
        </text>
        <text
          x="0"
          y="46"
          fill="#a1a1aa"
          fontFamily="Space Grotesk, Inter, sans-serif"
          fontWeight="500"
          fontSize="11"
          letterSpacing="2"
        >
          INFORMÁTICA
        </text>
        {/* Accent line embaixo */}
        <rect x="0" y="50" width="32" height="2" rx="1" fill="#ffffff" />
      </g>
    </svg>
  );
}