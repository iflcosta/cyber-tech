"use client";
import { useState } from 'react';
import { Cpu, CircuitBoard, Smartphone, MonitorPlay, Check, Rocket, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import LeadModal from './LeadModal';

const CPUS = [
    { id: 'start', label: 'Básico (Home/Office)', desc: 'Intel i3 ou Ryzen 3', price: 800, score: 1 },
    { id: 'mid', label: 'Intermediário (Gamer)', desc: 'Intel i5 ou Ryzen 5', price: 1400, score: 2 },
    { id: 'high', label: 'Profissional (Stream/Edit)', desc: 'Intel i7 ou Ryzen 7', price: 2200, score: 3 },
    { id: 'ultra', label: 'Extremo (Workstation)', desc: 'Intel i9 ou Ryzen 9', price: 3500, score: 4 },
];

const GPUS = [
    { id: 'integrated', label: 'Integrada (Somente Vídeo)', desc: 'Gráficos do Processador', price: 0, score: 0 },
    { id: 'entry', label: 'Entrada (Jogos Leves)', desc: 'GTX 1650 / RX 6400', price: 1100, score: 1 },
    { id: 'mid', label: 'Performance (Full HD/2K)', desc: 'RTX 3060 / 4060', price: 2300, score: 2 },
    { id: 'high', label: 'Ultra (4K/Competitivo)', desc: 'RTX 4070 / 4080', price: 4500, score: 3 },
];

const RAMS = [
    { id: '8gb', label: '8GB (Básico)', price: 150, score: 1 },
    { id: '16gb', label: '16GB (Padrão Gamer)', price: 300, score: 2 },
    { id: '32gb', label: '32GB (Profissional)', price: 600, score: 3 },
];

const GAMES = [
    { name: 'LoL / Valorant', minScore: 1 },
    { name: 'Fortnite / CS2', minScore: 2 },
    { name: 'GTA V / FIFA', minScore: 2 },
    { name: 'Warzone 2.0', minScore: 3 },
    { name: 'Cyberpunk 2077', minScore: 4 },
    { name: 'Renderização 3D', minScore: 5 },
];

export default function PCBuilder() {
    const [cpu, setCpu] = useState(CPUS[1]);
    const [gpu, setGpu] = useState(GPUS[1]);
    const [ram, setRam] = useState(RAMS[1]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const calculateTotal = () => {
        // Base cost (Case, PSU, SSD, Mobo estimate)
        const baseCost = 1500;
        return baseCost + cpu.price + gpu.price + ram.price;
    };

    const calculateScore = () => {
        return cpu.score + gpu.score + (ram.score >= 2 ? 1 : 0);
    };

    const totalScore = calculateScore();
    const totalPrice = calculateTotal();
    const pcDescription = `Processador: ${cpu.desc}\nVídeo: ${gpu.desc}\nRAM: ${ram.label}\nEstimativa: R$ ${totalPrice.toLocaleString('pt-BR')}`;
    const selectedDescription = `Olá Iago, gostaria de um orçamento para este setup:\n\n- *Processador:* ${cpu.desc}\n- *Vídeo:* ${gpu.desc}\n- *RAM:* ${ram.label}\n\n*Estimativa:* R$ ${totalPrice.toLocaleString('pt-BR')}\n\nPode verificar a disponibilidade?`;

    return (
        <section id="monte-seu-pc" className="py-12 md:py-20 bg-black relative overflow-hidden">
            <LeadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                interestType="pc_build"
                customDescription={pcDescription}
                whatsappMessage={selectedDescription}
            />
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(37,99,235,0.1),_transparent_70%)] pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-10 md:mb-16">
                    <h2 className="text-4xl font-black mb-4 tracking-tighter uppercase italic">
                        MONTE SEU <span className="text-blue-500">SETUP</span>
                    </h2>
                    <p className="text-white/40 max-w-xl mx-auto">
                        Escolha o nível de performance que você deseja e receba uma estimativa personalizada.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Selectors */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* CPU Selection */}
                        <div className="space-y-3 sm:space-y-4">
                            <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                                <CircuitBoard className="text-blue-500" /> Processador (O Cérebro)
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                {CPUS.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => setCpu(option)}
                                        className={`p-3 sm:p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${cpu.id === option.id
                                            ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                                            : 'bg-white/5 border-white/10 hover:border-white/30 text-white/60'
                                            }`}
                                    >
                                        <div className="font-bold text-base sm:text-lg">{option.label}</div>
                                        <div className={`text-xs sm:text-sm ${cpu.id === option.id ? 'text-blue-200' : 'text-white/40'}`}>{option.desc}</div>
                                        {cpu.id === option.id && <div className="absolute top-2 right-2"><Check size={16} /></div>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* GPU Selection */}
                        <div className="space-y-3 sm:space-y-4">
                            <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                                <MonitorPlay className="text-purple-500" /> Placa de Vídeo (Os Gráficos)
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                {GPUS.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => setGpu(option)}
                                        className={`p-3 sm:p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${gpu.id === option.id
                                            ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]'
                                            : 'bg-white/5 border-white/10 hover:border-white/30 text-white/60'
                                            }`}
                                    >
                                        <div className="font-bold text-base sm:text-lg">{option.label}</div>
                                        <div className={`text-xs sm:text-sm ${gpu.id === option.id ? 'text-purple-200' : 'text-white/40'}`}>{option.desc}</div>
                                        {gpu.id === option.id && <div className="absolute top-2 right-2"><Check size={16} /></div>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* RAM Selection */}
                        <div className="space-y-3 sm:space-y-4">
                            <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                                <Cpu className="text-green-500" /> Memória RAM (Velocidade)
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                {RAMS.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => setRam(option)}
                                        className={`p-3 sm:p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${ram.id === option.id
                                            ? 'bg-green-600 border-green-500 text-white shadow-[0_0_20px_rgba(22,163,74,0.3)]'
                                            : 'bg-white/5 border-white/10 hover:border-white/30 text-white/60'
                                            }`}
                                    >
                                        <div className="font-bold text-base sm:text-lg">{option.label}</div>
                                        {ram.id === option.id && <div className="absolute top-2 right-2"><Check size={16} /></div>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Summary Panel */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-20 md:top-24 bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-8 backdrop-blur-xl">
                            <h3 className="text-xl md:text-2xl font-black italic mb-4 md:mb-6 border-b border-white/10 pb-3 md:pb-4">
                                RESUMO DO <span className="text-blue-500">SETUP</span>
                            </h3>

                            <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                                <div className="flex justify-between items-center text-xs md:text-sm">
                                    <span className="text-white/60">Processador</span>
                                    <span className="font-bold text-white text-right max-w-[60%]">{cpu.desc}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs md:text-sm">
                                    <span className="text-white/60">VGA</span>
                                    <span className="font-bold text-white text-right max-w-[60%]">{gpu.desc}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs md:text-sm">
                                    <span className="text-white/60">RAM</span>
                                    <span className="font-bold text-white">{ram.label}</span>
                                </div>
                            </div>

                            <div className="bg-black/40 rounded-xl p-4 mb-6 md:mb-8">
                                <div className="text-[10px] md:text-xs text-white/40 uppercase font-bold tracking-widest mb-1">Estimativa de Investimento</div>
                                <div className="text-2xl md:text-3xl font-black text-white">
                                    ~ R$ {totalPrice.toLocaleString('pt-BR')}
                                </div>
                                <div className="text-[10px] md:text-xs text-white/30 mt-2 leading-tight">*Valor aproximado. Pode variar.</div>
                            </div>

                            <div className="space-y-3 mb-6 md:mb-8">
                                <div className="text-[10px] md:text-xs text-white/40 uppercase font-bold tracking-widest mb-2">Performance:</div>
                                <div className="flex flex-wrap gap-1.5 md:gap-2">
                                    {GAMES.filter(g => totalScore >= g.minScore).map((game, idx) => (
                                        <span key={idx} className="bg-green-500/20 text-green-400 text-[10px] md:text-xs font-bold px-2 py-1 rounded border border-green-500/20 flex items-center gap-1">
                                            <Check size={10} /> {game.name}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-3 md:py-4 rounded-xl transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 text-sm md:text-base mb-1"
                            >
                                <Rocket size={18} />
                                ENVIAR PARA ORÇAMENTO
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
