"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { X, Zap, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { getProducts } from "@/lib/products";
import { ProductCard, Product } from "./ProductCard";
import { FilterBar } from "./FilterBar";
import { useSearchParams } from "next/navigation";
import { useLeadModal } from "@/contexts/LeadModalContext";
import { AnimatePresence, motion } from "framer-motion";

const GAP = 32; // gap-8

function ShowroomContent() {
  const { openModal } = useLeadModal();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGallery, setSelectedGallery] = useState<{ images: string[], index: number } | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "all";

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      const data = await getProducts();
      const filtered = data.filter((p: any) => p.show_in_showroom);
      const mapped = filtered.map((p: any) => ({
        ...p,
        category: p.category === 'kit' ? 'gamer' : p.category,
        price_estimate: p.price,
        performance_score: p.performance_score || 0,
        in_stock: (p.stock_quantity || 0) > 0,
        image_url: p.image_urls?.[0]
      }));
      setProducts(mapped);
      setLoading(false);
    }
    loadProducts();
  }, []);

  // Reset carousel when filter changes
  useEffect(() => { setCarouselIndex(0); }, [category]);

  // Measure container width
  useEffect(() => {
    const update = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const handleInterest = (product: Product) => {
    openModal('compra',
      `Interesse no Produto: ${product.name} (R$ ${product.price.toLocaleString('pt-BR')})`,
      `Olá, tenho interesse no *${product.name}* que vi no site por *R$ ${product.price.toLocaleString('pt-BR')}*. Pode me ajudar?`,
      [product.id],
      { name: product.name, price: product.price, image: product.image_url }
    );
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'ViewContent', {
        content_name: product.name,
        content_category: product.category,
        content_ids: [product.id],
        content_type: 'product',
        value: product.price,
        currency: 'BRL'
      });
    }
  };

  const nextGalleryImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedGallery) return;
    setSelectedGallery({ ...selectedGallery, index: (selectedGallery.index + 1) % selectedGallery.images.length });
  };

  const prevGalleryImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedGallery) return;
    setSelectedGallery({ ...selectedGallery, index: (selectedGallery.index - 1 + selectedGallery.images.length) % selectedGallery.images.length });
  };

  const filteredProducts = products.filter((p) => {
    if (p.category === 'internal_part') return false;
    return category === "all" ? true : p.category === category;
  });

  // Carousel calculations
  const visibleCount = containerWidth >= 1024 ? 3 : containerWidth >= 640 ? 2 : 1;
  const cardWidth = containerWidth > 0 ? (containerWidth - GAP * (visibleCount - 1)) / visibleCount : 0;
  const maxIndex = Math.max(0, filteredProducts.length - visibleCount);
  const xOffset = -(carouselIndex * (cardWidth + GAP));

  const prev = () => setCarouselIndex(i => Math.max(0, i - 1));
  const next = () => setCarouselIndex(i => Math.min(maxIndex, i + 1));

  return (
    <div className="container mx-auto px-4">

      {/* Gallery lightbox */}
      <AnimatePresence>
        {selectedGallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-10"
            onClick={() => setSelectedGallery(null)}
          >
            <button
              className="absolute top-6 right-6 text-white/50 hover:text-white z-50 p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-[2px] transition-all"
              onClick={() => setSelectedGallery(null)}
            >
              <X size={24} />
            </button>

            {selectedGallery.images.length > 1 && (
              <>
                <button
                  className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 text-white/50 hover:text-white z-50 p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-[2px] transition-all"
                  onClick={prevGalleryImage}
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 text-white/50 hover:text-white z-50 p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-[2px] transition-all"
                  onClick={nextGalleryImage}
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative max-w-5xl w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedGallery.images[selectedGallery.index]}
                alt="Product View"
                className="max-w-full max-h-full object-contain rounded-[2px] shadow-2xl border border-white/10"
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 pb-6">
                {selectedGallery.images.map((_, i) => (
                  <div key={i} className={`w-4 h-1 rounded-[2px] transition-all ${i === selectedGallery.index ? 'bg-white' : 'bg-white/20'}`} />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8 relative z-10">
        <div>
          <div className="text-[10px] font-mono text-[var(--accent-primary)] uppercase tracking-[0.4em] font-black mb-4 flex items-center gap-3">
            <span className="w-8 h-[1px] bg-[var(--accent-primary)]" /> PERFORMANCE & HARDWARE ELITE
          </div>
          <h2 className="text-4xl md:text-7xl font-display font-bold mb-4 tracking-tight text-[var(--text-primary)] leading-none uppercase chrome-text">
            SHOWROOM <br />
            <span className="opacity-40 italic">PRECISION</span>
          </h2>
          <p className="text-[var(--text-secondary)] max-w-xl text-[10px] font-bold uppercase tracking-widest leading-relaxed">
            Workstations de IA, PC Gamers e Smartphones de alto desempenho em Bragança Paulista.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[var(--text-primary)] font-display font-bold tracking-[0.2em] uppercase text-xs">
          <Zap className="h-5 w-5 text-[var(--accent-primary)]" />
          <span className="chrome-text">ESTOQUE REAL BRAGANÇA</span>
        </div>
      </div>

      <FilterBar />

      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-[var(--text-muted)]" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed border-[var(--border-subtle)] rounded-xl bg-[var(--bg-surface)]/50 text-[var(--text-muted)]">
          <p className="text-[10px] font-bold uppercase tracking-widest">Nenhum produto encontrado nesta categoria.</p>
        </div>
      ) : (
        <>
          {/* Carousel wrapper */}
          <div className="relative">
            {/* Left arrow */}
            <button
              onClick={prev}
              disabled={carouselIndex === 0}
              className="absolute -left-5 top-1/2 -translate-y-1/2 z-20 p-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[2px] text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all disabled:opacity-20 disabled:pointer-events-none"
              aria-label="Anterior"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Cards track */}
            <div ref={containerRef} className="overflow-hidden">
              <motion.div
                className="flex"
                style={{ gap: GAP }}
                animate={{ x: xOffset }}
                transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.12}
                onDragEnd={(_, { offset }) => {
                  if (offset.x < -60) next();
                  else if (offset.x > 60) prev();
                }}
              >
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    style={{ minWidth: cardWidth, width: cardWidth }}
                    className="select-none"
                  >
                    <ProductCard
                      product={product}
                      onOpenGallery={(images) => setSelectedGallery({ images, index: 0 })}
                      onInterest={() => handleInterest(product)}
                    />
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right arrow */}
            <button
              onClick={next}
              disabled={carouselIndex >= maxIndex}
              className="absolute -right-5 top-1/2 -translate-y-1/2 z-20 p-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[2px] text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all disabled:opacity-20 disabled:pointer-events-none"
              aria-label="Próximo"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Dot indicators */}
          {maxIndex > 0 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCarouselIndex(i)}
                  className={`h-[3px] rounded-[2px] transition-all ${i === carouselIndex ? 'w-6 bg-[var(--accent-primary)]' : 'w-2 bg-white/20 hover:bg-white/40'}`}
                  aria-label={`Ir para posição ${i + 1}`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Showroom() {
  return (
    <section id="showroom" className="py-24 bg-[var(--bg-primary)] border-t border-[var(--border-subtle)] relative overflow-hidden red-line-top">
      <Suspense fallback={
        <div className="container mx-auto px-4 flex h-96 items-center justify-center text-[var(--text-primary)]">
          <Loader2 className="h-12 w-12 animate-spin" />
        </div>
      }>
        <ShowroomContent />
      </Suspense>
    </section>
  );
}
