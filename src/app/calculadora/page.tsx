"use client";
import Header from "@/components/Header";
import FixBuyCalculator from "@/components/FixBuyCalculator";
import CyberIA from "@/components/CyberIA";
import { Zap, Info, ShieldAlert } from 'lucide-react';

export default function CalculatorPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      <Header />
      
      <div className="pt-32 pb-24 container mx-auto px-4">
        <div className="max-w-4xl mx-auto mb-16 text-center">
          <div className="flex items-center justify-center gap-2 text-[var(--accent-primary)] text-[10px] font-mono font-bold uppercase tracking-[0.4em] mb-6">
            <Zap size={14} fill="currentColor" />
            <span>ALGORITMO DE DECISÃO TÉCNICA</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tighter chrome-text mb-8">
            VALE A PENA <br />
            <span className="opacity-40 italic">CONSERTAR?</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm font-medium max-w-2xl mx-auto leading-relaxed">
            Não tome decisões financeiras no escuro. Use nossa calculadora inteligente para descobrir se o seu equipamento ainda tem vida útil ou se é hora de um upgrade definitivo.
          </p>
        </div>

        <FixBuyCalculator />

        {/* Info Grid */}
        <div className="max-w-4xl mx-auto mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl">
            <ShieldAlert size={24} className="text-[var(--accent-primary)] mb-6" />
            <h4 className="text-[10px] font-mono font-black uppercase tracking-widest text-[var(--text-primary)] mb-4">Regra dos 50%</h4>
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase leading-relaxed tracking-wider">
              Se o custo do reparo ultrapassar metade do valor de um novo, a substituição é quase sempre a melhor opção financeira a longo prazo.
            </p>
          </div>
          <div className="p-8 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl">
            <Zap size={24} className="text-[var(--accent-primary)] mb-6" />
            <h4 className="text-[10px] font-mono font-black uppercase tracking-widest text-[var(--text-primary)] mb-4">Ciclo de 5 Anos</h4>
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase leading-relaxed tracking-wider">
              A tecnologia evolui rápido. Após 5 anos, componentes como capacitores e baterias entram em zona crítica de falha em cascata.
            </p>
          </div>
          <div className="p-8 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl">
            <Info size={24} className="text-[var(--accent-primary)] mb-6" />
            <h4 className="text-[10px] font-mono font-black uppercase tracking-widest text-[var(--text-primary)] mb-4">Veredito Real</h4>
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase leading-relaxed tracking-wider">
              Nossa ferramenta é uma estimativa. Traga o equipamento para um diagnóstico físico e receba o veredito definitivo de um técnico.
            </p>
          </div>
        </div>
      </div>

      <footer className="py-12 bg-[var(--bg-primary)] border-t border-[var(--border-subtle)] text-center">
        <p className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-widest">
           Cyber Informática &copy; {new Date().getFullYear()} - Bragança Paulista/SP
        </p>
      </footer>

      <CyberIA />
    </main>
  );
}
