"use client";
import { useState, useEffect, useMemo } from 'react';
import { Cpu, CircuitBoard, MonitorPlay, Zap, HardDrive, Package, RefreshCcw, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BuildSlot } from './BuildSlot';
import { brand } from '@/lib/brand';
import { getProducts, Product } from '@/lib/products';
import { useLeadModal } from '@/contexts/LeadModalContext';

const SLOTS = [
  { id: 'cpu', label: 'Processador', icon: <Cpu size={14} />, categories: ['hardware'], keywords: ['intel', 'amd', 'ryzen', 'core i'] },
  { id: 'gpu', label: 'Placa de Vídeo', icon: <MonitorPlay size={14} />, categories: ['hardware'], keywords: ['rtx', 'rx', 'gtx', 'geforce', 'radeon'] },
  { id: 'mobo', label: 'Placa-Mãe', icon: <CircuitBoard size={14} />, categories: ['hardware'], keywords: ['placa-mãe', 'motherboard', 'b660', 'b550', 'z690', 'a520'] },
  { id: 'ram', label: 'Memória RAM', icon: <Zap size={14} />, categories: ['hardware'], keywords: ['memória', 'ram', 'ddr4', 'ddr5'] },
  { id: 'storage', label: 'Armazenamento', icon: <HardDrive size={14} />, categories: ['hardware'], keywords: ['ssd', 'hd', 'nvme', 'sata'] },
  { id: 'psu', label: 'Fonte (PSU)', icon: <Zap size={14} />, categories: ['hardware'], keywords: ['fonte', 'psu', '600w', '750w', '80w'] },
  { id: 'case', label: 'Gabinete', icon: <Package size={14} />, categories: ['hardware', 'peripheral'], keywords: ['gabinete', 'case', 'tower'] },
];

