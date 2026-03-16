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
        <section className="relative pt-28 pb-12 md:pt-32 md:pb-20 overflow-hidden">
            <LeadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                interestType={interest}
            />

            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 blur-[120px] -z-10 rounded-full" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-600/10 blur-[100px] -z-10 rounded-full" />

            <div className="container mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-bold mb-6"
                >
                    <Sparkles size={14} />
                    LÍDER EM TECNOLOGIA EM BRAGANÇA PAULISTA
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-5xl md:text-7xl font-black mb-6 tracking-tight relative z-10"
                >
                    PERFORMANCE & <br />
                    <span className="text-gradient">ASSISTÊNCIA TÉCNICA</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed relative z-10"
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
                        className="btn-primary w-full sm:flex-1 py-4 sm:py-3 text-[15px] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                    >
                        <ShieldCheck size={20} />
                        AGENDAR REPARO
                    </button>
                    <button
                        onClick={() => document.getElementById('kits')?.scrollIntoView({ behavior: 'smooth' })}
                        className="glass w-full sm:flex-1 py-4 sm:py-3 rounded-lg font-bold text-[15px] border border-white/20 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    >
                        <Zap size={20} />
                        VER KITS GAMER
                    </button>
                    <button
                        onClick={() => openModal('voucher')}
                        className="w-full sm:w-auto px-6 py-4 sm:py-3 rounded-lg font-bold text-[14px] text-blue-400 hover:text-blue-300 transition-all flex items-center justify-center gap-2 border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10"
                    >
                        <Ticket size={18} />
                        RESGATAR BRINDE
                    </button>
                </motion.div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mt-12 md:mt-20 pt-10 border-t border-white/5">
                    <div>
                        <div className="text-3xl font-black text-blue-500">2000+</div>
                        <div className="text-sm text-white/40 uppercase tracking-widest font-bold">Reparos realizados</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-blue-500">500+</div>
                        <div className="text-sm text-white/40 uppercase tracking-widest font-bold">PCs Montados</div>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <div className="text-3xl font-black text-blue-500">4.9/5</div>
                        <div className="text-sm text-white/40 uppercase tracking-widest font-bold">Avaliação Google</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
