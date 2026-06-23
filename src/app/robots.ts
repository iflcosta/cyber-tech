import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin', '/api/'],
            },
        ],
        sitemap: 'https://www.cyberinformatica.tech/sitemap.xml',
        host: 'https://www.cyberinformatica.tech',
    };
}