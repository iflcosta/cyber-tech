"use client";

import { useState, useEffect, Suspense } from "react";
import { X, Zap, ChevronLeft, ChevronRight, Loader2, Search, Filter, SlidersHorizontal, Package } from "lucide-react";
import { getProducts } from "@/lib/products";
import { ProductCard, Product } from "./ProductCard";
import { useSearchParams, useRouter } from "next/navigation";
import { useLeadModal } from "@/contexts/LeadModalContext";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "./ui/Button";

const CATEGORIES = [
  { id: "all", label: "Tudo" },
  { id: "smartphone", label: "Smartphones" },
  { id: "gamer", label: "PC Gamer" },
  { id: "workstation_ai", label: "Workstation IA" },
  { id: "office", label: "Office Pro" },
  { id: "hardware", label: "Hardware" },
  { id: "perifericos", label: "Periféricos" },
];

function CatalogContent() {
  const { openModal } = useLeadModal();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedGallery, setSelectedGallery] = useState<{ images: string[], index: number } | null>(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeCategory = searchParams.get("category") || "all";

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      const data = await getProducts();
      const filtered = data.filter((p: any) => p.show_in_catalog);
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

  const handleCategoryChange = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id === "all") {
      params.delete("category");
    } else {
      params.set("category", id);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleInterest = (product: Product) => {
    openModal('compra',
      `Interesse no Produto: ${product.name}`,
      `Olá, vi o *${product.name}* no catálogo e gostaria de mais informações.`,
      [product.id]
    );
  };

  const filteredProducts = products.filter((p) => {
    if (p.category === 'internal_part') return false;
    const matchesCategory = activeCategory === "all" || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="container mx-auto px-4 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="space-y-1">
          <h1 className="text-4xl font-display font-bold tracking-tight text-[var(--text-primary)] uppercase chrome-text">
            Catálogo <span className="opacity-40 italic">Elite</span>
          </h1>
          <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-[0.2em]">
            Hardware de alta performance • {filteredProducts.length} itens encontrados
          </p>
        </div>

        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] group-focus-within:text-[var(--accent-primary)] transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou categoria..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-[var(--accent-primary)] transition-all font-sans text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block space-y-10">
          <div className="space-y-6">
            <h3 className="text-[10px] font-mono font-bold text-[var(--accent-primary)] uppercase tracking-[0.3em] flex items-center gap-2">
              <Filter className="h-3 w-3" /> Categorias
            </h3>
            <nav className="flex flex-col gap-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border",
                    activeCategory === cat.id
                      ? "bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)]"
                      : "bg-transparent border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {cat.label}
                  {activeCategory === cat.id && <Zap className="h-3 w-3 fill-current" />}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6 bg-gradient-to-br from-[var(--bg-elevated)] to-transparent border border-[var(--border-subtle)] rounded-2xl relative overflow-hidden">
             <div className="absolute -right-4 -bottom-4 opacity-5 rotate-12">
               <Zap size={100} />
             </div>
             <h4 className="text-[11px] font-display font-bold text-white uppercase tracking-widest mb-3">Consultoria Premium</h4>
             <p className="text-[9px] text-[var(--text-muted)] font-mono leading-relaxed uppercase mb-4">
               Não encontrou o que precisava? Nossa equipe monta setups personalizados sob medida.
             </p>
             <button 
               onClick={() => openModal('duvida')}
               className="text-[9px] font-bold text-[var(--accent-primary)] hover:underline uppercase tracking-tight"
             >
               Falar com Especialista →
             </button>
          </div>
        </aside>

        {/* Mobile Filter Trigger */}
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden flex items-center justify-center gap-2 w-full py-4 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl text-xs font-bold uppercase tracking-widest text-[var(--text-primary)]"
        >
          <SlidersHorizontal className="h-4 w-4" /> Filtrar Produtos
        </button>

        {/* Product Grid */}
        <div className="space-y-16">
          {loading ? (
            <div className="flex h-96 items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-[var(--accent-primary)]" />
            </div>
          ) : (
            <>
              {activeCategory === "all" ? (
                // Grouped view
                CATEGORIES.filter(cat => cat.id !== 'all').map(cat => {
                  const categoryProducts = filteredProducts.filter(p => p.category === cat.id);
                  if (categoryProducts.length === 0) return null;

                    return (
                      <section key={cat.id} className="space-y-8">
                        <div className="flex items-center gap-4">
                          <h2 className="text-2xl font-display font-black uppercase tracking-[0.2em] text-[var(--text-primary)] chrome-text">
                            {cat.label}
                          </h2>
                          <div className="h-px flex-1 bg-gradient-to-r from-[var(--border-active)] to-transparent opacity-30" />
                        </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {categoryProducts.map((product) => (
                          <ProductCard 
                            key={product.id} 
                            product={product} 
                            onOpenGallery={(images) => setSelectedGallery({ images, index: 0 })}
                            onInterest={() => handleInterest(product)}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })
              ) : (
                // Standard grid view for single category
                <>
                  {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredProducts.map((product) => (
                        <ProductCard 
                          key={product.id} 
                          product={product} 
                          onOpenGallery={(images) => setSelectedGallery({ images, index: 0 })}
                          onInterest={() => handleInterest(product)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-96 border border-dashed border-[var(--border-subtle)] rounded-2xl bg-[var(--bg-surface)]/30 text-center px-10">
                      <Package className="h-12 w-12 text-[var(--text-muted)] mb-4 opacity-20" />
                      <p className="text-[11px] font-mono font-bold uppercase text-[var(--text-muted)] tracking-widest">
                        Nenhum item corresponde à sua busca técnica.
                      </p>
                      <button 
                        onClick={() => { setSearchTerm(""); handleCategoryChange("all"); }}
                        className="mt-6 text-[10px] font-bold text-[var(--accent-primary)] uppercase underline tracking-tighter"
                      >
                        Limpar Filtros
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Gallery Modal */}
      <AnimatePresence>
        {selectedGallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-10"
            onClick={() => setSelectedGallery(null)}
          >
            <button
               className="absolute top-6 right-6 text-white/50 hover:text-white z-50 p-3 bg-white/5 border border-white/10 rounded-full transition-all"
               onClick={() => setSelectedGallery(null)}
            >
              <X size={24} />
            </button>

            <button
              className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 text-white/50 hover:text-white z-50 p-4 bg-white/5 border border-white/10 rounded-full transition-all"
              onClick={(e) => { e.stopPropagation(); setSelectedGallery({ ...selectedGallery, index: (selectedGallery.index - 1 + selectedGallery.images.length) % selectedGallery.images.length })}}
            >
              <ChevronLeft size={32} />
            </button>
            <button
              className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 text-white/50 hover:text-white z-50 p-4 bg-white/5 border border-white/10 rounded-full transition-all"
              onClick={(e) => { e.stopPropagation(); setSelectedGallery({ ...selectedGallery, index: (selectedGallery.index + 1) % selectedGallery.images.length })}}
            >
              <ChevronRight size={32} />
            </button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative max-w-6xl w-full h-[80vh] flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedGallery.images[selectedGallery.index]}
                alt="Product View"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Modal */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed right-0 top-0 h-full w-[80%] bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] z-[160] p-8 lg:hidden"
            >
              <div className="flex justify-between items-center mb-10">
                <span className="text-xl font-display font-bold text-[var(--text-primary)] uppercase tracking-widest chrome-text">Filtros</span>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg">
                  <X size={20} className="text-[var(--text-secondary)]" />
                </button>
              </div>

              <div className="space-y-8">
                <h3 className="text-[10px] font-mono font-bold text-[var(--accent-primary)] uppercase tracking-[0.3em]">Categorias</h3>
                <div className="flex flex-col gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { handleCategoryChange(cat.id); setIsSidebarOpen(false); }}
                      className={cn(
                        "w-full text-left px-5 py-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border",
                        activeCategory === cat.id
                          ? "bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)]"
                          : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)]"
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProductCatalog() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-24 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[var(--accent-primary)]" />
      </div>
    }>
      <CatalogContent />
    </Suspense>
  );
}
