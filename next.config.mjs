/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'isrqhxhoabxkpunmbxti.supabase.co',
        pathname: '/**',
      },
    ],
  },

  // Redireciona TODO request sem 'www' para 'www' (SEO canonical)
  // Auditoria 2026-06-23: Google perdia PageRank na cadeia
  // 308 (cyberinformatica.tech -> www.cyberinformatica.tech).
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'cyberinformatica.tech',
          },
        ],
        destination: 'https://www.cyberinformatica.tech/:path*',
        permanent: true,
      },
    ];
  },

  // Auditoria de seguranca 2026-06-23 adicionou:
  // - HSTS: forca HTTPS por 2 anos
  // - X-Content-Type-Options: previne MIME sniffing
  // - X-Frame-Options SAMEORIGIN: previne clickjacking
  // - Referrer-Policy: privacidade no referer
  // - Permissions-Policy: bloqueia camera/microfone nao autorizado
  // - CSP: limita origens de script/connect/img
  //
  // Cache-Control (2026-06-23): HTML estava com no-store (Vercel
  // default pra dev). Forca refetch em cada visita, doendo
  // PageSpeed. Agora HTML publico: s-maxage=300 + SWR=24h.
  // /admin/* fica no-store (sessoes sao criticas).
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://*.googletagmanager.com https://connect.facebook.net https://*.supabase.co",
              "img-src 'self' data: https:",
              "connect-src 'self' https://*.supabase.co https://*.google-analytics.com",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
      {
        // HTML publico (NÃO /admin): cache no edge (5min) + SWR (24h)
        // - Visita em <5min: serve do edge (instant)
        // - Visita em 5min-24h: serve do edge (stale) + atualiza em background
        source: '/((?!admin).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=86400',
          },
        ],
      },
      {
        // Home: regex explicito (rota raiz as vezes nao pega com
        // source: /((?!admin).*) por causa do catch-all do Next.js)
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=86400',
          },
        ],
      },
      {
        // /admin/* NUNCA cache (sessoes sao criticas)
        source: '/admin/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-store, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
