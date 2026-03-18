"use client";
import { useState } from 'react';
import { Calculator, AlertTriangle, CheckCircle2, ShoppingCart, Wrench, ArrowRight, Info, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';

export default function FixBuyCalculator() {
  const [data, setData] = useState({
    type: 'notebook',
    age: 2,
    newValue: 3500,
    repairEstimate: 800,
  });
  const [result, setResult] = useState<null | { verdict: 'FIX' | 'BUY'; score: number; reason: string }>(null);

  const calculate = () => {
    const ratio = (data.repairEstimate / data.newValue) * 100;
    let verdict: 'FIX' | 'BUY' = 'FIX';
    let reason = "";
    let score = 0;

    if (ratio >= 50) {
      verdict = 'BUY';
      reason = "O custo do reparo ultrapassa 50% do valor de um novo. Investir em tecnologia atual é mais vantajoso.";
      score = 90;
    } else if (data.age >= 5 && ratio > 25) {
      verdict = 'BUY';
      reason = "Equipamento com mais de 5 anós tende a apresentar novas falhas em breve. O upgrade é recomendado.";
      score = 80;
    } else if (ratio < 30) {
      verdict = 'FIX';
      reason = "O custo de manutenção é baixo em relação ao valor do bem. O reparo preserva seu investimento.";
      score = 95;
    } else {
      verdict = 'FIX';
      reason = "Apesar do valor moderado, o equipamento ainda está dentro da vida útil produtiva.";
      score = 70;
    }

    setResult({ verdict, score, reason });
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl overflow-hidden shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Input Panel */}
          <div className="p-10 border-r border-[var(--border-subtle)] bg-[var(--bg-elevated)] space-y-8">
            <div className="flex items-center gap-3 mb-2">
              <Calculator className="text-[var(--accent-primary)]" size={20} />
              <h3 className="text-xl font-display font-bold uppercase tracking-widest chrome-text">Parâmetros</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-widest">Tipo de Dispositivo</label>
                <select 
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] appearance-none"
                  value={data.type}
                  onChange={(e) => setData({...data, type: e.target.value})}
                >
                  <option value="notebook">Notebook / Laptop</option>
                  <option value="desktop">Desktop / Gamer</option>
                  <option value="smartphone">Smartphone / Tablet</option>
                  <option value="macbook">MacBook / iMac</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-widest">Idade do Equipamento (Anos)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" min="0" max="10" 
                    className="flex-1 accent-[var(--accent-primary)]"
                    value={data.age}
                    onChange={(e) => setData({...data, age: parseInt(e.target.value)})}
                  />
                  <span className="font-mono font-bold text-[var(--accent-primary)] w-8 text-center">{data.age}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-widest">Valor de um Novo (R$)</label>
                <input 
                  type="number" 
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  placeholder="Ex: 3500"
                  value={data.newValue}
                  onChange={(e) => setData({...data, newValue: parseInt(e.target.value)})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-widest">Estimativa de Reparo (R$)</label>
                <input 
                  type="number" 
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  placeholder="Ex: 800"
                  value={data.repairEstimate}
                  onChange={(e) => setData({...data, repairEstimate: parseInt(e.target.value)})}
                />
              </div>

              <button 
                onClick={calculate}
                className="w-full btn-primary py-4 rounded-xl flex items-center justify-center gap-3 group"
              >
                <Zap size={18} fill="currentColor" />
                <span className="text-sm font-display font-bold uppercase tracking-widest">Rodar Diagnóstico</span>
              </button>
            </div>
          </div>

          {/* Result Panel */}
          <div className="p-10 flex flex-col justify-center bg-[var(--bg-surface)] relative overflow-hidden">
            <AnimatePresence mode="wait">
              {!result ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-center space-y-4"
                >
                  <div className="w-16 h-16 border-2 border-dashed border-[var(--border-subtle)] rounded-full flex items-center justify-center mx-auto opacity-20">
                    <Info size={24} />
                  </div>
                  <p className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-widest px-8">
                    Insira os dados técnicos para receber a recomendação oficial Cyber.
                  </p>
                </motion.div>
              ) : (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <span className={`inline-block px-4 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-[0.2em] mb-4 ${
                      result.verdict === 'FIX' ? 'bg-[var(--accent-success)] text-[var(--bg-primary)]' : 'bg-[var(--accent-primary)] text-[var(--bg-primary)]'
                    }`}>
                      Veredito: {result.verdict === 'FIX' ? 'CONSERTAR' : 'SUBSTITUIR'}
                    </span>
                    <h4 className="text-4xl font-display font-bold uppercase chrome-text">
                      {result.verdict === 'FIX' ? 'WORKFLOW REPARO' : 'UPGRADE STATUS'}
                    </h4>
                  </div>

                  <div className="p-6 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent-primary)] opacity-30" />
                    <p className="text-sm font-medium text-[var(--text-secondary)] leading-relaxed italic">
                      "{result.reason}"
                    </p>
                  </div>

                  <div className="space-y-4">
                    {result.verdict === 'FIX' ? (
                      <button className="w-full btn-primary py-5 px-8 rounded-xl flex items-center justify-between group">
                        <span className="text-xs font-display font-bold uppercase tracking-widest">Solicitar Orçamento Grátis</span>
                        <Wrench size={18} className="group-hover:rotate-12 transition-transform" />
                      </button>
                    ) : (
                      <button className="w-full btn-primary py-5 px-8 rounded-xl flex items-center justify-between group bg-[var(--text-primary)] text-[var(--bg-primary)] border-transparent">
                        <span className="text-xs font-display font-bold uppercase tracking-widest">Ver Novos Equipamentos</span>
                        <ShoppingCart size={18} className="group-hover:scale-110 transition-transform" />
                      </button>
                    )}
                  </div>

                  <p className="text-[9px] font-mono font-bold text-[var(--text-muted)] text-center uppercase tracking-tighter opacity-50">
                    *Análise baseada em algoritmos de depreciação e custo-benefício.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
