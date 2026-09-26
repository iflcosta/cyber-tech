import { MetadataRoute } from 'next';
import { brand } from '@/lib/brand';

const SITE_URL = brand.url;

// Rotas publicas reais do site institucional (junho/2026)
// CRM (/admin/*) intencionalmente excluido - URL privada
// /api/* excluido - endpoints internos
// /produtos, /showroom etc destruidos no reboot
const PUBLIC_ROUTES = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' as const },
  { path: '/suporte-ti', priority: 0.9, changeFrequency: 'weekly' as const },
  { path: '/contato', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/politica-privacidade', priority: 0.3, changeFrequency: 'yearly' as const },
  { path: '/termos-de-uso', priority: 0.3, changeFrequency: 'yearly' as const },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return PUBLIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}