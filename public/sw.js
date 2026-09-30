const CACHE_NAME = 'cyber-erp-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Nunca intercepta mutações (POST/PUT/PATCH/DELETE) ou chamadas externas/API
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/webpack-hmr')) {
    return;
  }

  // Para navegação de páginas: Network-First seguro com fallback offline amigável
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response(
          '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cyber ERP — Sem conexão</title><style>body{font-family:system-ui,sans-serif;background:#09090b;color:#fafafa;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;text-align:center}.box{max-width:400px;border:1px solid #27272a;border-radius:12px;padding:24px;background:#18181b}button{margin-top:16px;background:#10b981;color:#052e16;border:0;padding:10px 20px;border-radius:8px;font-weight:700;cursor:pointer}</style></head><body><div class="box"><h2>Sem conexão com a internet</h2><p style="color:#a1a1aa;font-size:14px">Verifique o Wi-Fi ou cabo de rede da bancada e tente novamente.</p><button onclick="location.reload()">Tentar novamente</button></div></body></html>',
          {
            status: 503,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          },
        );
      }),
    );
    return;
  }
});
