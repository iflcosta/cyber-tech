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
    ];
  },
};

export default nextConfig;
