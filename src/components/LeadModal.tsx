"use client";
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Copy, Send, Smartphone } from 'lucide-react';
import { trackLead } from '@/lib/leads';

interface LeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    interestType: 'venda' | 'manutencao' | 'voucher' | 'pc_build';
    customDescription?: string;
    whatsappMessage?: string;
}

export default function LeadModal({ isOpen, onClose, interestType, customDescription, whatsappMessage }: LeadModalProps) {
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [name, setName] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [model, setModel] = useState('');
    const [problem, setProblem] = useState('');
    const [deliveryType, setDeliveryType] = useState<'store' | 'delivery'>('store');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [voucher, setVoucher] = useState('');
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            // Reset state when closing
            setTimeout(() => setStep('form'), 300);
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !whatsapp || loading) return;

        setLoading(true);
        let description = customDescription || '';
        if (interestType === 'manutencao') {
            description = `Modelo: ${model} | Problema: ${problem}`;
        }
        if (interestType === 'venda' || interestType === 'pc_build') {
            description += ` | Entrega: ${deliveryType === 'store' ? 'Retirada na Loja' : 'Entrega em ' + deliveryAddress}`;
        }

        const code = await trackLead({
            client_name: name,
            whatsapp: whatsapp,
            interest_type: interestType,
            description,
            delivery_type: deliveryType,
            delivery_address: deliveryAddress
        });

        if (code) {
            setVoucher(code);
            setStep('success');
        }
        setLoading(false);
    };

    if (!mounted) return null;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-lg overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 40 }}
                        className="glass w-full max-w-md my-auto rounded-3xl overflow-hidden border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-white/40 hover:text-white z-20 p-2 hover:bg-white/5 rounded-full transition-all"
                        >
                            <X size={24} />
                        </button>

                        <div className="p-6 md:p-8">
                            {step === 'form' ? (
                                <>
                                    <div className="mb-4 md:mb-6">
                                        <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 text-blue-500 mb-4 border border-blue-500/20">
                                            <Smartphone size={24} />
                                        </div>
                                        <h2 className="text-2xl font-black italic uppercase">
                                            {interestType === 'voucher' ? (
                                                <>GARANTA SEU <span className="text-blue-500">BRINDE</span></>
                                            ) : interestType === 'manutencao' ? (
                                                <>SOLICITAR <span className="text-blue-500">ORÇAMENTO</span></>
                                            ) : interestType === 'pc_build' ? (
                                                <>ENVIAR <span className="text-blue-500">SETUP</span></>
                                            ) : (
                                                <>TENHO <span className="text-blue-500">INTERESSE</span></>
                                            )}
                                        </h2>
                                        <p className="text-white/40 text-sm mt-2">
                                            {interestType === 'voucher'
                                                ? "Deixe seu contato para resgatar seu voucher de brinde exclusivo."
                                                : interestType === 'pc_build'
                                                    ? "Deixe seu contato para enviarmos o orçamento do seu PC Gamer."
                                                    : "Deixe seu contato para que um de nossos especialistas entre em contato com você."}
                                        </p>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2 block">Nome Completo</label>
                                            <input
                                                required
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Ex: Iago Lopes"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all font-medium"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2 block">WhatsApp</label>
                                            <input
                                                required
                                                type="tel"
                                                value={whatsapp}
                                                onChange={(e) => setWhatsapp(e.target.value)}
                                                placeholder="(11) 99999-9999"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all font-medium"
                                            />
                                        </div>

                                        {interestType === 'manutencao' && (
                                            <>
                                                <div>
                                                    <label className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2 block">Modelo do Aparelho</label>
                                                    <input
                                                        required
                                                        type="text"
                                                        value={model}
                                                        onChange={(e) => setModel(e.target.value)}
                                                        placeholder="Ex: iPhone 13, Dell G15"
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all font-medium"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2 block">Descreva o Problema</label>
                                                    <textarea
                                                        required
                                                        value={problem}
                                                        onChange={(e) => setProblem(e.target.value)}
                                                        placeholder="O que está acontecendo?"
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all h-24 font-medium"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {(interestType === 'venda' || interestType === 'pc_build') && (
                                            <div className="pt-2">
                                                <label className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2 block">Preferência de Retirada/Entrega</label>
                                                <div className="flex gap-4 mb-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeliveryType('store')}
                                                        className={`flex-1 py-3 border rounded-xl text-xs font-bold transition-all ${deliveryType === 'store' ? 'bg-blue-600/20 border-blue-500 text-blue-500' : 'border-white/10 text-white/40 hover:border-white/30'}`}
                                                    >
                                                        NA LOJA
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeliveryType('delivery')}
                                                        className={`flex-1 py-3 border rounded-xl text-xs font-bold transition-all ${deliveryType === 'delivery' ? 'bg-blue-600/20 border-blue-500 text-blue-500' : 'border-white/10 text-white/40 hover:border-white/30'}`}
                                                    >
                                                        ENTREGA
                                                    </button>
                                                </div>
                                                {deliveryType === 'delivery' && (
                                                    <div className="mb-4">
                                                        <input
                                                            required
                                                            type="text"
                                                            value={deliveryAddress}
                                                            onChange={(e) => setDeliveryAddress(e.target.value)}
                                                            placeholder="Endereço Completo e Bairro"
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all font-medium"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <button
                                            disabled={loading}
                                            type="submit"
                                            className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2 group disabled:opacity-50 mt-4"
                                        >
                                            {loading ? 'PROCESSANDO...' : (
                                                <>
                                                    {interestType === 'voucher' ? 'GERAR MEU VOUCHER' : 'ENVIAR SOLICITAÇÃO'}
                                                    <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </>
                            ) : (
                                <div className="text-center py-6">
                                    <div className="flex justify-center mb-6">
                                        <div className="bg-green-500/20 text-green-500 p-4 rounded-full border border-green-500/20">
                                            <CheckCircle2 size={48} />
                                        </div>
                                    </div>
                                    <h2 className="text-2xl font-black italic uppercase mb-2">
                                        {interestType === 'voucher' ? (
                                            <>VOUCHER <span className="text-blue-500">LIBERADO!</span></>
                                        ) : (
                                            <>SOLICITAÇÃO <span className="text-blue-500">ENVIADA!</span></>
                                        )}
                                    </h2>
                                    <p className="text-white/40 text-sm mb-8">
                                        {interestType === 'voucher'
                                            ? "Apresente este código na loja em Bragança para ganhar seu **BRINDE**."
                                            : "Obrigado! Um consultor entrará em contato via WhatsApp em breve."}
                                    </p>

                                    <div className="bg-white/5 border border-dashed border-white/20 rounded-2xl p-6 mb-8 relative group overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                                        <div className="text-3xl font-black tracking-widest text-white mb-2">{voucher}</div>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(voucher)}
                                            className="inline-flex items-center gap-2 text-xs text-blue-400 font-bold hover:text-blue-300 transition-colors"
                                        >
                                            <Copy size={12} /> COPIAR CÓDIGO
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        <button
                                            onClick={onClose}
                                            className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-white/60 text-xs font-bold uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all font-black"
                                        >
                                            FECHAR JANELA
                                        </button>

                                        <a
                                            href={`https://wa.me/5511999999999?text=${encodeURIComponent(whatsappMessage || `Olá Iago, acabei de fazer uma solicitação no site (Código: ${voucher}). Gostaria de mais informações!`)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-full flex items-center justify-center gap-2 py-4 bg-green-500 hover:bg-green-600 rounded-xl text-white text-xs font-bold uppercase tracking-widest transition-all font-black shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                                            onClick={onClose}
                                        >
                                            <Smartphone size={16} /> INICIAR NEGOCIAÇÃO
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
