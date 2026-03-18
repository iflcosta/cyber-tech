"use client";
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Copy, Send, Smartphone } from 'lucide-react';
import { trackLead } from '@/lib/leads';
import { brand } from '@/lib/brand';
import { cn } from './ui/Button';

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
                        className="bg-white w-full max-w-md my-auto rounded-[2px] overflow-hidden border border-[#D4D2CF] shadow-2xl relative"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-[#AAAAAA] hover:text-[#1A1A1A] z-20 p-2 hover:bg-[#F8F7F5] transition-all"
                        >
                            <X size={24} />
                        </button>

                        <div className="p-6 md:p-8">
                            {step === 'form' ? (
                                <>
                                    <div className="mb-8">
                                        <div className="inline-flex p-3 rounded-[2px] bg-[#F8F7F5] text-[#1A1A1A] mb-6 border border-[#ECEAE6]">
                                            <Smartphone size={24} />
                                        </div>
                                        <h2 className="text-3xl font-display font-bold tracking-tight text-[#1A1A1A] leading-nãone">
                                            {interestType === 'voucher' ? (
                                                <>GARANTA SEU <span className="text-outline">BRINDE</span></>
                                            ) : interestType === 'manutencao' ? (
                                                <>SOLICITAR <span className="text-outline">ORÇAMENTO</span></>
                                            ) : interestType === 'pc_build' ? (
                                                <>ENVIAR <span className="text-outline">SETUP</span></>
                                            ) : (
                                                <>TENHO <span className="text-outline">INTERESSE</span></>
                                            )}
                                        </h2>
                                        <p className="text-[#888888] text-[10px] font-bold uppercase tracking-widest mt-4">
                                            {interestType === 'voucher'
                                                ? "Contato para resgate de voucher exclusivo."
                                                : interestType === 'pc_build'
                                                    ? "Contato para orçamento do seu PC Gamer."
                                                    : "Contato para atendimento especializado."}
                                        </p>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-display font-bold uppercase tracking-[0.2em] text-[#888888] mb-2 block">Nãome Completo</label>
                                            <input
                                                required
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Ex: Iago Lopes"
                                                className="w-full bg-[#F8F7F5] border border-[#ECEAE6] rounded-[2px] px-4 py-4 text-[#1A1A1A] focus:outline-nãone focus:border-[#1A1A1A] transition-all font-medium"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-display font-bold uppercase tracking-[0.2em] text-[#888888] mb-2 block">WhatsApp</label>
                                            <input
                                                required
                                                type="tel"
                                                value={whatsapp}
                                                onChange={(e) => setWhatsapp(e.target.value)}
                                                placeholder="(11) 99999-9999"
                                                className="w-full bg-[#F8F7F5] border border-[#ECEAE6] rounded-[2px] px-4 py-4 text-[#1A1A1A] focus:outline-nãone focus:border-[#1A1A1A] transition-all font-medium"
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
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-nãone focus:border-blue-500 transition-all font-medium"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2 block">Descreva o Problema</label>
                                                    <textarea
                                                        required
                                                        value={problem}
                                                        onChange={(e) => setProblem(e.target.value)}
                                                        placeholder="O que está acontecendo?"
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-nãone focus:border-blue-500 transition-all h-24 font-medium"
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
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-nãone focus:border-blue-500 transition-all font-medium"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <button
                                            disabled={loading}
                                            type="submit"
                                            className="w-full btn-primary py-5 mt-6 flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {loading ? 'PROCESSANDO...' : (
                                                <>
                                                    {interestType === 'voucher' ? 'GERAR MEU VOUCHER' : 'ENVIAR SOLICITAÇÃO'}
                                                    <Send size={18} />
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

                                    <div className="bg-[#F8F7F5] border border-dashed border-[#D4D2CF] rounded-[2px] p-6 mb-8 relative group overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-[2px] bg-[#1A1A1A]" />
                                        <div className="text-3xl font-display font-bold tracking-widest text-[#1A1A1A] mb-2">{voucher}</div>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(voucher)}
                                            className="inline-flex items-center gap-2 text-[10px] text-[#888888] font-bold hover:text-[#1A1A1A] transition-colors uppercase tracking-widest"
                                        >
                                            <Copy size={12} /> COPIAR CÓDIGO
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        <button
                                            onClick={onClose}
                                            className="w-full py-4 border border-[#ECEAE6] rounded-[2px] text-[#888888] text-[10px] font-bold uppercase tracking-widest hover:text-[#1A1A1A] hover:bg-[#F8F7F5] transition-all"
                                        >
                                            FECHAR JANELA
                                        </button>

                                        <a
                                            href={`https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(whatsappMessage || `Olá, acabei de fazer uma solicitação não site (Código: ${voucher}). Gostaria de mais informações!`)}`}
                                            target="_blank"
                                            rel="nãoreferrer"
                                            className="w-full btn-primary py-5 flex items-center justify-center gap-3"
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
