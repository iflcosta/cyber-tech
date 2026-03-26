"use client";
import { useState } from "react";
import { CheckCircle2, Copy, Smartphone, Laptop, Monitor, Send, ArrowRight, ArrowLeft, Zap } from "lucide-react";
import { Button } from "./ui/Button";
import { trackLead } from "@/lib/leads";
import { brand } from "@/lib/brand";
import { getOrCreateSessionVoucher } from "@/lib/session/voucherSession";

const equipmentTypes = [
  { id: "smartphone", label: "Smartphone", icon: <Smartphone size={18} /> },
  { id: "notebook", label: "Notebook", icon: <Laptop size={18} /> },
  { id: "pc", label: "Desktop/PC", icon: <Monitor size={18} /> },
];

export function MaintenanceForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    equipment: "",
    model: "",
    problem: "",
  });
  const [voucher, setVoucher] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const sessionVoucherCode = await getOrCreateSessionVoucher();

      const code = await trackLead({
        client_name: formData.name,
        whatsapp: formData.phone,
        interest_type: 'manutencao',
        description: `Equipamento: ${formData.equipment} | Modelo: ${formData.model} | Problema: ${formData.problem}`,
        voucher_code: sessionVoucherCode
      });

      if (code) {
        setVoucher(code);
        setStep(3);
      }
    } catch (error) {
      console.error("Erro ao processar manutenção:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppRedirect = () => {
    const message = `Olá! Acabei de gerar o voucher *${voucher}* no site.\n\n*Equipamento:* ${formData.equipment}\n*Modelo:* ${formData.model}\n*Problema:* ${formData.problem}\n\nPodem me orientar sobre os próximos passos?`;
    window.open(`https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="max-w-xl mx-auto w-full">
      {step === 1 && (
        <div className="card-dark bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-8 shadow-2xl">
          <h3 className="text-xl font-display font-bold tracking-[0.1em] text-[var(--text-primary)] mb-8 uppercase">
            <span className="chrome-text">INICIAR</span> <span className="text-[var(--accent-primary)]">ATENDIMENTO</span>
          </h3>
          <div className="grid grid-cols-1 gap-4 mb-4">
            {equipmentTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  setFormData({ ...formData, equipment: type.id });
                  setStep(2);
                }}
                className={`flex items-center justify-between p-6 rounded-2xl border transition-all group ${
                  formData.equipment === type.id
                    ? "bg-[var(--accent-glow)] border-[var(--accent-primary)] text-white"
                    : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className={`p-3 rounded-lg ${formData.equipment === type.id ? "bg-[var(--bg-primary)] text-[var(--accent-primary)]" : "bg-[var(--bg-surface)] text-[var(--text-secondary)]"}`}>
                    {type.icon}
                  </div>
                  <span className="text-xs font-mono font-bold uppercase tracking-[0.2em]">
                    {type.label}
                  </span>
                </div>
                <ArrowRight size={18} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card-dark bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-8 shadow-2xl">
          <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase mb-6 hover:text-[var(--accent-primary)] transition-colors tracking-widest group">
            <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="border border-[var(--border-subtle)] group-hover:border-[var(--accent-primary)] px-2 py-1 rounded transition-colors">VOLTAR</span>
          </button>
          <h3 className="text-xl font-display font-bold tracking-[0.1em] text-[var(--text-primary)] mb-8 uppercase">
            <span className="chrome-text">LOG DE</span> <span className="text-[var(--accent-primary)]">DIAGNÓSTICO</span>
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-muted)] ml-2">OPERADOR (NOME)</label>
                <input
                  required
                  type="text"
                  placeholder="João Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-6 py-4 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all font-medium placeholder:text-[var(--text-muted)] opacity-80 focus:opacity-100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-muted)] ml-2">CONEXÃO (WHATSAPP)</label>
                <input
                  required
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-6 py-4 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all font-medium placeholder:text-[var(--text-muted)] opacity-80 focus:opacity-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-muted)] ml-2">MODELO DO EQUIPAMENTO</label>
              <input
                required
                type="text"
                placeholder="Ex: iPhone 13 Pro, Notebook Dell G15..."
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-6 py-4 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all font-medium placeholder:text-[var(--text-muted)] opacity-80 focus:opacity-100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-muted)] ml-2">SINTOMAS / PROBLEMA</label>
              <textarea
                required
                placeholder="Descreva brevemente o problema..."
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-6 py-4 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all font-medium min-h-[120px] placeholder:text-[var(--text-muted)] opacity-80 focus:opacity-100"
                value={formData.problem}
                onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
              />
            </div>

            <Button className="w-full btn-primary py-6 rounded-xl font-display shadow-2xl group" isLoading={loading}>
              <span className="text-sm font-display font-bold uppercase tracking-widest">Registrar e Gerar Voucher</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>
        </div>
      )}

      {step === 3 && voucher && (
        <div className="card-dark bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-10 shadow-2xl text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Zap size={100} />
          </div>
          
          <div className="flex justify-center mb-8">
            <div className="bg-[var(--accent-glow)] p-6 rounded-full text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 shadow-[0_0_30px_rgba(255,107,0,0.1)] relative">
              <div className="absolute inset-0 bg-[var(--accent-primary)] opacity-20 rounded-full animate-ping" />
              <CheckCircle2 size={48} className="relative z-10" />
            </div>
          </div>
          <h3 className="text-2xl font-display font-bold tracking-tight text-[var(--text-primary)] mb-4 uppercase">
            <span className="chrome-text">VOUCHER DE</span> <span className="italic opacity-60">PRIORIDADE</span>
          </h3>
          <p className="text-[var(--text-muted)] text-[10px] font-mono font-bold uppercase tracking-[0.2em] mb-10">
            APRESENTE ESTE TOKEN PARA ATENDIMENTO ELITE
          </p>

          <div className="bg-[var(--bg-elevated)] border border-dashed border-[var(--border-subtle)] rounded-2xl p-8 mb-10 relative group">
            <span className="text-[8px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-[0.4em] mb-4 block">
              TOKEN / CÓDIGO DE PRIORIDADE
            </span>
            <div className="text-4xl font-display font-bold tracking-[0.2em] text-[var(--text-primary)] flex items-center justify-center gap-6 chrome-text">
              {voucher}
              <button 
                onClick={() => navigator.clipboard.writeText(voucher)}
                className="text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
              >
                <Copy size={20} />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <button 
                onClick={handleWhatsAppRedirect}
                className="w-full btn-primary py-6 flex items-center justify-center gap-3 rounded-xl transition-all shadow-2xl animate-pulse-slow"
            >
              <Send size={20} /> 
              <span className="text-sm font-display font-bold uppercase tracking-widest">Enviar para Técnico Digital</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
