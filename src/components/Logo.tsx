import React from 'react';

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <svg 
      width="240" 
      height="60" 
      viewBox="0 0 240 60" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Elite Chrome Gradient - Brushed Stainless Look */}
        <linearGradient id="chrome-premium" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="30%" stopColor="#cbd5e1" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="70%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        <filter id="bevel-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Brand Icon: Exact Nested Brackets from Reference */}
      <g transform="translate(10, 10)" filter="url(#bevel-soft)">
        {/* Outer Bracket - Polished Chrome */}
        <path 
          d="M36 4L4 4L4 36L40 36" 
          stroke="url(#chrome-premium)" 
          strokeWidth="6" 
          strokeLinejoin="miter" 
          strokeMiterlimit="2"
        />
        {/* Inner Bracket - Refined Silver */}
        <path 
          d="M26 14L12 14L12 28L30 28" 
          stroke="url(#chrome-premium)" 
          strokeWidth="4" 
          strokeLinejoin="miter" 
          strokeMiterlimit="2"
          opacity="0.8"
        />
        {/* Accent Point - Industrial Performance Red */}
        <rect x="22" y="22" width="4" height="4" fill="#E84C4C" rx="1" />
      </g>

      {/* Subtle Divider */}
      <rect x="68" y="15" width="1" height="30" fill="currentColor" opacity="0.1" />

      {/* Brand Name - Optimized for Header Visibility */}
      <g transform="translate(84, 38)">
        {/* Bold Tech Typo (Matches Project --text-primary) */}
        <text 
          fill="currentColor"
          fontFamily="Rajdhani, system-ui, sans-serif"
          fontWeight="700"
          fontSize="32"
          letterSpacing="-0.02em"
          style={{ textTransform: 'lowercase' }}
        >
          cyber
        </text>
        {/* Subtitle - High-Precision Mono */}
        <text 
          y="16"
          fill="currentColor"
          opacity="0.5"
          fontFamily="JetBrains Mono, monospace"
          fontWeight="400"
          fontSize="11"
          letterSpacing="0.3em"
          style={{ textTransform: 'lowercase' }}
        >
          informática
        </text>
      </g>
    </svg>
  );
}
