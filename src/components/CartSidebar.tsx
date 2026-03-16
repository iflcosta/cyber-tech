"use client";
import { useCart } from '@/contexts/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, ShoppingBag, CreditCard } from 'lucide-react';

export default function CartSidebar() {
    const { isCartOpen, setIsCartOpen, items, removeFromCart, updateQuantity, totalPrice } = useCart();

    const handleCheckout = () => {
        // Futura navegação para a página real de Checkout
        setIsCartOpen(false);
        window.location.href = '/checkout';
    };

    return (
        <AnimatePresence>
            {isCartOpen && (
                <>
                    {/* Overlay Escuro */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsCartOpen(false)}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
                    />

                    {/* Painel do Carrinho (Sidebar) */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full sm:w-[400px] bg-[#050505] shadow-[-20px_0_40px_rgba(0,0,0,0.8)] border-l border-white/5 z-[210] flex flex-col"
                    >
                        {/* Header do Carrinho */}
                        <div className="flex justify-between items-center p-6 border-b border-white/10">
                            <h2 className="text-xl font-black italic flex items-center gap-3">
                                <ShoppingBag className="text-blue-500" />
                                SEU <span className="text-blue-500">CARRINHO</span>
                            </h2>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="w-10 h-10 bg-white/5 rounded-full flex justify-center items-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Lista de Itens */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-4">
                                    <ShoppingBag size={48} className="opacity-20" />
                                    <p className="font-bold">Seu carrinho está vazio.</p>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <div key={item.product.id} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5 relative group">
                                        {/* Imagem do Produto */}
                                        <div className="w-20 h-20 rounded-lg bg-black/50 overflow-hidden flex-shrink-0">
                                            {item.product.image_urls && item.product.image_urls.length > 0 ? (
                                                <img src={item.product.image_urls[0]} alt={item.product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-blue-900/20" />
                                            )}
                                        </div>

                                        {/* Detalhes do Produto */}
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <h3 className="font-bold text-sm line-clamp-2 leading-tight pr-6">{item.product.name}</h3>
                                                <div className="text-xs text-white/40 mt-1 uppercase tracking-wider">{item.product.category}</div>
                                            </div>

                                            <div className="flex items-center justify-between mt-2">
                                                <div className="font-black text-blue-400">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.product.price)}
                                                </div>

                                                {/* Controles de Quantidade */}
                                                <div className="flex items-center gap-3 bg-black/50 rounded-lg border border-white/10 px-2 py-1">
                                                    <button
                                                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                        className="text-white/50 hover:text-white transition-colors"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                        className="text-white/50 hover:text-white transition-colors"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Botão de Remover Lixeira */}
                                        <button
                                            onClick={() => removeFromCart(item.product.id)}
                                            className="absolute top-3 right-3 text-white/20 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer (Resumo e Botão Checkout) */}
                        {items.length > 0 && (
                            <div className="p-6 border-t border-white/10 bg-[#0a0a0a]">
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-white/50 font-bold uppercase tracking-wider text-sm">Subtotal</span>
                                    <span className="text-2xl font-black text-white">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice)}
                                    </span>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                                >
                                    <CreditCard size={20} />
                                    FINALIZAR COMPRA
                                </button>

                                <button
                                    onClick={() => setIsCartOpen(false)}
                                    className="w-full mt-3 text-white/50 font-bold text-sm py-2 hover:text-white transition-colors"
                                >
                                    Continuar Comprando
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
