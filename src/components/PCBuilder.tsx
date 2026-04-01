"use client";
import { useState, useEffect, useMemo } from 'react';
import { Cpu, CircuitBoard, MonitorPlay, Zap, HardDrive, Package, RefreshCcw, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BuildSlot } from './BuildSlot';
import { brand } from '@/lib/brand';
import { getProducts, Product } from '@/lib/products';
import { useLeadModal } from '@/contexts/LeadModalContext';

import { getSimulatorOptions, calculateProfile, PCBuilderOption } from '@/lib/pcBuilderData';

const SLOTS = [
  { id: 'cpu', label: 'Processador', icon: <Cpu size={14} /> },
  { id: 'gpu', label: 'Placa de Vídeo', icon: <MonitorPlay size={14} /> },
  { id: 'ram', label: 'Memória RAM', icon: <Zap size={14} /> },
  { id: 'storage', label: 'Armazenamento (SSD)', icon: <HardDrive size={14} /> },
];

export default function PCBuilder() {
  const { openModal } = useLeadModal();
  const [build, setBuild] = useState<Record<string, PCBuilderOption>>({});
  const [options, setOptions] = useState<PCBuilderOption[]>([]);
  const [mounted, setMounted] = useState(false);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);

  useEffect(() => {
    // Scroll to section if hash is present (handles direct navigation from other pages)
    if (typeof window !== 'undefined' && window.location.hash === '#pc-builder') {
      setTimeout(() => {
        document.getElementById('pc-builder')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }

    async function init() {
      try {
        const data = await getSimulatorOptions();
        setOptions(data);
      } catch (error) {
        console.error('Error loading simulator options:', error);
      } finally {
        setMounted(true);
      }
    }
    init();
  }, []);

  const filteredParts = useMemo(() => {
    if (!activeSlot) return [];
    return options.filter(opt => opt.category === activeSlot);
  }, [activeSlot, options]);

  const handleSelect = (slotId: string, option: PCBuilderOption) => {
    setBuild(prev => ({ ...prev, [slotId]: option }));
    setActiveSlot(null);
  };

  // Price calculations hidden for now as per user request
  const laborCost = 0;
  const estimatedTotal = 0;

  const buyerProfile = useMemo(() => calculateProfile(build), [build]);

  const handleConsultation = () => {
    const buildSummary = Object.entries(build)
      .map(([key, p]) => `${SLOTS.find(s => s.id === key)?.label}: ${p.name}`)
      .join(' | ');
    
    const whatsappMsg = `Olá! Simulei um perfil de PC na Cyber:\n\n` + 
      `*Perfil:* ${buyerProfile.profile}\n` +
      Object.entries(build).map(([key, p]) => `• *${SLOTS.find(s => s.id === key)?.label}:* ${p.name}`).join('\n') + 
      `\n\nNota: Sei que a Placa-Mãe e Fonte serão selecionadas pela equipe técnica de acordo com esse setup. Podem me ajudar com um orçamento?`;

    openModal('compra', `PERFIL SIMULADO: ${buyerProfile.profile} | ${buildSummary}`, whatsappMsg, []);
  };

  return (
    <section id="pc-builder" className="py-24 bg-[var(--bg-primary)] relative min-h-screen hero-texture red-line-top">
      {!mounted ? (
        <div className="container mx-auto px-4 flex h-[600px] items-center justify-center">
          <div className="animate-pulse text-[var(--text-muted)] font-mono text-xs uppercase tracking-widest">Iniciando Simulador...</div>
        </div>
      ) : (
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Builder Grid */}
            <div className="flex-1 space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h2 className="text-5xl md:text-6xl font-display font-bold tracking-tight text-[var(--text-primary)] leading-none mb-4 chrome-text">
                    SIMULADOR <br />
                    <span className="opacity-40 italic">DE PERFIL</span>
                  </h2>
                  <p className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-[0.2em]">
                    Selecione as categorias para encontrarmos sua configuração ideal.
                  </p>
                </div>
                <button 
                  onClick={() => setBuild({})} 
                  className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
                >
                  <RefreshCcw size={14} /> RECOMEÇAR SETUP
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                {SLOTS.map((slot) => (
                  <div key={slot.id} className="card-dark relative">
                    <BuildSlot
                      label={slot.label}
                      icon={slot.icon}
                      selected={build[slot.id]}
                      onSelect={() => setActiveSlot(activeSlot === slot.id ? null : slot.id)}
                      onClear={() => {
                          const newBuild = { ...build };
                          delete newBuild[slot.id];
                          setBuild(newBuild);
                      }}
                    />
                    
                    <AnimatePresence>
                      {activeSlot === slot.id && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="absolute left-0 right-0 top-full mt-4 z-40 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-2xl p-2 max-h-[300px] overflow-y-auto scrollbar-thin overflow-x-hidden"
                        >
                          {filteredParts.length === 0 ? (
                              <div className="p-8 text-center text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-widest">
                                  Opções indisponíveis.
                              </div>
                          ) : filteredParts.map((part) => (
                              <button
                                key={part.id}
                                onClick={() => handleSelect(slot.id, part)}
                                className={`w-full flex items-center justify-between p-4 mb-1 text-left rounded-lg transition-all border ${
                                  build[slot.id]?.id === part.id 
                                  ? "bg-[var(--accent-glow)] border-[var(--accent-primary)] text-white"
                                  : "bg-[var(--bg-surface)] text-[var(--text-primary)] border-transparent hover:border-[var(--border-active)] hover:bg-[var(--bg-elevated)]"
                                }`}
                              >
                                <div className="flex-1 pr-4">
                                  <div className="text-xs font-bold font-display uppercase truncate">{part.name}</div>
                                  {part.description && <div className="text-[9px] font-mono opacity-50 uppercase mt-0.5">{part.description}</div>}
                                </div>
                              </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar Summary */}
            <div className="lg:w-[400px]">
              <div className="sticky top-32">
                <div className="card-dark bg-[var(--bg-surface)] rounded-2xl overflow-hidden shadow-2xl">
                  {/* Barra de acento vermelha */}
                  <div className="h-[3px] bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent" />
                  <div className="p-8 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50">
                    <p className="text-[9px] font-mono font-bold text-[var(--accent-primary)] uppercase tracking-[0.2em] mb-1">Perfil Sugerido</p>
                    <h3 className={`text-2xl font-display font-bold tracking-[0.05em] uppercase ${buyerProfile.color}`}>
                      {buyerProfile.profile}
                    </h3>
                  </div>

                  <div className="p-8 space-y-6">
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-none">
                      {SLOTS.map(slot => build[slot.id] && (
                        <div key={slot.id} className="group">
                          <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase group-hover:text-[var(--accent-primary)] transition-colors leading-tight">
                              {build[slot.id].name}
                          </div>
                        </div>
                      ))}
                      {Object.keys(build).length === 0 && (
                          <div className="py-12 text-center text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-widest border border-dashed border-[var(--border-subtle)] rounded-xl">
                              Aguardando seleção...
                          </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-[var(--border-subtle)] space-y-4">
                      {/* Price summary hidden by request */}
                    </div>

                    <button 
                      onClick={handleConsultation}
                      disabled={Object.keys(build).length === 0}
                      className="w-full btn-primary py-4 px-8 flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale group"
                    >
                      <span className="text-sm font-display font-bold uppercase tracking-widest">Confirmar Disponibilidade</span>
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    
                    <p className="text-[10px] font-mono font-medium text-[var(--text-muted)] text-center leading-relaxed px-4">
                      *Preços estimados baseados na média de mercado. <br />
                      **A Placa-Mãe e Fonte serão selecionadas pela nossa equipe técnica para total compatibilidade.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
