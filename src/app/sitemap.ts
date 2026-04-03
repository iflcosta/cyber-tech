import { MetadataRoute } from 'next';
import { getProducts } from '@/lib/products';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://cyberinformatica.tech';
    const products = await getProducts();
    const productRoutes = products
        .filter(p => p.slug)
        .map(p => ({
            url: `${baseUrl}/produtos/${p.slug}`,
            lastModified: new Date(p.created_at),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        }));

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/produtos`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/showroom`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        ...productRoutes,
    ];
}