export default function PCBuilder() {
  const { openModal } = useLeadModal();
  const [products, setProducts] = useState<Product[]>([]);
  const [build, setBuild] = useState<Record<string, Product>>({});
  const [mounted, setMounted] = useState(false);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getProducts();
        setProducts(data);
        
        const saved = localStorage.getItem('cyber-builder-v3');
        if (saved) {
          const parsed = JSON.parse(saved);
          // Only keep items that still exist and have stock
          const validBuild: Record<string, Product> = {};
          Object.entries(parsed).forEach(([key, val]: [string, any]) => {
            const found = data.find(p => p.id === val.id);
            if (found) validBuild[key] = found;
          });
          setBuild(validBuild);
        }
      } finally {
        setMounted(true);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('cyber-builder-v3', JSON.stringify(build));
    }
  }, [build, mounted]);

  const filteredParts = useMemo(() => {
    if (!activeSlot) return [];
    const slot = SLOTS.find(s => s.id === activeSlot);
    if (!slot) return [];

    return products.filter(p => {
      const isVisible = p.show_in_pcbuilder;
      const inCategory = slot.categories.includes(p.category);
      const hasKeyword = slot.keywords.some(k => p.name.toLowerCase().includes(k));
      return isVisible && inCategory && hasKeyword && (p.stock_quantity ?? 0) > 0;
    }).sort((a, b) => a.price - b.price);
  }, [activeSlot, products]);

  const handleSelect = (slotId: string, part: Product) => {
    setBuild(prev => ({ ...prev, [slotId]: part }));
    setActiveSlot(null);
  };

  const laborCost = brand.builder?.laborCost || 150;
  const partsTotal = Object.values(build).reduce((acc, p) => acc + (p.price || 0), 0);
  const estimatedTotal = partsTotal + (partsTotal > 0 ? laborCost : 0);

  const handleConsultation = () => {
    const buildSummary = Object.entries(build)
      .map(([key, p]) => `${SLOTS.find(s => s.id === key)?.label}: ${p.name}`)
      .join(' | ');
    
    const whatsappMsg = `Olá! Montei um setup no simulador da Cyber:\n\n` + 
      Object.entries(build).map(([key, p]) => `• *${SLOTS.find(s => s.id === key)?.label}:* ${p.name}`).join('\n') + 
      `\n\n*Total Estimado:* R$ ${estimatedTotal.toLocaleString('pt-BR')}\n\nPodem confirmar disponibilidade?`;

    openModal('compra', `BUILD SIMULADA: ${buildSummary}`, whatsappMsg, Object.values(build).map(p => p.id));
  };

  if (!mounted) return null;

  return (
    <section id="pc-builder" className="py-24 bg-[var(--bg-primary)] relative min-h-screen hero-texture red-line-top">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Builder Grid */}
          <div className="flex-1 space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-5xl md:text-6xl font-display font-bold tracking-tight text-[var(--text-primary)] leading-none mb-4 chrome-text">
                  SIMULADOR <br />
                  <span className="opacity-40 italic">DE PERFORMANCE</span>
                </h2>
                <div className="flex items-center gap-2 text-[var(--text-muted)] text-[10px] font-mono font-bold uppercase tracking-[0.2em]">
                  <Zap size={14} className="text-[var(--accent-primary)]" />
                  <span>ESTOQUE REAL ATUALIZADO EM TEMPO REAL</span>
                </div>
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
                                Sem itens compatíveis no estoque.
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
                                <div className="text-[10px] font-mono font-bold uppercase tracking-tighter opacity-60 mb-1">
                                    {part.sku || 'N/A'}
                                </div>
                                <div className="text-xs font-bold font-display uppercase truncate">{part.name}</div>
                              </div>
                              <div className="text-xs font-mono font-black">R$ {part.price.toLocaleString('pt-BR')}</div>
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
                <div className="p-8 border-b border-[var(--border-subtle)]">
                  <h3 className="text-lg font-display font-bold tracking-[0.1em] uppercase chrome-text">
                    RELATÓRIO DE MONTAGEM
                  </h3>
                </div>

                <div className="p-8 space-y-6">
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-none">
                    {SLOTS.map(slot => build[slot.id] && (
                      <div key={slot.id} className="group">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">{slot.label}</span>
                          <span className="text-xs font-mono font-bold text-[var(--text-primary)]">R$ {build[slot.id].price.toLocaleString('pt-BR')}</span>
                        </div>
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

                  <div className="pt-8 border-t border-[var(--border-subtle)] space-y-4">
                    <div className="flex justify-between text-[10px] font-mono font-bold uppercase tracking-[0.1em]">
                      <span className="text-[var(--text-muted)]">Custo de Hardware</span>
                      <span className="text-[var(--text-primary)]">R$ {partsTotal.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono font-bold uppercase tracking-[0.1em]">
                      <span className="text-[var(--text-muted)]">Laboratório Técnica</span>
                      <span className="text-[var(--text-primary)]">~ R$ {laborCost.toLocaleString('pt-BR')}</span>
                    </div>
                    
                    <div className="pt-6 relative">
                        <div className="absolute inset-x-0 -top-2 flex justify-center">
                            <span className="bg-[var(--bg-surface)] px-3 text-[9px] font-mono font-bold text-[var(--accent-primary)] tracking-widest">ESTIMATIVA TOTAL</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                            <span className="text-[var(--text-muted)] font-mono text-xs font-bold uppercase">BRL</span>
                            <span className="text-5xl font-display font-bold text-[var(--text-primary)] chrome-text">
                                {estimatedTotal.toLocaleString('pt-BR')}
                            </span>
                        </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleConsultation}
                    disabled={Object.keys(build).length === 0}
                    className="w-full btn-primary py-5 px-8 flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale group"
                  >
                    <span className="text-sm font-display font-bold uppercase tracking-widest">Confirmar Disponibilidade</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  
                  <p className="text-[10px] font-mono font-medium text-[var(--text-muted)] text-center leading-relaxed px-4">
                    *Preços podem variar conforme cotação do dólar e reposição de estoque diária.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
