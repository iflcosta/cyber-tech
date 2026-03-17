"use client";
import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { CreditCard, Truck, ShieldCheck, MapPin, QrCode, Lock, ChevronLeft, Loader2, CheckCircle2, Copy, Smartphone } from 'lucide-react';
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

    // Redireciona para home se o carrinho estiver vazio ou processa o Magic Link (Google Ads)
    useEffect(() => {
        if (!isLoaded) return;

        const handleMagicLink = async () => {
            const params = new URLSearchParams(window.location.search);
            const buyNowId = params.get('buy_now');
            const qty = parseInt(params.get('qty') || '1', 10);

            if (buyNowId) {
                const products = await getProducts();
                const targetProduct = products.find(p => p.id === buyNowId);

                if (targetProduct) {
                    clearCart();
                    addToCart(targetProduct, qty);
                    // Limpa a URL para evitar loops ao atualizar a página
                    window.history.replaceState(null, '', '/checkout');
                }
            } else if (items.length === 0 && !isSuccess) {
                window.location.href = '/';
            }
        };

        handleMagicLink();

        // Track InitiateCheckout
        if (items.length > 0 && typeof window !== 'undefined' && (window as any).fbq) {
            (window as any).fbq('track', 'InitiateCheckout', {
                num_items: items.length,
                value: totalPrice,
                currency: 'BRL'
            });
        }
    }, [isLoaded, items.length, isSuccess, clearCart, addToCart, totalPrice]);

    // Ao mudar para retirada na loja, limpa frete e seta pagamento para loja por padrão
    useEffect(() => {
        if (deliveryType === 'store') {
            setShippingCost(0);
            setPaymentMethod('pay_at_store');
        } else {
            setShippingCost(null);
            setPaymentMethod('credit_card');
        }
    }, [deliveryType]);

    // Captura de Lead (Abandono de Carrinho)
    useEffect(() => {
        if (clientName.length > 3 && clientWhatsapp.length > 10 && !isSuccess) {
            const timer = setTimeout(() => {
                saveCheckoutLead(clientName, clientWhatsapp, items);
            }, 2000); // 2 segundos de debounce para não sobrecarregar o banco
            return () => clearTimeout(timer);
        }
    }, [clientName, clientWhatsapp, items, isSuccess]);

    const handleCalculateShipping = async () => {
        if (cep.length < 8) return;
        setCalculatingShipping(true);
        // Simulação de chamada na API dos Correios/Melhor Envio
        await new Promise(resolve => setTimeout(resolve, 1500));
        setShippingCost(Math.random() * 50 + 20); // Frete fictício entre R$ 20 e R$ 70
        setCalculatingShipping(false);
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!clientName || !clientWhatsapp) {
            alert('Preencha seu Nome e WhatsApp de contato.');
            return;
        }

        if (deliveryType === 'delivery' && !shippingCost) {
            alert('Por favor, calcule o frete para entrega em casa.');
            return;
        }

        setIsProcessing(true);

        const totalOrderValue = totalPrice + (shippingCost || 0);
        const finalTotal = paymentMethod === 'pix' ? totalOrderValue * 0.95 : totalOrderValue;

        // 1. Salvar no Supabase
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
            alert('Falha ao registrar pedido no banco de dados.');
            setIsProcessing(false);
            return;
        }

        // 2. Integrar com Olist ERP via API Interna
        try {
            const apiResponse = await fetch('/api/checkout', {
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

            const apiResult = await apiResponse.json();
            if (!apiResult.success) {
                console.warn('[Checkout] Erro na integração Olist:', apiResult.error);
            }
        } catch (error) {
            console.error('[Checkout] Erro ao chamar API de Checkout:', error);
        }

        // 3. Simular delay do Gateway (Olist Pay / PagSeguro / MercadoPago)
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (orderId) {
            setCreatedOrderId(orderId);
            setIsSuccess(true);
            clearCart();

            // Track Purchase
            if (typeof window !== 'undefined' && (window as any).fbq) {
                (window as any).fbq('track', 'Purchase', {
                    value: finalTotal,
                    currency: 'BRL',
                    content_ids: items.map(i => i.product.id),
                    content_type: 'product'
                });
            }
        } else {
            alert('Falha ao processar pedido. Tente novamente mais tarde.');
        }

        setIsProcessing(false);
    };

    const totalOrderValue = totalPrice + (shippingCost || 0);

    if (!isLoaded) {
        return (
            <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
                <Loader2 size={48} className="animate-spin text-blue-500" />
            </main>
        );
    }

    if (isSuccess) {
        // Gerador de Pix Fictício Baseado no UID do Pedido
        const mockPixCode = `00020126440014br.gov.bcb.pix0122cybertech@braganca.com5204000053039865406${(totalOrderValue * 0.95).toFixed(2).replace('.', '')}5802BR5910CYBER TECH6008BRAGANCA62070503***6304${createdOrderId?.slice(0, 4).toUpperCase() || 'ABCD'}`;

        return (
            <main className="min-h-screen bg-black text-white pt-24 pb-12 flex items-center justify-center">
                <Header />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full mx-auto p-8 rounded-3xl border border-blue-500/20 bg-blue-500/5 text-center shadow-[0_0_50px_rgba(37,99,235,0.1)]"
                >
                    {paymentMethod === 'pay_at_store' ? (
                        <>
                            <div className="flex justify-center mb-6">
                                <div className="bg-purple-500/20 text-purple-500 p-4 rounded-full border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                                    <MapPin size={48} />
                                </div>
                            </div>
                            <h2 className="text-2xl font-black italic mb-2 uppercase">PEDIDO <span className="text-purple-500">RESERVADO!</span></h2>
                            <p className="text-white/60 mb-6 text-sm">
                                Pedido #{createdOrderId?.slice(0, 8)} gerado! Mostre este número no balcão da Cyber Tech em Bragança Paulista para retirar seu produto e realizar o pagamento.
                            </p>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
                                <p className="text-xs text-white/40 mb-1 font-bold uppercase tracking-widest text-left">Onde Retirar:</p>
                                <p className="text-sm font-bold text-left italic">Rua da Tecnologia, 123 - Centro<br/>Bragança Paulista - SP</p>
                                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                                    <span className="text-xs text-white/40">Total Original:</span>
                                    <span className="font-bold text-white text-lg">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalOrderValue)}</span>
                                </div>
                            </div>
                        </>
                    ) : paymentMethod === 'pix' ? (
                        <>
                            <div className="flex justify-center mb-6">
                                <div className="bg-blue-500/20 text-blue-500 p-4 rounded-full border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                                    <QrCode size={48} />
                                </div>
                            </div>
                            <h2 className="text-2xl font-black italic mb-2">PAGAMENTO <span className="text-blue-500">PIX</span></h2>
                            <p className="text-white/60 mb-6 text-sm">
                                Pedido #{createdOrderId?.slice(0, 8)} gerado! Escaneie o QR Code ou cole o código Pix Copia e Cola em seu banco para garantir o pedido.
                            </p>

                            <div className="bg-white/5 border border-dashed border-white/20 rounded-2xl p-6 mb-8 relative group overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
                                <div className="text-xs break-all font-mono text-white/80 mb-4">{mockPixCode}</div>
                                <button
                                    onClick={() => navigator.clipboard.writeText(mockPixCode)}
                                    className="inline-flex py-3 px-6 bg-blue-600 hover:bg-blue-700 rounded-full font-bold uppercase items-center justify-center gap-2 text-xs text-white transition-all w-full"
                                >
                                    <Copy size={16} /> Copiar Linha Digitável
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex justify-center mb-6">
                                <div className="bg-green-500/20 text-green-500 p-4 rounded-full border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                                    <CheckCircle2 size={48} />
                                </div>
                            </div>
                            <h2 className="text-2xl font-black italic mb-2 text-green-500 uppercase">PAGAMENTO APROVADO!</h2>
                            <p className="text-white/60 mb-8 text-sm">
                                Pedido #{createdOrderId?.slice(0, 8)} processado com sucesso via Cartão de Crédito Online. Você receberá as atualizações em breve.
                            </p>
                        </>
                    )}

                    <button
                        onClick={() => window.location.href = '/'}
                        className="bg-white/5 text-white/70 px-8 py-4 rounded-xl font-bold uppercase transition-all hover:bg-white/10 hover:text-white border border-white/10 w-full"
                    >
                        Voltar para a Loja
                    </button>
                </motion.div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#050505] text-white pt-24 pb-12">
            <Header />

            <div className="container mx-auto px-4 max-w-6xl">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
                    >
                        <ChevronLeft size={16} /> Voltar
                    </button>
                    <div className="flex items-center gap-2 text-green-400 text-sm font-bold bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20">
                        <Lock size={14} /> Checkout Seguro
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    <div className="lg:col-span-7 space-y-8">
                        {/* Seção 1: Recebimento */}
                        <div className="bg-[#0a0a0a] rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl">
                            <h2 className="text-xl font-black italic flex items-center gap-3 mb-6 uppercase">
                                <span className="bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-[0_0_15px_rgba(37,99,235,0.5)]">1</span>
                                MODO DE RECEBIMENTO
                            </h2>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <button
                                    type="button"
                                    onClick={() => setDeliveryType('delivery')}
                                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${deliveryType === 'delivery' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/10 text-white/50 hover:bg-white/5'}`}
                                >
                                    <Truck size={24} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Receber em Casa</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDeliveryType('store')}
                                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${deliveryType === 'store' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/10 text-white/50 hover:bg-white/5'}`}
                                >
                                    <MapPin size={24} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Retirar na Loja</span>
                                </button>
                            </div>

                            {deliveryType === 'delivery' ? (
                                <div className="space-y-4">
                                    <label className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2 block">Cálculo de Frete</label>
                                    <div className="flex gap-4">
                                        <div className="relative flex-1">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                                            <input
                                                type="text"
                                                value={cep}
                                                onChange={(e) => setCep(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                                placeholder="00000-000"
                                                className="w-full bg-black border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-blue-500 transition-all font-medium font-mono"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleCalculateShipping}
                                            disabled={calculatingShipping || cep.length < 8}
                                            className="bg-white/5 hover:bg-white/10 text-white font-bold px-6 rounded-xl border border-white/10 transition-colors disabled:opacity-50"
                                        >
                                            {calculatingShipping ? <Loader2 size={20} className="animate-spin" /> : 'CALCULAR'}
                                        </button>
                                    </div>

                                    <AnimatePresence>
                                        {shippingCost !== null && shippingCost > 0 && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-4">
                                                <label className="flex items-center justify-between p-4 border border-blue-500 bg-blue-500/10 rounded-xl cursor-pointer">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-5 h-5 rounded-full border-4 border-blue-500 flex items-center justify-center">
                                                            <div className="w-2 h-2 bg-white rounded-full" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold">Correios PAC</div>
                                                            <div className="text-xs text-white/50">Entrega em até 5 dias úteis</div>
                                                        </div>
                                                    </div>
                                                    <div className="font-black text-blue-400">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(shippingCost)}
                                                    </div>
                                                </label>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex items-center gap-4">
                                    <div className="bg-blue-500/20 p-3 rounded-full text-blue-500">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-blue-400">Ponto de Retirada Oficial:</p>
                                        <p className="text-sm font-bold mt-1 uppercase italic">Cyber Tech Bragança - Unidade Centro</p>
                                        <p className="text-xs text-white/50 mt-1">Rua da Tecnologia, 123 - Centro, Bragança Paulista - SP</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Seção 2: Seus Dados */}
                        <div className="bg-[#0a0a0a] rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl">
                            <h2 className="text-xl font-black italic flex items-center gap-3 mb-6">
                                <span className="bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-[0_0_15px_rgba(37,99,235,0.5)]">2</span>
                                SEUS DADOS
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <input required type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nome Completo" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 font-medium" />
                                </div>
                                <div>
                                    <input required type="text" value={clientWhatsapp} onChange={(e) => setClientWhatsapp(e.target.value)} placeholder="WhatsApp" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 font-medium" />
                                </div>
                            </div>
                        </div>

                        {/* Seção 3: Pagamento */}
                        <div className={`bg-[#0a0a0a] rounded-3xl p-6 md:p-8 border shadow-2xl transition-all ${(deliveryType === 'delivery' && !shippingCost) || !clientName || !clientWhatsapp ? 'border-white/5 opacity-50 pointer-events-none' : 'border-white/10'}`}>
                            <h2 className="text-xl font-black italic flex items-center gap-3 mb-6">
                                <span className="bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-[0_0_15px_rgba(37,99,235,0.5)]">3</span>
                                PAGAMENTO
                            </h2>

                            <form onSubmit={handlePayment}>
                                <div className={`grid ${deliveryType === 'store' ? 'grid-cols-3' : 'grid-cols-2'} gap-4 mb-8`}>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('credit_card')}
                                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${paymentMethod === 'credit_card' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/10 text-white/50 hover:bg-white/5'}`}
                                    >
                                        <CreditCard size={24} />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Cartão Online</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('pix')}
                                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${paymentMethod === 'pix' ? 'border-green-500 bg-green-500/10 text-white' : 'border-white/10 text-white/50 hover:bg-white/5'}`}
                                    >
                                        <QrCode size={24} />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Pix (Desconto)</span>
                                    </button>
                                    {deliveryType === 'store' && (
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('pay_at_store')}
                                            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${paymentMethod === 'pay_at_store' ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-white/10 text-white/50 hover:bg-white/5'}`}
                                        >
                                            <Smartphone size={24} />
                                            <span className="text-[10px] font-black uppercase tracking-wider">Pagar na Loja</span>
                                        </button>
                                    )}
                                </div>

                                {paymentMethod === 'credit_card' && (
                                    <div className="space-y-4 mb-8">
                                        <input required type="text" placeholder="Número do Cartão" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 font-mono" />
                                        <div className="grid grid-cols-2 gap-4">
                                            <input required type="text" placeholder="MM/AA" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 font-mono" />
                                            <input required type="text" placeholder="CVV" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 font-mono" />
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isProcessing}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-3 text-lg disabled:opacity-70"
                                >
                                    {isProcessing ? <Loader2 size={24} className="animate-spin" /> : <><ShieldCheck size={24} /> {paymentMethod === 'pay_at_store' ? 'RESERVAR PRODUTO' : 'FINALIZAR E PAGAR'}</>}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Resumo */}
                    <div className="lg:col-span-5 h-fit sticky top-28 bg-[#0a0a0a] rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl">
                        <h2 className="text-xl font-black italic mb-6">RESUMO DO PEDIDO</h2>
                        <div className="space-y-4 mb-6">
                            {items.map((item) => (
                                <div key={item.product.id} className="flex gap-4">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-sm line-clamp-2 leading-tight uppercase italic">{item.product.name}</h4>
                                        <div className="text-xs text-white/50 mt-1">Qtd: {item.quantity}</div>
                                    </div>
                                    <div className="font-bold">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.product.price * item.quantity)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="pt-6 mt-6 border-t border-white/10 flex justify-between items-end">
                            <span className="font-bold uppercase tracking-widest text-white/50 text-xs">Total Final</span>
                            <span className="text-3xl font-black text-blue-500">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(paymentMethod === 'pix' ? totalOrderValue * 0.95 : totalOrderValue)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
