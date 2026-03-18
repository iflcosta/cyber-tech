"use client";

import { useState, useEffect, Suspense } from "react";
import { X, Zap, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { getProducts } from "@/lib/products";
import { ProductCard, Product } from "./ProductCard";
import { FilterBar } from "./FilterBar";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLeadModal } from "@/contexts/LeadModalContext";
import { AnimatePresence, motion } from "framer-motion";

function ShowroomContent() {
  const { openModal } = useLeadModal();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedGallery, setSelectedGallery] = useState<{ images: string[], index: number } | null>(null);
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "all";

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      const data = await getProducts();
      const mapped = data.map((p: any) => ({
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

  const handleInterest = (product: Product) => {
    setSelectedProduct(product);
    openModal('compra', 
      `Interesse no Produto: ${product.name} (R$ ${product.price.toLocaleString('pt-BR')})`,
      `Olá, tenho interesse no *${product.name}* que vi no site por *R$ ${product.price.toLocaleString('pt-BR')}*. Pode me ajudar?`
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

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedGallery) return;
    setSelectedGallery({
      ...selectedGallery,
      index: (selectedGallery.index + 1) % selectedGallery.images.length
    });
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedGallery) return;
    setSelectedGallery({
      ...selectedGallery,
      index: (selectedGallery.index - 1 + selectedGallery.images.length) % selectedGallery.images.length
    });
  };

  const filteredProducts = products.filter((p) => 
    category === "all" ? true : p.category === category
  );

  return (
    <div className="container mx-auto px-4">

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
                  onClick={prevImage}
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 text-white/50 hover:text-white z-50 p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-[2px] transition-all"
                  onClick={nextImage}
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
                  <div
                    key={i}
                    className={`w-4 h-1 rounded-[2px] transition-all ${i === selectedGallery.index ? 'bg-white' : 'bg-white/20'}`}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            Workstations de IA e setups de alto desempenho configurados para máxima produtividade.
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
          <Loader2 className="h-12 w-12 animate-spin text-[#1A1A1A]" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onOpenGallery={(images) => setSelectedGallery({ images, index: 0 })}
                onInterest={() => handleInterest(product)}
              />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-[var(--border-subtle)] rounded-xl bg-[var(--bg-surface)]/50 text-[var(--text-muted)]">
              <p className="text-[10px] font-bold uppercase tracking-widest">Nenhum produto encontrado nesta categoria.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Showroom() {
  return (
    <section id="produtos" className="py-24 bg-[var(--bg-primary)] border-t border-[var(--border-subtle)] relative overflow-hidden">
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
