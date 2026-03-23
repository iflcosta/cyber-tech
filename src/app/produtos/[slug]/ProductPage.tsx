'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Product } from '@/lib/products';
import { MessageSquare, ChevronLeft, ChevronRight, Package, ArrowLeft } from 'lucide-react';
import { brand } from '@/lib/brand';

const CATEGORY_LABELS: Record<string, string> = {
  gamer: 'PC Gamer',
  smartphone: 'Smartphone',
  workstation_ai: 'Workstation IA',
  office: 'Office Pro',
  hardware: 'Hardware',
  perifericos: 'Periféricos',
  kit: 'PC Gamer',
};

function isStoreOpen() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const minutes = now.getMinutes();
  const time = hour + minutes / 60;
  if (day >= 1 && day <= 5) return time >= 9 && time < 18;
  if (day === 6) return time >= 9 && time < 13;
  return false;
}

export default function ProductPage({ product }: { product: Product }) {
  const images = product.image_urls?.filter(Boolean) || [];
  const [activeImg, setActiveImg] = useState(0);
  const open = isStoreOpen();
  const inStock = (product.stock_quantity || 0) > 0;

  const price = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price);

  const whatsappMsg = encodeURIComponent(
    `Olá! Vi o produto *${product.name}* (${price}) no site e tenho interesse. Podem me dar mais informações?`
  );
  const whatsappUrl = `https://wa.me/${brand.whatsapp.replace(/\D/g, '')}?text=${whatsappMsg}`;

  const specEntries = Object.entries(product.specs || {}).filter(([, v]) => v && String(v).trim());

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] pt-24 md:pt-32 pb-20">
      <Header />

      <div className="container mx-auto px-4 max-w-6xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-10 text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
          <Link href="/produtos" className="flex items-center gap-1 hover:text-[var(--accent-primary)] transition-colors">
            <ArrowLeft className="h-3 w-3" /> Catálogo
          </Link>
          <span>/</span>
          <span className="text-[var(--text-secondary)]">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              {images[activeImg] ? (
                <Image src={images[activeImg]} alt={product.name} fill className="object-cover" priority />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Package className="h-16 w-16 text-[var(--border-active)]" />
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImg(i => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 rounded-full hover:bg-black/60 transition-all"
                  >
                    <ChevronLeft className="h-5 w-5 text-white" />
                  </button>
                  <button
                    onClick={() => setActiveImg(i => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 rounded-full hover:bg-black/60 transition-all"
                  >
                    <ChevronRight className="h-5 w-5 text-white" />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`relative shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === activeImg ? 'border-[var(--accent-primary)]' : 'border-[var(--border-subtle)] opacity-50 hover:opacity-100'}`}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[9px] uppercase tracking-widest border-[var(--accent-primary)]/40 text-[var(--accent-primary)] bg-[var(--accent-primary)]/5">
                  {CATEGORY_LABELS[product.category] || product.category}
                </Badge>
                <Badge className={`text-[9px] uppercase tracking-widest border ${inStock ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                  {inStock ? 'Em Estoque' : 'Sem Estoque'}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-black uppercase tracking-tight text-[var(--text-primary)] leading-tight">
                {product.name}
              </h1>
              {product.description && (
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{product.description}</p>
              )}
            </div>

            <div className="py-5 border-y border-[var(--border-subtle)]">
              <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-muted)]">Preço estimado</span>
              <div className="text-4xl font-display font-black text-[var(--text-primary)] tracking-tighter mt-1">{price}</div>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">Sujeito a variação. Consulte condições de pagamento.</p>
            </div>

            {specEntries.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--accent-primary)]">Especificações</h3>
                <div className="divide-y divide-[var(--border-subtle)]">
                  {specEntries.map(([key, value]) => (
                    <div key={key} className="flex items-start gap-4 py-2.5">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--text-muted)] w-24 shrink-0 pt-0.5">{key}</span>
                      <span className="text-sm font-bold text-[var(--text-primary)]">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <Button className="w-full h-12 text-sm">
                  <MessageSquare className="h-4 w-4" />
                  {open ? 'FALAR AGORA NO WHATSAPP' : 'TENHO INTERESSE'}
                </Button>
              </a>
              <Link href="/produtos" className="flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                <ArrowLeft className="h-3 w-3" /> Ver todos os produtos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
