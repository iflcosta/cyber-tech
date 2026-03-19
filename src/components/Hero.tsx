"use client";
import { ShieldCheck, Zap, Sparkles, Ticket } from "lucide-react";
import { motion } from "framer-motion";

import { useLeadModal } from "@/contexts/LeadModalContext";

export default function Hero() {
    const { openModal } = useLeadModal();

    return (
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden bg-[var(--bg-primary)] hero-texture">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-[var(--bg-primary)]/50 to-[var(--bg-primary)] pointer-events-none" />

            <div className="container mx-auto px-4 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-5 py-2 border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-[10px] font-mono font-bold uppercase tracking-[0.3em] mb-12 rounded-sm"
                >
                    <div className="w-2 h-2 bg-[var(--accent-success)] rounded-full animate-pulse" />
                    <Sparkles size={14} className="text-[var(--accent-primary)]" />
                    LÍDER EM TECNOLOGIA EM BRAGANÇA PAULISTA
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-6xl md:text-9xl font-display font-bold mb-8 tracking-tighter relative z-10 leading-[0.85] uppercase chrome-text drop-shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
                >
                    PERFORMANCE & <br />
                    <span className="italic">TECNOLOGIA ELITE</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-sm md:text-base text-[var(--text-secondary)] max-w-2xl mx-auto mb-16 leading-relaxed relative z-10 uppercase font-bold tracking-widest"
                >
                    Reparos especializados em Smartphones, notebooks e apple. <br className="hidden md:block" />
                    Montagem de PCs de alta performance com estoque real em Bragança Paulista.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full max-w-3xl mx-auto"
                >
                    <button
                        onClick={() => openModal('manutencao')}
                        className="btn-primary w-full sm:flex-1 py-6 flex items-center justify-center gap-3"
                    >
                        <ShieldCheck size={20} />
                        AGENDAR REPARO
                    </button>
                    <button
                        onClick={() => document.getElementById('pc-builder')?.scrollIntoView({ behavior: 'smooth' })}
                        className="btn-ghost w-full sm:flex-1 py-6 flex items-center justify-center gap-3"
                    >
                        <Zap size={20} />
                        MONTE SEU PC
                    </button>
                </motion.div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24 md:mt-32 pt-16 border-t border-[var(--border-subtle)]">
                    <div>
                        <div className="text-4xl md:text-5xl font-display font-bold text-[var(--text-primary)] chrome-text">2500+</div>
                        <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-[0.3em] font-black mt-3">Reparos Efetuados</div>
                    </div>
                    <div>
                        <div className="text-4xl md:text-5xl font-display font-bold text-[var(--text-primary)] chrome-text">800+</div>
                        <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-[0.3em] font-black mt-3">Setups Montados</div>
                    </div>
                    <div>
                        <div className="text-4xl md:text-5xl font-display font-bold text-[var(--text-primary)] chrome-text">4.9/5</div>
                        <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-[0.3em] font-black mt-3">Média Google Reviews</div>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <div className="text-4xl md:text-5xl font-display font-bold text-[var(--text-primary)] chrome-text">100%</div>
                        <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-[0.3em] font-black mt-3">Garantia Técnica</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
