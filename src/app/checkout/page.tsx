"use client";

import { useCart } from '@/contexts/CartContext';
import { useState, useEffect } from 'react';
import { 
    ChevronRight, 
    ShieldCheck, 
    Truck, 
    Store, 
    CreditCard, 
    QrCode, 
    Smartphone, 
    Loader2, 
    CheckCircle2, 
    Copy, 
    ArrowRight,
    ShoppingBag,
    Package
} from 'lucide-react';
import Header from '@/components/Header';
import { createOrder } from '@/lib/orders';
import { getProducts } from '@/lib/products';
import { saveCheckoutLead } from '@/lib/leads';
import { motion, AnimatePresence } from 'framer-motion';

export default function CheckoutPage() {
    const { items, totalPrice, clearCart, isLoaded, addToCart } = useCart();
    const [cep, setCep] = useState('');
    const [shippingCost, setShippingCost] = useState<number | null>(null);
    const [calculatingShipping, setCalculatingShipping] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix' | 'pay_at_store'>('credit_card');
    const [deliveryType, setDeliveryType] = useState<'delivery' | 'store'>('delivery');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [clientName, setClientName] = useState('');
    const [clientWhatsapp, setClientWhatsapp] = useState('');
    const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
    const [copiedPix, setCopiedPix] = useState(false);

    useEffect(() => {
        if (!isLoaded) return;

        const handleMagicLink = async () => {
            const params = new URLSearchParams(window.location.search);
            const buyNãowId = params.get('buy_nãow');
            const qty = parseInt(params.get('qty') || '1', 10);

            if (buyNãowId) {
                const products = await getProducts();
                const targetProduct = products.find(p => p.id === buyNãowId);

                if (targetProduct) {
                    clearCart();
                    addToCart(targetProduct, qty);
                    window.history.replaceState(null, '', '/checkout');
                }
            } else if (items.length === 0 && !isSuccess) {
                window.location.href = '/';
            }
        };

        handleMagicLink();

        if (items.length > 0 && typeof window !== 'undefined' && (window as any).fbq) {
            (window as any).fbq('track', 'InitiateCheckout', {
                num_items: items.length,
                value: totalPrice,
                currency: 'BRL'
            });
        }
    }, [isLoaded, items.length, isSuccess, clearCart, addToCart, totalPrice]);

    useEffect(() => {
        if (deliveryType === 'store') {
            setShippingCost(0);
            setPaymentMethod('pay_at_store');
        } else {
            setShippingCost(null);
            setPaymentMethod('credit_card');
        }
    }, [deliveryType]);

    useEffect(() => {
        if (clientName.length > 3 && clientWhatsapp.length > 10 && !isSuccess) {
            const timer = setTimeout(() => {
                saveCheckoutLead(clientName, clientWhatsapp, items);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [clientName, clientWhatsapp, items, isSuccess]);

    const handleCalculateShipping = async () => {
        if (cep.length < 8) return;
        setCalculatingShipping(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setShippingCost(Math.random() * 50 + 20);
        setCalculatingShipping(false);
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientName || !clientWhatsapp) {
            alert('Preencha seu nome e WhatsApp de contato.');
            return;
        }
        if (deliveryType === 'delivery' && !shippingCost) {
            alert('Por favor, calcule o frete para entrega em casa.');
            return;
        }

        setIsProcessing(true);
        const totalOrderValue = totalPrice + (shippingCost || 0);
        const finalTotal = paymentMethod === 'pix' ? totalOrderValue * 0.95 : totalOrderValue;

        const orderId = await createOrder({
            client_name: clientName,
            client_whatsapp: clientWhatsapp,
            delivery_type: deliveryType,
            delivery_address: deliveryType === 'delivery' ? `CEP ${cep}` : 'Retirada na Loja Física',
            shipping_cost: shippingCost || 0,
            subtotal: totalPrice,
            total: finalTotal,
            payment_method: paymentMethod
        }, items);

        if (!orderId) {
            alert('Falha ao registrar pedido não banco de dados.');
            setIsProcessing(false);
            return;
        }

        try {
            await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    paymentMethod,
                    clientData: {
                        name: clientName,
                        whatsapp: clientWhatsapp,
                        cep: cep,
                        address: deliveryType === 'delivery' ? `CEP ${cep}` : 'Retirada na Loja'
                    },
                    items
                })
            });
        } catch (error) {
            console.error('[Checkout] Erro ao chamar API de Checkout:', error);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

        if (orderId) {
            setCreatedOrderId(orderId);
            setIsSuccess(true);
            clearCart();

            if (typeof window !== 'undefined' && (window as any).fbq) {
                (window as any).fbq('track', 'Purchase', {
                    value: finalTotal,
                    currency: 'BRL',
                    content_ids: items.map(i => i.product.id),
                    content_type: 'product'
                });
            }
        } else {
            alert('Falha ao processar pedido. Tente nãovamente mais tarde.');
        }

        setIsProcessing(false);
    };

    const totalOrderValue = totalPrice + (shippingCost || 0);

    if (!isLoaded) {
        return (
            <main className="min-h-screen bg-[#F0EFED] flex items-center justify-center">
                <Loader2 size={48} className="animate-spin text-[#1A1A1A]" />
            </main>
        );
    }

    if (isSuccess) {
        const mockPixCode = `00020126440014br.gov.bcb.pix0122cybertech@braganca.com5204000053039865406${(totalOrderValue * 0.95).toFixed(2).replace('.', '')}5802BR5910Cyber Informática6008BRAGANCA62070503***6304${createdOrderId?.slice(0, 4).toUpperCase() || 'ABCD'}`;

        return (
            <main className="min-h-screen bg-[#F0EFED] pt-32 pb-12 flex items-center justify-center">
                <Header />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-xl w-full mx-auto p-12 bg-white rounded-[2px] border border-[#D4D2CF] text-center shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-[#1A1A1A]" />
                    <div className="flex justify-center mb-8">
                        <div className="bg-[#F8F7F5] p-6 rounded-[2px] text-[#1A1A1A] border border-[#ECEAE6]">
                            <CheckCircle2 size={64} />
                        </div>
                    </div>
                    
                    <h2 className="text-4xl font-display font-bold text-[#1A1A1A] mb-4 uppercase tracking-tight">PEDIDO RECEBIDO!</h2>
                    <p className="text-[#888888] font-bold text-[10px] uppercase tracking-widest mb-10 max-w-sm mx-auto">
                        Seu pedido foi registrado com o código <span className="text-[#1A1A1A]">#{createdOrderId?.slice(0, 8).toUpperCase()}</span>.
                    </p>

                    {paymentMethod === 'pix' && (
                        <div className="bg-[#F8F7F5] border border-dashed border-[#D4D2CF] p-8 mb-10 text-left">
                            <h4 className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest mb-4">Pague com Pix Copia e Cola:</h4>
                            <div className="bg-white p-4 border border-[#ECEAE6] rounded-[2px] flex items-center gap-3 overflow-hidden group">
                                <span className="text-xs font-mono text-[#555555] truncate flex-1">{mockPixCode}</span>
                                <button 
                                    onClick={() => { navigator.clipboard.writeText(mockPixCode); setCopiedPix(true); setTimeout(() => setCopiedPix(false), 2000); }}
                                    className="text-[#AAAAAA] hover:text-[#1A1A1A] transition-colors p-2"
                                >
                                    {copiedPix ? <CheckCircle2 size={18} className="text-green-600" /> : <Copy size={18} />}
                                </button>
                            </div>
                            <p className="text-[9px] text-[#AAAAAA] mt-4 font-bold uppercase tracking-widest">
                                O status será atualizado automaticamente após o pagamento.
                            </p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <a href={`/rastreio?id=${createdOrderId}`} className="btn-primary w-full py-5 flex items-center justify-center gap-3">
                            ACOMPANHAR PEDIDO <ArrowRight size={18} />
                        </a>
                        <a href="/" className="btn-ghost w-full py-5">VOLTAR PARA A HOME</a>
                    </div>
                </motion.div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#F0EFED] pt-32 pb-24">
            <Header />
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="flex items-center gap-3 text-[#AAAAAA] text-[10px] font-bold uppercase tracking-widest mb-12">
                    <a href="/" className="hover:text-[#1A1A1A]">HOME</a>
                    <ChevronRight size={12} />
                    <span className="text-[#1A1A1A]">CHECKOUT SEGURO</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-7 space-y-12">
                        {/* Seção 1: Entrega */}
                        <div className="bg-white p-10 rounded-[2px] border border-[#D4D2CF] shadow-xl">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-10 h-10 bg-[#1A1A1A] text-white flex items-center justify-center rounded-[2px] font-display text-xl">1</div>
                                <h2 className="text-2xl font-display font-bold text-[#1A1A1A] uppercase tracking-tight">OPÇÕES DE ENTREGA</h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                <button 
                                    onClick={() => setDeliveryType('delivery')}
                                    className={`flex items-center gap-6 p-6 rounded-[2px] border transition-all text-left ${deliveryType === 'delivery' ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' : 'bg-[#F8F7F5] border-[#ECEAE6] text-[#555555] hover:border-[#1A1A1A]'}`}
                                >
                                    <Truck size={32} className={deliveryType === 'delivery' ? 'text-white' : 'text-[#AAAAAA]'} />
                                    <div>
                                        <div className="font-display font-bold uppercase tracking-tight text-sm">Receber em Casa</div>
                                        <div className="text-[10px] opacity-60 font-bold uppercase tracking-widest mt-1">Via Motoboy ou Correios</div>
                                    </div>
                                </button>
                                <button 
                                    onClick={() => setDeliveryType('store')}
                                    className={`flex items-center gap-6 p-6 rounded-[2px] border transition-all text-left ${deliveryType === 'store' ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' : 'bg-[#F8F7F5] border-[#ECEAE6] text-[#555555] hover:border-[#1A1A1A]'}`}
                                >
                                    <Store size={32} className={deliveryType === 'store' ? 'text-white' : 'text-[#AAAAAA]'} />
                                    <div>
                                        <div className="font-display font-bold uppercase tracking-tight text-sm">Retirar na Loja</div>
                                        <div className="text-[10px] opacity-60 font-bold uppercase tracking-widest mt-1">Grátis - Bragança Pta</div>
                                    </div>
                                </button>
                            </div>

                            {deliveryType === 'delivery' && (
                                <div className="p-6 bg-[#F8F7F5] border border-[#ECEAE6] rounded-[2px]">
                                    <label className="block text-[10px] font-bold text-[#AAAAAA] uppercase tracking-widest mb-4">CALCULAR FRETE (CEP):</label>
                                    <div className="flex gap-4">
                                        <input 
                                            type="text" 
                                            value={cep}
                                            onChange={(e) => setCep(e.target.value)}
                                            placeholder="00000-000"
                                            className="flex-1 bg-white border border-[#D4D2CF] rounded-[2px] px-6 py-4 text-[#1A1A1A] font-display font-bold focus:outline-none focus:border-[#1A1A1A]" 
                                        />
                                        <button 
                                            onClick={handleCalculateShipping}
                                            disabled={calculatingShipping || cep.length < 8}
                                            className="btn-primary px-8"
                                        >
                                            {calculatingShipping ? <Loader2 className="animate-spin" /> : 'CALCULAR'}
                                        </button>
                                    </div>
                                    {shippingCost !== null && shippingCost > 0 && (
                                        <div className="mt-6 p-4 bg-white border border-[#ECEAE6] flex justify-between items-center text-sm font-bold text-[#1A1A1A] uppercase tracking-widest">
                                            <span>Frete Estimado:</span>
                                            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(shippingCost)}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Seção 2: Seus Dados */}
                        <div className="bg-white p-10 rounded-[2px] border border-[#D4D2CF] shadow-xl">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-10 h-10 bg-[#1A1A1A] text-white flex items-center justify-center rounded-[2px] font-display text-xl">2</div>
                                <h2 className="text-2xl font-display font-bold text-[#1A1A1A] uppercase tracking-tight">DADOS PESSOAIS</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-[#AAAAAA] uppercase tracking-widest mb-3">nome Completo</label>
                                    <input 
                                        required 
                                        type="text" 
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        placeholder="EX: JOÃO SILVA" 
                                        className="w-full bg-[#F8F7F5] border border-[#ECEAE6] rounded-[2px] px-6 py-4 text-[#1A1A1A] font-display font-bold focus:outline-none focus:border-[#1A1A1A]" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-[#AAAAAA] uppercase tracking-widest mb-3">WhatsApp de Contato</label>
                                    <input 
                                        required 
                                        type="tel" 
                                        value={clientWhatsapp}
                                        onChange={(e) => setClientWhatsapp(e.target.value)}
                                        placeholder="(11) 99999-9999" 
                                        className="w-full bg-[#F8F7F5] border border-[#ECEAE6] rounded-[2px] px-6 py-4 text-[#1A1A1A] font-display font-bold focus:outline-none focus:border-[#1A1A1A]" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Seção 3: Pagamento */}
                        <div className={`bg-white p-10 rounded-[2px] border shadow-xl transition-all ${(deliveryType === 'delivery' && !shippingCost) || !clientName || !clientWhatsapp ? 'border-[#ECEAE6] opacity-40 pointer-events-none' : 'border-[#D4D2CF]'}`}>
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-10 h-10 bg-[#1A1A1A] text-white flex items-center justify-center rounded-[2px] font-display text-xl">3</div>
                                <h2 className="text-2xl font-display font-bold text-[#1A1A1A] uppercase tracking-tight">MÉTODO DE PAGAMENTO</h2>
                            </div>

                            <form onSubmit={handlePayment}>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-12">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('credit_card')}
                                        className={`flex flex-col items-center justify-center gap-4 p-6 rounded-[2px] border transition-all ${paymentMethod === 'credit_card' ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' : 'bg-[#F8F7F5] border-[#ECEAE6] text-[#555555] hover:border-[#1A1A1A]'}`}
                                    >
                                        <CreditCard size={24} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Cartão Online</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('pix')}
                                        className={`flex flex-col items-center justify-center gap-4 p-6 rounded-[2px] border transition-all ${paymentMethod === 'pix' ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' : 'bg-[#F8F7F5] border-[#ECEAE6] text-[#555555] hover:border-[#1A1A1A]'}`}
                                    >
                                        <QrCode size={24} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Pix (5% OFF)</span>
                                    </button>
                                    {deliveryType === 'store' && (
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('pay_at_store')}
                                            className={`flex flex-col items-center justify-center gap-4 p-6 rounded-[2px] border transition-all ${paymentMethod === 'pay_at_store' ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' : 'bg-[#F8F7F5] border-[#ECEAE6] text-[#555555] hover:border-[#1A1A1A]'}`}
                                        >
                                            <Smartphone size={24} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Pagar na Loja</span>
                                        </button>
                                    )}
                                </div>

                                {paymentMethod === 'credit_card' && (
                                    <div className="space-y-6 mb-12 p-8 bg-[#F8F7F5] border border-[#ECEAE6] rounded-[2px]">
                                        <input required type="text" placeholder="NÚMERO DO CARTÃO" className="w-full bg-white border border-[#D4D2CF] rounded-[2px] px-6 py-4 text-[#1A1A1A] font-display font-medium focus:outline-none focus:border-[#1A1A1A]" />
                                        <div className="grid grid-cols-2 gap-6">
                                            <input required type="text" placeholder="MM/AA" className="w-full bg-white border border-[#D4D2CF] rounded-[2px] px-6 py-4 text-[#1A1A1A] font-display font-medium focus:outline-none focus:border-[#1A1A1A]" />
                                            <input required type="text" placeholder="CVV" className="w-full bg-white border border-[#D4D2CF] rounded-[2px] px-6 py-4 text-[#1A1A1A] font-display font-medium focus:outline-none focus:border-[#1A1A1A]" />
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isProcessing}
                                    className="btn-primary w-full py-6 text-xl flex items-center justify-center gap-4 disabled:opacity-50"
                                >
                                    {isProcessing ? <Loader2 size={24} className="animate-spin" /> : <><ShieldCheck size={24} /> {paymentMethod === 'pay_at_store' ? 'RESERVAR PRODUTO' : 'FINALIZAR E PAGAR'}</>}
                                </button>
                                <p className="text-center text-[10px] text-[#AAAAAA] mt-6 font-bold uppercase tracking-[0.2em]">Pagamento Seguro & Criptografado</p>
                            </form>
                        </div>
                    </div>

                    {/* Resumo lateral */}
                    <div className="lg:col-span-5 h-fit sticky top-32 bg-white p-10 rounded-[2px] border border-[#D4D2CF] shadow-2xl overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-[#1A1A1A]" />
                        <h2 className="text-2xl font-display font-bold text-[#1A1A1A] mb-10 uppercase tracking-tight">RESUMO DO PEDIDO</h2>
                        <div className="space-y-8 mb-10">
                            {items.map((item) => (
                                <div key={item.product.id} className="flex gap-6 items-start">
                                    <div className="w-12 h-12 bg-[#F8F7F5] border border-[#ECEAE6] rounded-[2px] flex items-center justify-center text-[#1A1A1A] shrink-0">
                                        <Package size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-display font-bold text-xs text-[#1A1A1A] leading-tight uppercase">{item.product.name}</h4>
                                        <div className="text-[10px] text-[#AAAAAA] font-bold uppercase tracking-widest mt-2">{item.quantity} UNIDADE(S)</div>
                                    </div>
                                    <div className="font-display font-bold text-[#1A1A1A]">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.product.price * item.quantity)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-10 border-t border-[#ECEAE6] space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-bold text-[#888888] uppercase tracking-widest">
                                <span>Subtotal</span>
                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-bold text-[#888888] uppercase tracking-widest">
                                <span>Frete Estimado</span>
                                <span>{shippingCost !== null ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(shippingCost) : '--'}</span>
                            </div>
                            {paymentMethod === 'pix' && (
                                <div className="flex justify-between items-center text-[10px] font-bold text-green-600 uppercase tracking-widest">
                                    <span>Desconto Pix (5%)</span>
                                    <span>-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalOrderValue * 0.05)}</span>
                                </div>
                            )}
                            <div className="pt-6 mt-6 border-t border-[#ECEAE6] flex justify-between items-end">
                                <span className="font-display font-bold uppercase tracking-tight text-[#AAAAAA]">TOTAL FINAL</span>
                                <span className="text-4xl font-display font-bold text-[#1A1A1A]">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(paymentMethod === 'pix' ? totalOrderValue * 0.95 : totalOrderValue)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
