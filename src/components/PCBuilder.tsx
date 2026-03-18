"use client";

import { useState, useEffect } from 'react';
import { Cpu, CircuitBoard, MonitorPlay, Zap, HardDrive, Package, MessageSquare, RefreshCcw, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { BuildSlot } from './BuildSlot';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { brand } from '@/lib/brand';
import { BUILDER_TIERS } from '@/lib/builder/tiers';

const SLOTS = [
  { id: 'cpu', label: 'Processador', icon: <Cpu size={14} />, tiers: BUILDER_TIERS.cpu },
  { id: 'gpu', label: 'Placa de Vídeo', icon: <MonitorPlay size={14} />, tiers: BUILDER_TIERS.gpu },
  { id: 'mobo', label: 'Placa-Mãe', icon: <CircuitBoard size={14} />, tiers: BUILDER_TIERS.mobo },
  { id: 'ram', label: 'Memória RAM', icon: <Zap size={14} />, tiers: BUILDER_TIERS.ram },
  { id: 'storage', label: 'Armazenamento', icon: <HardDrive size={14} />, tiers: BUILDER_TIERS.storage },
  { id: 'psu', label: 'Fonte (PSU)', icon: <Zap size={14} />, tiers: BUILDER_TIERS.psu },
  { id: 'case', label: 'Gabinete', icon: <Package size={14} />, tiers: BUILDER_TIERS.case },
];

export default function PCBuilder() {
  const [build, setBuild] = useState<Record<string, any>>({});
  const [mounted, setMounted] = useState(false);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cyber-builder-v3');
    if (saved) {
      try {
        setBuild(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load build", e);
      }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('cyber-builder-v3', JSON.stringify(build));
    }
  }, [build, mounted]);

  const handleSelect = (slotId: string, tier: any) => {
    setBuild(prev => ({ ...prev, [slotId]: tier }));
    setActiveSlot(null);
  };

  const handleClear = (slotId: string) => {
    const newBuild = { ...build };
    delete newBuild[slotId];
    setBuild(newBuild);
  };

  const resetBuild = () => {
    setBuild({});
    localStorage.removeItem('cyber-builder-v3');
  };

  const laborCost = brand.builder?.laborCost || 150;
  const partsTotal = Object.values(build).reduce((acc, comp) => acc + (comp.price || 0), 0);
  const estimatedTotal = partsTotal + (partsTotal > 0 ? laborCost : 0);

  const generateWhatsAppLink = () => {
    let message = "Olá! Gostaria de um orçamento para montagem de PC:\n\n*Componentes selecionados:*\n";
    
    SLOTS.forEach(slot => {
      const selected = build[slot.id];
      if (selected) {
        message += `• ${slot.label}: ${selected.model} (~R$ ${selected.price})\n`;
      }
    });

    message += `\n*Estimativa de peças:* R$ ${partsTotal.toFixed(2)}`;
    message += `\n*Mão de obra:* ~R$ ${laborCost}`;
    message += `\n*Total estimado:* R$ ${estimatedTotal.toFixed(2)}`;
    message += `\n\nPodem verificar disponibilidade?`;

    return `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(message)}`;
  };

  if (!mounted) return null;

  return (
    <section id="monte-seu-pc" className="py-24 bg-[#F0EFED] relative min-h-screen hero-texture">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Builder Grid */}
          <div className="flex-1 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-[#1A1A1A] leading-nãone mb-4">
                  SIMULADOR <br />
                  <span className="text-outline">DE MONTAGEM</span>
                </h2>
                <div className="flex items-center gap-2 text-[#888888] text-[10px] font-bold uppercase tracking-widest">
                  <Info size={14} />
                  <span>Configuração educativa para estimativa de mercado</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={resetBuild} className="gap-2 self-start">
                <RefreshCcw size={14} /> RECOMECAR
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {SLOTS.map((slot) => (
                <div key={slot.id} className="space-y-4">
                  <BuildSlot
                    label={slot.label}
                    icon={slot.icon}
                    selected={build[slot.id]}
                    onSelect={() => setActiveSlot(activeSlot === slot.id ? null : slot.id)}
                    onClear={() => handleClear(slot.id)}
                  />
                  
                  {activeSlot === slot.id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="grid grid-cols-1 gap-2 pl-4 border-l-2 border-[#D4D2CF] overflow-hidden"
                    >
                      {slot.tiers.map((tier: any) => (
                        <button
                          key={tier.id}
                          onClick={() => handleSelect(slot.id, tier)}
                          className={`flex items-center justify-between p-3 text-left transition-all duration-130 border hover:border-[#1A1A1A] ${
                            build[slot.id]?.id === tier.id ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" : "bg-white text-[#555555] border-[#ECEAE6]"
                          }`}
                        >
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest leading-nãone mb-1">{tier.label}</div>
                            <div className="text-xs font-medium">{tier.model}</div>
                          </div>
                          <div className="text-xs font-bold">R$ {tier.price}</div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:w-96">
            <div className="sticky top-24 space-y-4">
              <Card className="border-[#1A1A1A] shadow-nãone">
                <CardContent className="p-8">
                  <h3 className="text-xl font-display font-bold tracking-tight mb-8">
                    RESUMO DO ORÇAMENTO
                  </h3>

                  <div className="space-y-4 mb-8">
                    {SLOTS.map(slot => build[slot.id] && (
                      <div key={slot.id} className="flex justify-between text-[10px] uppercase font-bold tracking-widest">
                        <span className="text-[#888888]">{slot.label}</span>
                        <span className="text-[#1A1A1A]">R$ {build[slot.id].price}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4 pt-6 border-t border-[#D4D2CF]">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#555555] font-bold uppercase tracking-widest">Subtotal Peças</span>
                      <span className="font-bold text-[#1A1A1A]">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(partsTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#555555] font-bold uppercase tracking-widest">Mão de Obra</span>
                      <span className="font-bold text-[#1A1A1A]">
                        ~ {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(laborCost)}
                      </span>
                    </div>
                    <div className="flex justify-between items-end pt-4">
                      <span className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Estimativa total</span>
                      <span className="text-3xl font-display font-bold text-[#1A1A1A]">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimatedTotal)}
                      </span>
                    </div>
                  </div>

                  <a 
                    href={generateWhatsAppLink()}
                    target="_blank"
                    className={`w-full mt-8 btn-primary flex items-center justify-center gap-2 py-4 ${
                      Object.keys(build).length === 0 ? "opacity-30 pointer-events-nãone" : ""
                    }`}
                  >
                    <MessageSquare size={18} /> CONSULTAR DISPONIBILIDADE
                  </a>
                </CardContent>
              </Card>

              <div className="p-6 bg-[#F8F7F5] border border-[#D4D2CF] rounded-[2px] border-dashed">
                 <p className="text-[10px] text-[#888888] leading-relaxed uppercase font-light tracking-wide">
                   Valores estimados de mercado. Sujeito a disponibilidade na loja. Confirme preço final via WhatsApp ou presencialmente.
                 </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
