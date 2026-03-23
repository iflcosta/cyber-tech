import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProductBySlug } from '@/lib/products';
import ProductPage from './ProductPage';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Produto não encontrado | Cyber Informática' };

  const priceFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price);
  const priceRaw = new Intl.NumberFormat('pt-BR').format(product.price);
  const ogUrl = `https://cyberinformatica.tech/api/og?title=${encodeURIComponent(product.name)}&price=${encodeURIComponent(priceRaw)}&category=${encodeURIComponent(product.category)}`;

  return {
    title: `${product.name} | Cyber Informática`,
    description: product.description || `${product.name} disponível na Cyber Informática em Bragança Paulista. ${priceFormatted}.`,
    openGraph: {
      title: `${product.name} | Cyber Informática`,
      description: product.description || `${product.name} — ${priceFormatted}`,
      url: `https://cyberinformatica.tech/produtos/${slug}`,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | Cyber Informática`,
      description: product.description || `${product.name} — ${priceFormatted}`,
      images: [ogUrl],
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  return <ProductPage product={product} />;
}
