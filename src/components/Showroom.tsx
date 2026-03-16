"use client";
import { useEffect, useState } from "react";
import { Cpu, Gamepad2, Loader2, Eye, X, ChevronLeft, ChevronRight, ShoppingBag, Smartphone } from "lucide-react";
import { getProducts, Product } from "@/lib/products";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/contexts/CartContext";
import { motion, AnimatePresence } from "framer-motion";

import LeadModal from "./LeadModal";

export default function Showroom() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedGallery, setSelectedGallery] = useState<{ images: string[], index: number } | null>(null);
    const { addToCart } = useCart();

    useEffect(() => {
        async function loadProducts() {
            const data = await getProducts();
            setProducts(data);
            setLoading(false);

            if (data.length > 0) {
                for (const product of data) {
                    supabase.from('products')
                        .update({ views: (product.views || 0) + 1 })
                        .eq('id', product.id)
                        .then();
                }
            }
        }
        loadProducts();
    }, []);

    const handleInterest = (product: Product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);

        // Disparar evento do Meta Pixel se disponível
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

    const getGradient = (category: string) => {
        switch (category) {
            case 'kit': return "from-blue-600 to-cyan-500";
            case 'smartphone': return "from-purple-600 to-pink-500";
            case 'notebook': return "from-orange-500 to-red-500";
            default: return "from-gray-500 to-slate-700";
        }
    };

    const formatSpecs = (specs: any) => {
        if (!specs) return "";
        if (typeof specs === 'string') return specs;
        return Object.values(specs).join(" + ");
    };

    return (
        <section id="kits" className="py-12 md:py-24">
            <LeadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                interestType="venda"
                customDescription={selectedProduct ? `Interesse no Produto: ${selectedProduct.name} (R$ ${selectedProduct.price.toLocaleString('pt-BR')})` : undefined}
                whatsappMessage={selectedProduct ? `Olá Iago, tenho interesse no *${selectedProduct.name}* que vi no site por *R$ ${selectedProduct.price.toLocaleString('pt-BR')}*. Pode me ajudar?` : undefined}
            />

            {/* Gallery Modal */}
            <AnimatePresence>
                {selectedGallery && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
                        onClick={() => setSelectedGallery(null)}
                    >
                        <button
                            className="absolute top-6 right-6 text-white/50 hover:text-white z-50 p-2 glass rounded-full"
                            onClick={() => setSelectedGallery(null)}
                        >
                            <X size={24} />
                        </button>

                        {selectedGallery.images.length > 1 && (
                            <>
                                <button
                                    className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 text-white/50 hover:text-white z-50 p-3 glass rounded-full transition-all"
                                    onClick={prevImage}
                                >
                                    <ChevronLeft size={32} />
                                </button>
                                <button
                                    className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 text-white/50 hover:text-white z-50 p-3 glass rounded-full transition-all"
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
                                alt="Gallery Insight"
                                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10"
                            />

                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-2 pb-6">
                                {selectedGallery.images.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-2 h-2 rounded-full transition-all ${i === selectedGallery.index ? 'bg-blue-500 w-6' : 'bg-white/20'}`}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="container mx-auto px-4">
                <div className="text-center mb-8 md:mb-16">
                    <h2 className="text-3xl md:text-4xl font-black mb-3 md:mb-4 tracking-tighter uppercase italic">
                        SHOWROOM <span className="text-blue-500 italic">DINÂMICO</span>
                    </h2>
                    <p className="text-sm md:text-base text-white/40 max-w-xl mx-auto">Produtos e setups disponíveis em tempo real diretamente do nosso estoque.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-blue-500" size={48} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                        {products.map((product) => (
                            <div key={product.id} className="group relative glass rounded-3xl overflow-hidden border-white/5 card-hover flex flex-col h-full">
                                {product.image_urls && product.image_urls.length > 0 ? (
                                    <div
                                        className="relative w-full h-40 md:h-56 bg-black/50 overflow-hidden cursor-zoom-in"
                                        onClick={() => setSelectedGallery({ images: product.image_urls || [], index: 0 })}
                                    >
                                        <img
                                            src={product.image_urls[0]}
                                            alt={product.name}
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="bg-blue-600/20 backdrop-blur-md border border-blue-500/30 p-2 md:p-3 rounded-full text-blue-400">
                                                <Eye size={20} className="w-4 h-4 md:w-5 md:h-5" />
                                            </div>
                                        </div>
                                        {product.image_urls.length > 1 && (
                                            <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3 bg-black/80 backdrop-blur-md px-1.5 py-0.5 md:px-2 md:py-1 rounded text-[8px] md:text-[10px] uppercase font-bold text-white/80 border border-white/10 shadow-lg">
                                                + {product.image_urls.length - 1} FOTOS
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className={`h-2 md:h-3 w-full bg-gradient-to-r ${getGradient(product.category)}`} />
                                )}
                                <div className="p-4 md:p-8 flex-1 flex flex-col">
                                    <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4">
                                        <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 px-1.5 py-0.5 md:px-2 rounded">
                                            {product.category}
                                        </span>
                                        {product.stock_quantity > 0 ? (
                                            <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest bg-green-500/20 text-green-400 border border-green-500/20 px-1.5 py-0.5 md:px-2 rounded">
                                                Em Estoque
                                            </span>
                                        ) : (
                                            <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest bg-red-500/20 text-red-400 border border-red-500/20 px-1.5 py-0.5 md:px-2 rounded">
                                                Esgotado
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-black mb-1.5 md:mb-2 leading-tight">{product.name}</h3>
                                    <p className="text-xs md:text-sm text-white/50 mb-4 md:mb-6 flex items-center gap-1.5 md:gap-2 line-clamp-2 md:line-clamp-none">
                                        <Cpu size={12} className="md:w-[14px] md:h-[14px] text-blue-400 flex-shrink-0" />
                                        <span className="truncate md:whitespace-normal">{formatSpecs(product.specs)}</span>
                                    </p>
                                    <div className="mt-auto pt-4 flex flex-col gap-3">
                                        <div className="text-xl md:text-2xl font-black text-white">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => handleInterest(product)}
                                                className="bg-white/5 text-white/70 px-2 py-2 md:py-2.5 rounded-xl font-bold text-[10px] md:text-xs uppercase hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-1.5 border border-white/10"
                                            >
                                                <Smartphone className="w-3 h-3 md:w-4 md:h-4" />
                                                <span className="hidden sm:inline">RETIRAR LOJA</span>
                                                <span className="sm:hidden">LOJA</span>
                                            </button>
                                            <button
                                                onClick={() => addToCart(product)}
                                                className="bg-blue-600 text-white px-2 py-2 md:py-2.5 rounded-xl font-bold text-[10px] md:text-xs uppercase hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20"
                                            >
                                                <ShoppingBag className="w-3 h-3 md:w-4 md:h-4" />
                                                <span className="hidden sm:inline">ENVIAR FRETE</span>
                                                <span className="sm:hidden">FRETE</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && products.length === 0 && (
                    <p className="text-center text-white/20 italic">Nenhum produto cadastrado no momento.</p>
                )}
            </div>
        </section>
    );
}
