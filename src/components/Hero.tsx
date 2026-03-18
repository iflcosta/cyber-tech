"use client";
import { ShieldCheck, Zap, Sparkles, Ticket } from "lucide-react";
import { motion } from "framer-motion";

import { useState } from "react";
import LeadModal from "./LeadModal";

export default function Hero() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [interest, setInterest] = useState<'venda' | 'manutencao' | 'voucher'>('venda');

    const openModal = (type: 'venda' | 'manutencao' | 'voucher') => {
        setInterest(type);
        setIsModalOpen(true);
    };

    return (
        <section className="relative pt-28 pb-12 md:pt-32 md:pb-20 overflow-hidden bg-[#F0EFED] hero-texture">
            <LeadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                interestType={interest}
            />

            <div className="container mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 border border-[#D4D2CF] bg-white text-[#1A1A1A] text-[10px] font-display font-bold uppercase tracking-[0.2em] mb-8"
                >
                    <Sparkles size={14} />
                    LÍDER EM TECNOLOGIA EM BRAGANÇA PAULISTA
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-5xl md:text-8xl font-display font-bold mb-6 tracking-tight relative z-10 leading-[0.9] text-[#1A1A1A]"
                >
                    PERFORMANCE & <br />
                    <span className="text-outline">ASSISTÊNCIA TÉCNICA</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-base md:text-lg text-[#555555] max-w-2xl mx-auto mb-12 leading-relaxed relative z-10 uppercase font-medium tracking-wide"
                >
                    Reparos especializados em Smartphones, Notebooks e Apple. <br className="hidden md:block" />
                    Montagem de PCs Gamers de alta performance para o seu setup.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-3xl mx-auto"
                >
                    <button
                        onClick={() => openModal('manutencao')}
                        className="btn-primary w-full sm:flex-1 py-5 flex items-center justify-center gap-3"
                    >
                        <ShieldCheck size={20} />
                        AGENDAR REPARO
                    </button>
                    <button
                        onClick={() => document.getElementById('monte-seu-pc')?.scrollIntoView({ behavior: 'smooth' })}
                        className="btn-ghost w-full sm:flex-1 py-5 flex items-center justify-center gap-3"
                    >
                        <Zap size={20} />
                        MONTE SEU PC
                    </button>
                </motion.div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mt-16 md:mt-24 pt-12 border-t border-[#D4D2CF]">
                    <div>
                        <div className="text-4xl font-display font-bold text-[#1A1A1A]">2000+</div>
                        <div className="text-[10px] text-[#888888] uppercase tracking-[0.2em] font-bold mt-2">Reparos realizados</div>
                    </div>
                    <div>
                        <div className="text-4xl font-display font-bold text-[#1A1A1A]">500+</div>
                        <div className="text-[10px] text-[#888888] uppercase tracking-[0.2em] font-bold mt-2">PCs Montados</div>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <div className="text-4xl font-display font-bold text-[#1A1A1A]">4.9/5</div>
                        <div className="text-[10px] text-[#888888] uppercase tracking-[0.2em] font-bold mt-2">Avaliação Google</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
