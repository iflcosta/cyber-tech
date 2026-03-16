"use client";
import { useState } from "react";
import { Smartphone, HardDrive, Cpu, MessageSquare, Ticket, Menu, X as CloseIcon, Zap, ShieldCheck, ShoppingBag } from "lucide-react";
import LeadModal from "./LeadModal";
import { useCart } from "@/contexts/CartContext";
import { motion, AnimatePresence } from "framer-motion";

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
            <header className="fixed top-0 w-full z-[100] bg-black/95 backdrop-blur-xl border-b border-white/5">
                <LeadModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    interestType="voucher"
                />

                <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                            <span className="text-2xl font-black text-white italic">C</span>
                        </div>
                        <span className="text-xl font-bold tracking-tighter">CYBER <span className="text-blue-500">TECH</span></span>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-white/70">
                        {menuItems.map((item) => (
                            <a key={item.label} href={item.href} className="hover:text-white transition-colors">{item.label}</a>
                        ))}
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-bold transition-colors py-1 px-2 rounded-lg hover:bg-blue-500/5"
                        >
                            <Ticket size={16} />
                            <span className="leading-tight">Resgatar Brinde</span>
                        </button>

                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="relative p-2 text-white/80 hover:text-white transition-colors group"
                        >
                            <ShoppingBag size={24} className="group-hover:scale-110 transition-transform" />
                            {totalItems > 0 && (
                                <span className="absolute 0 right-0 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center -translate-y-1 translate-x-1 border border-black">
                                    {totalItems}
                                </span>
                            )}
                        </button>
                    </nav>

                    {/* Mobile Actions */}
                    <div className="flex items-center gap-2 md:gap-4">
                        <a
                            href="https://wa.me/5511999999999"
                            target="_blank"
                            className="hidden sm:block bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-blue-600/20"
                        >
                            WhatsApp
                        </a>

                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="md:hidden relative p-2 text-white/80 hover:text-white transition-colors"
                        >
                            <ShoppingBag size={24} />
                            {totalItems > 0 && (
                                <span className="absolute top-1 right-1 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-black">
                                    {totalItems}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={toggleMenu}
                            className="md:hidden text-white p-2"
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
                            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            // bg-[#050505] força a cor escura sólida. A classe backdrop-blur foi removida do container principal.
                            className="fixed right-0 top-0 h-full w-[80%] max-w-sm bg-[#050505] shadow-[-10px_0_30px_rgba(0,0,0,0.8)] border-l border-white/10 z-[120] p-6 flex flex-col"
                        >
                            <div className="flex justify-between items-center mb-10 mt-safe">
                                <span className="text-xl font-black italic tracking-tighter text-blue-500">CYBER MENU</span>
                                <button onClick={toggleMenu} className="w-10 h-10 bg-white/5 rounded-full flex justify-center items-center text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                                    <CloseIcon size={20} />
                                </button>
                            </div>

                            <nav className="flex flex-col gap-4 text-base font-bold flex-1">
                                {menuItems.map((item) => (
                                    <a
                                        key={item.label}
                                        href={item.href}
                                        onClick={toggleMenu}
                                        className="text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-4 rounded-xl transition-all flex items-center justify-between"
                                    >
                                        {item.label}
                                    </a>
                                ))}

                                <button
                                    onClick={() => { setIsModalOpen(true); toggleMenu(); }}
                                    className="flex items-center justify-center gap-3 text-blue-400 font-black py-4 mt-4 bg-blue-500/10 border border-blue-500/20 rounded-xl"
                                >
                                    <Ticket size={20} />
                                    RESGATAR BRINDE
                                </button>
                            </nav>

                            <div className="mt-auto pt-6 border-t border-white/10">
                                <a
                                    href="https://wa.me/5511999999999"
                                    target="_blank"
                                    className="bg-blue-600 text-white w-full py-4 mb-safe rounded-xl flex items-center justify-center gap-2 font-black shadow-lg shadow-blue-600/20"
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
