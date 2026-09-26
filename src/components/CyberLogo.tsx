export default function CyberLogo({
  height = 34,
  className = '',
  variant = 'dark',
}: {
  height?: number;
  className?: string;
  variant?: 'light' | 'dark';
}) {
  const isDarkBg = variant === 'dark';
  const boxFill = isDarkBg ? '#ffffff' : '#09090b';
  const markStroke = isDarkBg ? '#09090b' : '#ffffff';
  const titleColor = isDarkBg ? '#ffffff' : '#09090b';
  const subtitleColor = isDarkBg ? '#a1a1aa' : '#52525b';
  const ruleColor = isDarkBg ? '#71717a' : '#27272a';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 248 56"
      height={height}
      className={className}
      role="img"
      aria-label="Cyber Informática — Bragança Paulista"
    >
      {/* Monograma Geométrico Preto/Branco */}
      <g transform="translate(0, 2)">
        <rect x="0" y="0" width="52" height="52" rx="2" fill={boxFill} />
        <path
          d="M 36 16 L 19 16 L 14 26 L 19 36 L 36 36"
          stroke={markStroke}
          strokeWidth="4.5"
          strokeLinecap="square"
          strokeLinejoin="miter"
          fill="none"
        />
        <rect x="33" y="23.5" width="7" height="5" fill={markStroke} />
      </g>

      {/* Tipografia Editorial */}
      <g transform="translate(64, 0)">
        <text
          x="0"
          y="27"
          fill={titleColor}
          fontFamily="Space Grotesk, Inter, sans-serif"
          fontWeight="800"
          fontSize="22"
          letterSpacing="1.5"
        >
          CYBER
        </text>
        <text
          x="0"
          y="44"
          fill={subtitleColor}
          fontFamily="JetBrains Mono, Inter, monospace"
          fontWeight="600"
          fontSize="10"
          letterSpacing="2.8"
        >
          INFORMÁTICA
        </text>
        <rect x="0" y="49" width="44" height="2" fill={ruleColor} />
      </g>
    </svg>
  );
}