import React from 'react';

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 280 60" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Polished Industrial Chrome Gradient */}
        <linearGradient id="metal-grad-final" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="40%" stopColor="#cbd5e1" />
          <stop offset="60%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        <filter id="premium-bevel" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 3D Geometric Brackets - Technical Engineering Style */}
      <g transform="translate(10, 10)" filter="url(#premium-bevel)">
        {/* Outer Bracket */}
        <path 
          d="M40 5L5 5L5 45L45 45" 
          stroke="url(#metal-grad-final)" 
          strokeWidth="8" 
          strokeLinejoin="miter" 
          strokeMiterlimit="2"
        />
        {/* Inner Bracket */}
        <path 
          d="M30 15L15 15L15 35L35 35" 
          stroke="url(#metal-grad-final)" 
          strokeWidth="5" 
          strokeLinejoin="miter" 
          strokeMiterlimit="2"
          opacity="0.8"
        />
        {/* Core Accent Dot (Matches Site Hot Accent) */}
        <rect x="23" y="23" width="4" height="4" fill="#E84C4C" rx="1" />
      </g>

      {/* Technical Vertical Divider */}
      <rect x="75" y="15" width="1.5" height="30" fill="white" fillOpacity="0.1" />

      {/* Typography - High Impact Performance Brand */}
      <g transform="translate(92, 38)">
        {/* 'cyber' - Bold Display Sans (Matches Site Heading Font) */}
        <text 
          fill="#E2E2E7"
          fontFamily="Rajdhani, Inter, system-ui, -apple-system, sans-serif"
          fontWeight="700"
          fontSize="36"
          letterSpacing="-0.01em"
          style={{ textTransform: 'lowercase' }}
        >
          cyber
        </text>
        {/* 'informática' - Monospace Engineering Subtitle */}
        <text 
          y="18"
          fill="#8A8A9A"
          fontFamily="JetBrains Mono, Inter, monospace"
          fontWeight="400"
          fontSize="12.5"
          letterSpacing="0.15em"
          style={{ textTransform: 'lowercase' }}
        >
          informática
        </text>
      </g>
    </svg>
  );
}
