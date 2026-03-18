"use client";
import { useState } from "react";
import { Smartphone, HardDrive, Cpu, MessageSquare, Ticket, Menu, X as CloseIcon, Zap, ShieldCheck, ShoppingBag } from "lucide-react";
import LeadModal from "./LeadModal";
import { useCart } from "@/contexts/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { brand } from "@/lib/brand";

export default function Header() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { totalItems, setIsCartOpen } = useCart();

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const menuItems = [
        { label: "Assistência", href: "#assistencia" },
        { label: "Kits Gamer", href: "#kits" },
        { label: "Monte seu PC", href: "#monte-seu-pc" },
        { label: "Consultar Status", href: "#consultar-status" },
    ];

    return (
        <>
        <header className="fixed top-0 w-full z-[100] bg-white/95 backdrop-blur-xl border-b border-[#D4D2CF]">
            <LeadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                interestType="voucher"
            />

            <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 overflow-hidden" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                        <img 
                            src="file:///C:/Users/User/.gemini/antigravity/brain/250ba7d9-697e-4b5a-8c54-73ffbe615991/media__1773775060477.jpg" 
                            alt="Cyber Informática" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-display font-bold tracking-[0.1em] text-[#1A1A1A] leading-none">CYBER</span>
                        <span className="text-[10px] font-light tracking-[0.22em] text-[#555555] uppercase">Informática</span>
                    </div>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8 text-[10px] font-display font-bold text-[#555555] uppercase tracking-[0.15em]">
                    {menuItems.map((item) => (
                        <a key={item.label} href={item.href} className="hover:text-[#1A1A1A] transition-colors">{item.label}</a>
                    ))}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 text-[#1A1A1A] hover:text-[#333333] font-bold transition-colors py-1 px-2 border border-transparent hover:border-[#D4D2CF]"
                    >
                        <Ticket size={14} />
                        <span>Resgatar Brinde</span>
                    </button>

                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="relative p-2 text-[#555555] hover:text-[#1A1A1A] transition-colors group"
                    >
                        <ShoppingBag size={20} className="group-hover:scale-110 transition-transform" />
                        {totalItems > 0 && (
                            <span className="absolute top-0 right-0 bg-[#1A1A1A] text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center -translate-y-1 translate-x-1">
                                {totalItems}
                            </span>
                        )}
                    </button>
                </nav>

                {/* Mobile Actions */}
                <div className="flex items-center gap-2 md:gap-4">
                    <a
                        href={`https://wa.me/${brand.whatsapp}`}
                        target="_blank"
                        className="hidden sm:block bg-[#1A1A1A] hover:bg-[#333333] text-white px-6 py-2 rounded-[2px] text-[10px] font-display font-bold uppercase tracking-[0.15em] transition-all"
                    >
                        WhatsApp
                    </a>

                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="md:hidden relative p-2 text-[#555555] hover:text-[#1A1A1A] transition-colors"
                    >
                        <ShoppingBag size={20} />
                        {totalItems > 0 && (
                            <span className="absolute top-0 right-0 bg-[#1A1A1A] text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                {totalItems}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={toggleMenu}
                        className="md:hidden text-[#1A1A1A] p-2"
                    >
                        <Menu size={24} />
                    </button>
                </div>
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
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        className="fixed right-0 top-0 h-full w-[80%] max-w-sm bg-white border-l border-[#D4D2CF] z-[120] p-6 flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-10 mt-safe">
                            <span className="text-xl font-display font-bold tracking-[0.1em] text-[#1A1A1A]">MENU</span>
                            <button onClick={toggleMenu} className="w-10 h-10 bg-[#F0EFED] rounded-[2px] flex justify-center items-center text-[#555555] hover:text-[#1A1A1A] transition-colors">
                                <CloseIcon size={20} />
                            </button>
                        </div>

                        <nav className="flex flex-col gap-4 text-[10px] font-display font-bold flex-1 uppercase tracking-[0.15em]">
                            {menuItems.map((item) => (
                                <a
                                    key={item.label}
                                    href={item.href}
                                    onClick={toggleMenu}
                                    className="text-[#555555] hover:text-[#1A1A1A] bg-[#F8F7F5] px-4 py-4 border border-[#ECEAE6] transition-all flex items-center justify-between"
                                >
                                    {item.label}
                                </a>
                            ))}

                            <button
                                onClick={() => { setIsModalOpen(true); toggleMenu(); }}
                                className="flex items-center justify-center gap-3 text-[#1A1A1A] font-bold py-4 mt-4 bg-white border border-[#D4D2CF]"
                            >
                                <Ticket size={18} />
                                RESGATAR BRINDE
                            </button>
                        </nav>

                        <div className="mt-auto pt-6 border-t border-[#D4D2CF]">
                            <a
                                href={`https://wa.me/${brand.whatsapp}`}
                                target="_blank"
                                className="bg-[#1A1A1A] text-white w-full py-4 mb-safe rounded-[2px] flex items-center justify-center gap-2 font-display font-bold uppercase tracking-[0.15em]"
                            >
                                <MessageSquare size={20} />
                                WPP DA LOJA
                            </a>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
        </>
    );
}
