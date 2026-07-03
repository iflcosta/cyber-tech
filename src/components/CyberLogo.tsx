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
            <stop offset="0%" stopColor="#0066ff" />
            <stop offset="100%" stopColor="#00ff88" />
          </linearGradient>
        </defs>
        {/* Quadrado com cantos arredondados */}
        <rect x="0" y="0" width="56" height="56" rx="10" fill="url(#cy-grad-1)" />
        {/* "C" estilizada — gap aberto à direita */}
        <path
          d="M 38 18 A 14 14 0 1 0 38 38"
          stroke="#0a1929"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        {/* Dot de status (verde circuit) */}
        <circle cx="44" cy="14" r="3" fill="#0a1929" />
        <circle cx="44" cy="14" r="2" fill="#00ff88" />
      </g>

      {/* Texto */}
      <g transform="translate(68, 0)">
        <text
          x="0"
          y="26"
          fill="#f5f8ff"
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
          fill="#8892b0"
          fontFamily="Space Grotesk, Inter, sans-serif"
          fontWeight="500"
          fontSize="11"
          letterSpacing="2"
        >
          INFORMÁTICA
        </text>
        {/* Accent line embaixo */}
        <rect x="0" y="50" width="32" height="2" rx="1" fill="#0066ff" />
      </g>
    </svg>
  );
}