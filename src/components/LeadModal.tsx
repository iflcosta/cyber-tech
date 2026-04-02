"use client";
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Copy, Send, Monitor, Smartphone, Wrench, HelpCircle, ArrowRight } from 'lucide-react';
import { cn } from "./ui/Button";
import { trackLead } from '@/lib/leads';
import { getOrCreateSessionVoucher } from '@/lib/session/voucherSession';
import { brand } from '@/lib/brand';
import { useSearchParams, usePathname } from 'next/navigation';
import { useLeadModal } from '@/contexts/LeadModalContext';

type LeadStep = 'intent' | 'details' | 'success';
type IntentType = 'compra_imediata' | 'pesquisando_preco' | 'manutencao_urgente' | 'duvida_tecnica';

export default function LeadModal() {
    const { isOpen, closeModal, goal: initialGoal, customDescription, whatsappMessage, productIds, openModal, selectedProduct } = useLeadModal();
    const [step, setStep] = useState<LeadStep>('intent');
    const [intent, setIntent] = useState<IntentType | null>(null);
    const [goal, setGoal] = useState<'compra' | 'manutencao' | 'duvida' | null>(null);

    // Form states
    const [name, setName] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [description, setDescription] = useState('');
    const [deviceModel, setDeviceModel] = useState('');
    const [budget, setBudget] = useState('');
    const [usage, setUsage] = useState('');

    const [voucher, setVoucher] = useState('');
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [redirectTimer, setRedirectTimer] = useState<number | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        if (step === 'success') {
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        const text = whatsappMessage || `Olá, acabei de gerar um voucher no site (Código: ${voucher}). Gostaria de atendimento para ${selectedProduct ? `o produto ${selectedProduct.name}` : (goal === 'manutencao' ? 'conserto' : goal === 'compra' ? 'compra' : 'uma dúvida')}.`;
                        const url = `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(text)}`;
                        window.open(url, '_blank');
                        closeModal();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        } else {
            setCountdown(5);
        }
    }, [step, voucher, brand.whatsapp, whatsappMessage, goal, closeModal]);
    useEffect(() => {
        if (isOpen) {
            if (initialGoal) {
                setGoal(initialGoal);
                setStep('details');
                // Auto-set intent based on goal
                if (initialGoal === 'manutencao') setIntent('manutencao_urgente');
                else if (initialGoal === 'duvida') setIntent('duvida_tecnica');
                else setIntent('pesquisando_preco');
            } else {
                setStep('intent');
            }
        }
    }, [isOpen, initialGoal]);

    // useEffect removed to prevent automatic modal pop-up on load/exit

    useEffect(() => {
        if (isOpen) {
            if (initialGoal) {
                setStep('details');
                setGoal(initialGoal);
            }
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            // Reset form after animation
            const timer = setTimeout(() => {
                setStep('intent');
                setGoal(null);
                setName('');
                setWhatsapp('');
                setDescription('');
                setBudget('');
                setUsage('');
            }, 300);
            return () => clearTimeout(timer);
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen, initialGoal]);

    const handleIntentSelection = (selectedGoal: 'compra' | 'manutencao' | 'duvida') => {
        setGoal(selectedGoal);
        setStep('details');
        if (selectedGoal === 'manutencao') setIntent('manutencao_urgente');
        else if (selectedGoal === 'duvida') setIntent('duvida_tecnica');
        else setIntent('pesquisando_preco');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !whatsapp || loading) return;

        setLoading(true);
        
        let currentIntent = intent;
        
        // Merge descriptions
        let finalDescription = description;
        if (goal === 'manutencao') {
            finalDescription = `Modelo: ${deviceModel} | Problema: ${description}`;
        } else if (goal === 'compra') {
            const details = [];
            if (budget) details.push(`Orçamento: ${budget}`);
            if (usage) details.push(`Uso: ${usage}`);
            if (description) details.push(`Obs: ${description}`);
            finalDescription = details.join(' | ');
            if (budget === 'acima de R$3.000') {
                currentIntent = 'compra_imediata';
                setIntent('compra_imediata');
            }
        }
        
        if (selectedProduct) {
            finalDescription = `Produto: ${selectedProduct.name} (Pr: ${selectedProduct.price}) | ${finalDescription}`;
        }
        
        if (customDescription) {
            finalDescription = `${customDescription} | Detalhes: ${finalDescription}`;
        }

        const utm_params = {
            source: searchParams.get('utm_source'),
            medium: searchParams.get('utm_medium'),
            campaign: searchParams.get('utm_campaign'),
            product_ids: productIds
        };

        const sessionVoucherCode = await getOrCreateSessionVoucher();

        const code = await trackLead({
            client_name: name,
            whatsapp: whatsapp,
            interest_type: goal === 'manutencao' ? 'manutencao' : 'venda',
            intent_type: currentIntent || 'duvida_tecnica',
            description: finalDescription,
            marketing_source: utm_params.source || 'direct',
            utm_parameters: utm_params,
            voucher_code: sessionVoucherCode
        });

        if (code) {
            setVoucher(code);
            setStep('success');
            // Inform the user we are redirecting? Or just let them click.
            // Let's stick to the button first but make it EXTREMELY prominent.
        }
        setLoading(false);
    };

    if (!mounted) return null;

    const intentClasses = "flex flex-col items-center justify-center p-6 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl hover:border-[var(--border-active)] hover:bg-[var(--bg-surface)] transition-all group text-center";

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-[var(--bg-surface)] w-full max-w-lg my-auto rounded-2xl overflow-hidden border border-[var(--border-subtle)] shadow-2xl relative"
                    >
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] z-20 p-2 hover:bg-[var(--bg-elevated)] rounded-full transition-all"
                        >
                            <X size={20} />
                        </button>

                        <div className="relative">
                            <div className="h-24 bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-surface)] border-b border-[var(--border-subtle)] flex items-center px-8">
                                <h2 className="text-3xl font-display font-bold tracking-tight text-[var(--text-primary)] chrome-text leading-none">
                                    {step === 'intent' ? 'VAMOS COMEÇAR?' : step === 'details' ? 'QUASE LÁ' : 'TUDO PRONTO!'}
                                </h2>
                                {selectedProduct && step !== 'success' && (
                                    <div className="ml-auto mr-20 flex items-center gap-3 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg p-2 pr-4 shadow-sm">
                                        {selectedProduct.image && (
                                            <div className="w-10 h-10 relative rounded overflow-hidden border border-[var(--border-subtle)]">
                                                <img src={selectedProduct.image} alt={selectedProduct.name} className="object-cover w-full h-full" />
                                            </div>
                                        )}
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest font-bold">Interesse em:</span>
                                            <span className="text-[11px] text-[var(--text-primary)] font-bold truncate max-w-[150px]">{selectedProduct.name}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-8">
                                {step === 'intent' ? (
                                    <div className="space-y-6">
                                        <p className="text-[var(--text-secondary)] font-mono text-xs uppercase tracking-[0.2em] mb-4">Qual é o seu objetivo hoje?</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <button onClick={() => handleIntentSelection('compra')} className={intentClasses}>
                                                <Monitor className="mb-3 text-[var(--accent-primary)] group-hover:scale-110 transition-transform" size={32} />
                                                <span className="text-xs font-display font-bold uppercase tracking-wider">Comprar PC/Notebook</span>
                                            </button>
                                            <button onClick={() => handleIntentSelection('compra')} className={intentClasses}>
                                                <Smartphone className="mb-3 text-[var(--accent-primary)] group-hover:scale-110 transition-transform" size={32} />
                                                <span className="text-xs font-display font-bold uppercase tracking-wider">Comprar Celular</span>
                                            </button>
                                            <button onClick={() => handleIntentSelection('manutencao')} className={intentClasses}>
                                                <Wrench className="mb-3 text-[var(--accent-primary)] group-hover:scale-110 transition-transform" size={32} />
                                                <span className="text-xs font-display font-bold uppercase tracking-wider">Consertar Dispositivo</span>
                                            </button>
                                            <button onClick={() => handleIntentSelection('duvida')} className={intentClasses}>
                                                <HelpCircle className="mb-3 text-[var(--accent-primary)] group-hover:scale-110 transition-transform" size={32} />
                                                <span className="text-xs font-display font-bold uppercase tracking-wider">Tirar uma Dúvida</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : step === 'details' ? (
                                    <form onSubmit={handleSubmit} className="space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest ml-1">Seu Nome</label>
                                                <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome Completo" className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all font-sans text-sm" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest ml-1">WhatsApp</label>
                                                <input required type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all font-sans text-sm" />
                                            </div>
                                        </div>

                                        {((goal === 'compra' || goal === 'duvida') && !customDescription?.startsWith('BUILD SIMULADA') && !selectedProduct) ? (
                                            <>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest ml-1">Qual é o seu orçamento?</label>
                                                    <select required={!customDescription?.startsWith('BUILD SIMULADA')} value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all font-sans text-sm">
                                                        <option value="">Selecione uma faixa...</option>
                                                        <option value="até R$1.500">Até R$ 1.500</option>
                                                        <option value="R$1.500-3.000">R$ 1.500 — R$ 3.000</option>
                                                        <option value="acima de R$3.000">Acima de R$ 3.000</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest ml-1">O que você procura?</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {['Smartphone', 'PC Gamer', 'Periféricos', 'Outros'].map((val) => (
                                                            <button 
                                                                key={val} 
                                                                type="button" 
                                                                onClick={() => setUsage(val)} 
                                                                className={cn(
                                                                    "py-3 text-[10px] font-bold rounded-md border transition-all uppercase tracking-widest",
                                                                    usage === val 
                                                                        ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)]" 
                                                                        : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-active)] hover:bg-[var(--bg-surface)]"
                                                                )}
                                                            >
                                                                {val}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        ) : goal === 'manutencao' ? (
                                            <div className="space-y-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest ml-1">Modelo do Dispositivo</label>
                                                    <input required type="text" value={deviceModel} onChange={(e) => setDeviceModel(e.target.value)} placeholder="Ex: iPhone 13, Notebook Dell G15..." className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all font-sans text-sm" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest ml-1">O que está acontecendo?</label>
                                                    <textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva brevemente o problema..." className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all h-24 font-sans text-sm resize-none" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest ml-1">Como podemos ajudar?</label>
                                                <textarea required={!customDescription} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={customDescription?.startsWith('BUILD SIMULADA') ? "Alguma observação adicional?" : "Sua dúvida ou comentário..."} className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all h-24 font-sans text-sm resize-none" />
                                            </div>
                                        )}

                                        <button disabled={loading} type="submit" className="btn-primary w-full py-4 mt-4 flex items-center justify-center gap-3 disabled:opacity-50">
                                            {loading ? 'ENVIANDO...' : (<>CONCLUIR E GANHAR VOUCHER <ArrowRight size={18} /></>)}
                                        </button>
                                        <button type="button" onClick={() => setStep('intent')} className="w-full text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest hover:text-[var(--text-primary)] transition-colors">
                                            ← Voltar
                                        </button>
                                    </form>
                                ) : (
                                    <div className="text-center py-4">
                                        <div className="flex justify-center mb-6">
                                            <div className="bg-[var(--accent-success)]/20 text-[var(--accent-success)] p-4 rounded-full border border-[var(--accent-success)]/10">
                                                <CheckCircle2 size={48} />
                                            </div>
                                        </div>
                                        <h2 className="text-2xl font-display font-bold uppercase mb-2 chrome-text">VOUCHER LIBERADO!</h2>
                                        <p className="text-[var(--text-secondary)] text-sm mb-4 px-4">
                                            Seu código <span className="text-[var(--text-primary)] font-bold">BPC</span> foi gerado com sucesso.
                                        </p>
                                        <p className="text-[var(--accent-success)] text-[10px] font-mono font-bold uppercase tracking-widest mb-6">
                                            Redirecionando para o WhatsApp em {countdown}s...
                                        </p>

                                        <div className="bg-[var(--bg-elevated)] border border-dashed border-[var(--border-subtle)] rounded-xl p-8 mb-8 relative group overflow-hidden shadow-inner">
                                            <div className="text-4xl font-mono font-bold tracking-[0.2em] text-[var(--text-primary)] mb-4">{voucher}</div>
                                            <button onClick={() => navigator.clipboard.writeText(voucher)} className="inline-flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-mono hover:text-[var(--text-primary)] transition-colors uppercase tracking-widest">
                                                <Copy size={12} /> Copiar Código
                                            </button>
                                        </div>

                                        <div className="space-y-3 px-4">
                                            <a href={`https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(whatsappMessage || `Olá, acabei de gerar um voucher no site (Código: ${voucher}). Gostaria de atendimento para ${selectedProduct ? `a compra do ${selectedProduct.name}` : (goal === 'manutencao' ? 'conserto' : goal === 'compra' ? 'compra' : 'uma dúvida')}.`)}`} target="_blank" rel="noreferrer" className="btn-primary w-full py-5 flex items-center justify-center gap-3" onClick={closeModal} >
                                                <Send size={18} /> INICIAR NO WHATSAPP
                                            </a>
                                            <button onClick={closeModal} className="w-full py-3 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest hover:text-[var(--text-primary)] transition-colors">
                                                Fechar este aviso
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
