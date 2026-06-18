"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MessageCircle, Zap } from "lucide-react";
import { motion } from "framer-motion";

import { useLeadModal } from "@/contexts/LeadModalContext";
import { brand } from "@/lib/brand";

export default function Hero() {
    const { openModal } = useLeadModal();
    const searchParams = useSearchParams();
    const serviceParam = searchParams.get('service');

    // Formata o serviço vindo da URL (ex: hardware_premium -> Hardware Premium)
    const formattedService = serviceParam
        ? serviceParam.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        : null;

    // B2B-safe: bloqueia servicos consumer-facing (manutencao, conserto, etc) que o
    // Google Ads barra. Mantem apenas termos comerciais permitidos.
    const blockedTerms = ['conserto', 'reparo', 'manutencao', 'manutenção', 'assistencia', 'assistência', 'diagnostico', 'diagnóstico', 'formatacao', 'formatação'];
    const serviceIsSafe = formattedService && !blockedTerms.some(k => formattedService.toLowerCase().includes(k));

    // Mensagem pre-formatada para WhatsApp
    const whatsappMessage = serviceIsSafe
        ? `Olá! Vim pelo site da Cyber e gostaria de falar com a curadoria técnica sobre ${formattedService}.`
        : "Olá! Vim pelo site da Cyber e gostaria de falar com a curadoria técnica.";
    const whatsappUrl = `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(whatsappMessage)}`;

    return (
        <section className="relative pt-32 pb-24 md:pt-48 md:pb-40 bg-[#121216] group">
            {/* Fundo isolado em overflow-hidden para não clipar o texto */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute inset-0 z-0 opacity-70 mix-blend-screen grayscale group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
                    style={{
                        backgroundImage: 'url(/hero-bg.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
                {/* High-impact Gradient Overlay */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#121216]/70 via-[#121216]/30 to-[#121216] z-1" />
                {/* Glow branco central */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] opacity-10" />
                {/* Glow vermelho — identidade da marca */}
                <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-[var(--accent-primary)] rounded-full blur-[140px] opacity-[0.06]" />
            </div>

            <div className="container mx-auto px-6 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--accent-primary)]/20 bg-[var(--accent-primary)]/5 backdrop-blur-md text-[var(--accent-primary)] text-[9px] md:text-[10px] font-mono font-bold uppercase tracking-[0.2em] md:tracking-[0.4em] mb-12 rounded-full shadow-[0_0_20px_var(--accent-glow)]"
                >
                    LOJA TÉCNICA · BRAGANÇA PAULISTA · ATENDIMENTO PRESENCIAL
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold mb-8 tracking-tight relative z-10 leading-[0.95] text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] pb-3 max-w-5xl mx-auto"
                >
                    Tecnologia, montagem e curadoria técnica em Bragança Paulista.
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-balance text-sm md:text-lg text-slate-300 max-w-3xl mx-auto mb-16 leading-relaxed relative z-10 font-medium tracking-wide"
                >
                    {serviceIsSafe ? (
                        <>
                            Soluções em <span className="text-[var(--accent-primary)] font-bold">{formattedService}</span>. <br className="hidden md:block" />
                            Loja técnica de PC, notebook e celular — curadoria, montagem e atendimento humano.
                        </>
                    ) : (
                        <>
                            Loja técnica de PC, notebook e celular. Atendemos o cliente final com curadoria e montagem — e lojistas e assistências parceiras com indicação técnica e pós-venda estendido.
                        </>
                    )}
                </motion.p>


                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full max-w-3xl mx-auto"
                >
                    <Link
                        href="/produtos"
                        className="btn-primary w-full sm:flex-1 py-6 flex items-center justify-center gap-3 uppercase font-bold tracking-widest text-xs"
                    >
                        VER CATÁLOGO
                    </Link>
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-ghost w-full sm:flex-1 py-6 flex items-center justify-center gap-3 !border-white/30 !text-white/90 hover:!bg-white/10 hover:!border-white/50 transition-all uppercase font-bold tracking-widest text-xs"
                    >
                        <MessageCircle size={20} />
                        FALAR COM A CURADORIA
                    </a>
                </motion.div>
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-24 md:mt-32 pt-16 border-t border-white/10">
                    {[
                        { value: '2500+', label: 'Módulos de Hardware', color: 'text-white' },
                        { value: '800+',  label: 'Workstations Entregues',    color: 'text-white' },
                        { value: '4.9/5', label: 'Google Reviews',     color: 'text-white' },
                        { value: '100%',  label: 'Qualidade Garantida',   color: 'text-[var(--accent-success)]' },
                    ].map((stat) => (
                        <div key={stat.label} className="glass-dark rounded-2xl p-6 text-center transition-all duration-300">
                            <div className={`text-4xl md:text-5xl font-display font-bold tracking-tighter ${stat.color}`}>{stat.value}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-[0.25em] font-black mt-3">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}