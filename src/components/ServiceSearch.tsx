"use client";

import { useState } from "react";
import { Search, Loader2, Package, Clock, CheckCircle2, AlertCircle, QrCode, Copy, CreditCard, Laptop, Smartphone, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

const statusSteps = [
    { id: 'pending', label: 'Recebido', icon: Package },
    { id: 'analyzing', label: 'Análise', icon: Search },
    { id: 'in_progress', label: 'Reparo', icon: Clock },
    { id: 'testing', label: 'Testes', icon: CheckCircle2 },
    { id: 'ready', label: 'Pronto', icon: CheckCircle2 },
];

export default function ServiceSearch() {
    const [orderId, setOrderId] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');
    const [copiedPix, setCopiedPix] = useState(false);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!orderId.trim()) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const { data, error } = await supabase
                .from('maintenance_orders')
                .select('*')
                .eq('order_id', orderId.trim().toUpperCase())
                .single();

            if (error) throw error;
            if (!data) setError('Pedido não encontrado.');
            else setResult(data);
        } catch (err) {
            setError('Pedido não encontrado. Verifique o código e tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const currentStatusIdx = result ? statusSteps.findIndex(s => s.id === result.status) : -1;
    const paymentInfo = result?.payment_info;

    return (
        <section id="rastreio" className="py-24 bg-[#F8F7F5] border-y border-[#D4D2CF]">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-7xl font-display font-bold mb-6 tracking-tight text-[#1A1A1A] leading-none uppercase">
                        RASTREIO DE <br />
                        <span className="text-outline">MANUTENÇÃO</span>
                    </h2>
                    <p className="text-[#888888] text-[10px] font-bold uppercase tracking-widest max-w-lg mx-auto leading-relaxed">
                        Acompanhe o status do seu equipamento em tempo real com transparência total e segurança digital.
                    </p>
                </div>

                <div className="bg-white p-10 rounded-[2px] border border-[#D4D2CF] shadow-xl mb-12">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAAAAA]" size={20} />
                            <input
                                type="text"
                                placeholder="DIGITE O CÓDIGO DO PEDIDO (EX: CYB-1234)"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                                className="w-full bg-[#F8F7F5] border border-[#ECEAE6] rounded-[2px] py-4 pl-12 pr-4 text-[#1A1A1A] font-display font-bold uppercase tracking-tight focus:outline-none focus:border-[#1A1A1A] transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !orderId.trim()}
                            className="btn-primary px-8 py-4 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                            CONSULTAR
                        </button>
                    </form>

                    {error && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 p-6 bg-red-50 border border-red-100 text-red-600 rounded-[2px] flex items-center gap-3 text-xs font-bold uppercase tracking-widest">
                            <AlertCircle size={20} /> {error}
                        </motion.div>
                    )}
                </div>

                <AnimatePresence>
                    {result && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-10 rounded-[2px] border border-[#D4D2CF] shadow-2xl overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-[#1A1A1A]" />
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-[#ECEAE6] pb-8">
                                <div>
                                    <div className="text-[10px] text-[#AAAAAA] font-bold uppercase tracking-widest mb-1">CÓDIGO DO ATENDIMENTO</div>
                                    <h3 className="text-3xl font-display font-bold text-[#1A1A1A] uppercase tracking-tight">{result.order_id}</h3>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-[#AAAAAA] font-bold uppercase tracking-widest mb-1">ÚLTIMA ATUALIZAÇÃO</div>
                                    <div className="text-sm font-bold text-[#555555] uppercase">{new Date(result.updated_at).toLocaleString('pt-BR')}</div>
                                </div>
                            </div>

                            <div className="mb-16 relative">
                                <div className="absolute top-5 left-0 w-full h-[1px] bg-[#ECEAE6] hidden md:block" />
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 relative z-10">
                                    {statusSteps.map((step, idx) => {
                                        const Icon = step.icon;
                                        const isActive = idx <= currentStatusIdx;
                                        const isCurrent = idx === currentStatusIdx;

                                        return (
                                            <div key={step.id} className="flex flex-col items-center gap-4 relative group">
                                                <div className={`w-12 h-12 rounded-[2px] flex items-center justify-center transition-all duration-500 border-2 ${
                                                    isCurrent ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' :
                                                    isActive ? 'bg-white border-[#1A1A1A] text-[#1A1A1A]' : 
                                                    'bg-[#F8F7F5] border-[#ECEAE6] text-[#CCCCCC]'
                                                }`}>
                                                    <Icon size={20} />
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-[#1A1A1A]' : 'text-[#AAAAAA]'}`}>
                                                        {step.label}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {result.payment_status === 'paid' && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#F8F7F5] border border-[#ECEAE6] rounded-[2px] p-6 mb-12 flex items-center justify-center gap-4 text-[#1A1A1A] font-display font-bold uppercase tracking-tight">
                                    <CheckCircle2 size={24} /> PAGAMENTO CONFIRMADO
                                </motion.div>
                            )}

                            {result.payment_status === 'awaiting_payment' && paymentInfo && (
                                <div className="bg-[#F8F7F5] border border-[#D4D2CF] rounded-[2px] p-10 mb-12 relative overflow-hidden">
                                    <h3 className="text-2xl font-display font-bold uppercase mb-4 text-[#1A1A1A]">PAGAMENTO <span className="text-outline">LIBERADO</span></h3>
                                    <p className="text-[10px] font-bold text-[#888888] mb-10 uppercase tracking-widest max-w-lg">
                                        Seu pedido está pronto para o próximo passo. Escolha a melhor forma para finalizar:
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-white border border-[#ECEAE6] rounded-[2px] p-8 flex flex-col justify-between shadow-sm">
                                            <div>
                                                <div className="flex items-center gap-4 mb-8">
                                                    <div className="p-3 bg-[#F8F7F5] text-[#1A1A1A] rounded-[2px] border border-[#ECEAE6]"><QrCode size={24} /></div>
                                                    <h4 className="font-display font-bold uppercase tracking-tight text-[#1A1A1A]">PIX COPIA E COLA</h4>
                                                </div>
                                                <div className="bg-[#F8F7F5] p-4 rounded-[2px] flex items-center gap-3 border border-[#ECEAE6] overflow-hidden group">
                                                    <span className="text-xs font-mono text-[#555555] truncate flex-1">{paymentInfo.pixCode}</span>
                                                    <button
                                                        onClick={() => { navigator.clipboard.writeText(paymentInfo.pixCode); setCopiedPix(true); setTimeout(() => setCopiedPix(false), 2000); }}
                                                        className="text-[#AAAAAA] hover:text-[#1A1A1A] transition-colors p-2"
                                                    >
                                                        {copiedPix ? <CheckCircle2 size={18} className="text-green-600" /> : <Copy size={18} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white border border-[#ECEAE6] rounded-[2px] p-8 flex flex-col justify-between shadow-sm">
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="p-3 bg-[#F8F7F5] text-[#1A1A1A] rounded-[2px] border border-[#ECEAE6]"><CreditCard size={24} /></div>
                                                <h4 className="font-display font-bold uppercase tracking-tight text-[#1A1A1A]">CARTÃO DE CRÉDITO</h4>
                                            </div>
                                            <a
                                                href={paymentInfo.checkoutUrl}
                                                target="_blank" rel="noreferrer"
                                                className="btn-primary w-full py-5 text-center"
                                            >
                                                PAGAR ONLINE
                                            </a>
                                        </div>
                                    </div>

                                    <div className="mt-10 pt-10 border-t border-[#ECEAE6] flex flex-col md:flex-row items-center justify-between gap-6">
                                        <p className="text-[10px] text-[#AAAAAA] font-bold uppercase tracking-widest max-w-sm leading-relaxed">
                                            <strong>Prefere pagar na retirada?</strong><br />
                                            Aceitamos dinheiro e cartão maquininha direto na nossa loja.
                                        </p>
                                        <a href={`https://wa.me/5511999999999?text=Oi, estou indo retirar meu pedido ${result.order_id}!`} target="_blank" rel="noreferrer" className="text-[10px] text-[#1A1A1A] font-bold uppercase tracking-[0.2em] border-b border-[#1A1A1A] pb-1 hover:border-transparent transition-all">
                                            AVISAR NO WHATSAPP &rarr;
                                        </a>
                                    </div>
                                </div>
                            )}

                            <div className="bg-[#F8F7F5] rounded-[2px] p-8 border border-[#ECEAE6]">
                                <div className="text-[10px] text-[#AAAAAA] mb-4 uppercase font-bold tracking-[0.3em]">INFORMAÇÃO TÉCNICA:</div>
                                <p className="text-[#1A1A1A] font-medium leading-relaxed italic">
                                    "{result.description || "Iniciando processo de avaliação técnica."}"
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
