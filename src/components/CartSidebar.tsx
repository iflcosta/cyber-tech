"use client";
import { useCart } from '@/contexts/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, ShoppingBag, CreditCard, Package } from 'lucide-react';
import { brand } from '@/lib/brand';

export default function CartSidebar() {
    const { isCartOpen, setIsCartOpen, items, removeFromCart, updateQuantity, totalPrice } = useCart();

    const handleCheckout = () => {
        setIsCartOpen(false);
        const orderDetails = items.map(item => `${item.quantity}x ${item.product.name}`).join('\n');
        const totalFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice);
        
        const message = `Olá! Tenho interesse nos seguintes produtos:\n\n${orderDetails}\n\n*Total Estimado: ${totalFormatted}*`;
        window.open(`https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
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
                        className="fixed right-0 top-0 h-full w-full sm:w-[400px] bg-[#FFFFFF] shadow-[-20px_0_40px_rgba(31,31,31,0.1)] border-l border-[#D4D2CF] z-[210] flex flex-col"
                    >
                        {/* Header do Carrinho */}
                        <div className="flex justify-between items-center p-6 border-b border-[#ECEAE6]">
                            <h2 className="text-xl font-display font-bold tracking-tight text-[#1A1A1A] uppercase">
                                SEU <span className="text-outline">CARRINHO</span>
                            </h2>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="w-10 h-10 bg-[#F8F7F5] border border-[#ECEAE6] rounded-[2px] flex justify-center items-center text-[#AAAAAA] hover:text-[#1A1A1A] hover:border-[#1A1A1A] transition-all"
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
                                    <div key={item.product.id} className="flex gap-4 p-4 rounded-[2px] bg-white border border-[#ECEAE6] relative group transition-all hover:border-[#D4D2CF]">
                                        {/* Imagem do Produto */}
                                        <div className="w-20 h-20 rounded-[2px] bg-[#F8F7F5] overflow-hidden flex-shrink-0 border border-[#ECEAE6]">
                                            {item.product.image_urls && item.product.image_urls.length > 0 ? (
                                                <img src={item.product.image_urls[0]} alt={item.product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="text-[#D4D2CF]" size={24} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Detalhes do Produto */}
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <h3 className="font-display font-bold text-xs uppercase tracking-tight text-[#1A1A1A] line-clamp-2 leading-tight pr-6">{item.product.name}</h3>
                                                <div className="text-[10px] text-[#888888] mt-1 font-bold uppercase tracking-widest">{item.product.category}</div>
                                            </div>

                                            <div className="flex items-center justify-between mt-2">
                                                <div className="font-display font-bold text-[#1A1A1A]">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.product.price)}
                                                </div>

                                                {/* Controles de Quantidade */}
                                                <div className="flex items-center gap-3 bg-[#F8F7F5] rounded-[2px] border border-[#ECEAE6] px-2 py-1">
                                                    <button
                                                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                        className="text-[#AAAAAA] hover:text-[#1A1A1A] transition-colors"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="text-[10px] font-bold w-4 text-center text-[#1A1A1A]">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                        className="text-[#AAAAAA] hover:text-[#1A1A1A] transition-colors"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Botão de Remover Lixeira */}
                                        <button
                                            onClick={() => removeFromCart(item.product.id)}
                                            className="absolute top-3 right-3 text-[#CCCCCC] hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer (Resumo e Botão Checkout) */}
                        {items.length > 0 && (
                            <div className="p-8 border-t border-[#ECEAE6] bg-[#F8F7F5]">
                                <div className="flex justify-between items-center mb-8">
                                    <span className="text-[#888888] font-bold uppercase tracking-[0.2em] text-[10px]">Total Estimado</span>
                                    <span className="text-3xl font-display font-bold text-[#1A1A1A]">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice)}
                                    </span>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    className="w-full btn-primary py-5 flex items-center justify-center gap-3"
                                >
                                    <CreditCard size={20} />
                                    FINALIZAR SOLICITAÇÃO
                                </button>

                                <button
                                    onClick={() => setIsCartOpen(false)}
                                    className="w-full mt-4 text-[#AAAAAA] font-bold text-[10px] uppercase tracking-widest py-2 hover:text-[#1A1A1A] transition-colors"
                                >
                                    Continuar Navegando
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
