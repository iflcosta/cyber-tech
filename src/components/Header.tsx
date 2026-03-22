"use client";
import { useState, useEffect } from "react";
import { Menu, X as CloseIcon, MessageSquare, Clock, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { brand } from "@/lib/brand";
import { useWhatsAppLead } from "@/hooks/useWhatsAppLead";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";          // Opção A — SVG refinado
// import Logo from "./LogoAlt";   // Opção B — wordmark HTML (troque para testar)

import { useShopStatus } from "@/contexts/ShopStatusContext";

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { isLoading: waLoading, openWhatsAppLead } = useWhatsAppLead({ serviceType: 'outro' });
    const { storeStatus } = useShopStatus();

    const menuItems = [
        { label: "Manutenção", href: "/#assistencia" },
        { label: "Showroom", href: "/#showroom" },
        { label: "PC Builder", href: "/#pc-builder" },
        { label: "Produtos", href: "/produtos" },
        { label: "Calculadora", href: "/calculadora" },
    ];

    const pathname = usePathname();

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const statusColors = {
        open: "text-[var(--accent-success)]",
        closing: "text-amber-500",
        closed: "text-[var(--accent-hot)]"
    };

    const statusBg = {
        open: "bg-[var(--accent-success)]/20",
        closing: "bg-amber-500/20",
        closed: "bg-[var(--accent-hot)]/20"
    };

    const scrollToTop = (e: React.MouseEvent) => {
        if (pathname === '/') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleNavClick = (e: React.MouseEvent, href: string) => {
        if (href.startsWith('/#') && pathname === '/') {
            const id = href.replace('/#', '');
            const element = document.getElementById(id);
            if (element) {
                e.preventDefault();
                const offset = 80;
                const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = elementPosition - offset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
                
                if (isMenuOpen) setIsMenuOpen(false);
            }
        }
    };

    return (
        <>
        <header className="fixed top-0 w-full z-[100] bg-[#0A0A0C]/80 backdrop-blur-md border-b border-white/5">
            <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
                <Link href="/" onClick={scrollToTop} className="flex items-center">
                    <Logo className="h-10 md:h-12 w-auto" />
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    {menuItems.map((item) => (
                        <Link 
                            key={item.label} 
                            href={item.href} 
                            onClick={(e) => handleNavClick(e, item.href)}
                            className="text-[14px] font-display font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors relative group"
                        >
                            {item.label}
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--accent-primary)] transition-all group-hover:w-full" />
                        </Link>
                    ))}
                </nav>

                {/* Desktop Store Status & WhatsApp */}
                <div className="hidden lg:flex items-center gap-6">
                    <div className={`flex items-center gap-2.5 px-4 py-2 rounded-full border border-current ${statusColors[storeStatus.status]} ${statusBg[storeStatus.status]} text-[13px] font-bold font-mono uppercase tracking-tight shadow-sm`}>
                        <div className={`w-2 h-2 rounded-full fill-current animate-pulse ${statusBg[storeStatus.status].replace('/10', '')}`} />
                        {storeStatus.message}
                    </div>

                    <button
                        onClick={() => openWhatsAppLead({ intent: 'duvida_tecnica', description: 'Clique no Header (Desktop)' })}
                        disabled={waLoading}
                        className="btn-primary flex items-center gap-2 text-[11px] font-display font-bold uppercase tracking-wider text-white px-5 py-2.5 transition-all duration-300 hover:-translate-y-[1px] disabled:opacity-70"
                    >
                        {waLoading ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                        WhatsApp
                    </button>
                </div>

                {/* Mobile Menu Icon */}
                <button
                    onClick={toggleMenu}
                    className="md:hidden text-[var(--text-primary)] p-2 hover:bg-[var(--bg-surface)] rounded-md transition-colors"
                >
                    {isMenuOpen ? <CloseIcon size={24} /> : <Menu size={24} />}
                </button>
            </div>
        </header>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
            {isMenuOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleMenu}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        className="card-dark fixed right-0 top-0 h-full w-[85%] max-w-sm bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] z-[120] p-6 flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-10">
                            <span className="text-xl font-display font-bold tracking-widest text-[var(--text-primary)] chrome-text">MENU</span>
                            <button onClick={toggleMenu} className="w-10 h-10 bg-[var(--bg-elevated)] rounded-md flex justify-center items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                                <CloseIcon size={20} />
                            </button>
                        </div>

                        <div className={`flex items-center gap-3 p-4 rounded-lg mb-8 border border-[var(--border-subtle)] ${statusBg[storeStatus.status]}`}>
                            <Clock size={20} className={statusColors[storeStatus.status]} />
                            <div className="flex flex-col">
                                <span className={`text-[16px] font-bold ${statusColors[storeStatus.status]}`}>{storeStatus.status === 'closed' ? 'FECHADO' : 'ABERTO'}</span>
                                <span className="text-[14px] text-[var(--text-secondary)] font-bold uppercase">{storeStatus.message}</span>
                            </div>
                        </div>

                        <nav className="flex flex-col gap-3">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={(e) => {
                                        handleNavClick(e, item.href);
                                        if (!item.href.startsWith('/#')) toggleMenu();
                                    }}
                                    className="text-[17px] font-display font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-elevated)] px-6 py-5 rounded-md border border-[var(--border-subtle)] transition-all flex items-center justify-between uppercase tracking-wider"
                                >
                                    {item.label}
                                    <span className="text-[12px] opacity-30">→</span>
                                </Link>
                            ))}
                        </nav>
                        <div className="mt-auto">
                            <button
                                onClick={() => { openWhatsAppLead({ intent: 'duvida_tecnica', description: 'Clique no Header (Mobile)' }); toggleMenu(); }}
                                disabled={waLoading}
                                className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-[13px] font-display font-bold uppercase tracking-wider text-white transition-all disabled:opacity-70"
                            >
                                {waLoading ? <Loader2 size={20} className="animate-spin" /> : <MessageSquare size={20} />}
                                FALAR COM TÉCNICO
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
        </>
    );
}
