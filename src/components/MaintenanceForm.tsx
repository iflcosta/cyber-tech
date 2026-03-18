"use client";

import { useState } from "react";
import { CheckCircle2, Copy, Smartphone, Laptop, Monitor, Send } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Card, CardContent } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { generateVoucher } from "@/lib/voucher";
import { brand } from "@/lib/brand";

import { trackLead } from "@/lib/leads";

const equipmentTypes = [
  { id: "smartphone", label: "Smartphone", icon: <Smartphone size={16} /> },
  { id: "notebook", label: "Notebook", icon: <Laptop size={16} /> },
  { id: "pc", label: "Desktop/PC", icon: <Monitor size={16} /> },
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
      const code = await trackLead({
        client_name: formData.name,
        whatsapp: formData.phone,
        interest_type: 'manutencao',
        description: `Equipamento: ${formData.equipment} | Modelo: ${formData.model} | Problema: ${formData.problem}`,
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
    <div className="max-w-2xl mx-auto w-full">
      {step === 1 && (
        <Card className="border-[#D4D2CF] bg-white/90 backdrop-blur-md shadow-xl overflow-hidden relative group rounded-3xl">
          <CardContent className="p-10">
            <h3 className="text-2xl font-display font-bold tracking-tight text-[#1A1A1A] mb-8 uppercase">
              TIPO DE <span className="text-outline text-[#AAAAAA]">EQUIPAMENTO</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {equipmentTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setFormData({ ...formData, equipment: type.id });
                    setStep(2);
                  }}
                  className={`flex flex-col items-center justify-center p-6 rounded-xl border transition-all gap-4 group ${
                    formData.equipment === type.id
                      ? "bg-[#1A1A1A] border-[#1A1A1A] text-white shadow-[0_10px_20px_rgba(0,0,0,0.1)]"
                      : "bg-[#F8F7F5] border-[#ECEAE6] text-[#AAAAAA] hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
                  }`}
                >
                  <div className={`${formData.equipment === type.id ? "text-white" : "text-[#1A1A1A] group-hover:scale-110 transition-transform"}`}>
                    {type.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="border-[#D4D2CF] bg-white/95 backdrop-blur-md shadow-xl overflow-hidden relative group rounded-3xl">
          <CardContent className="p-10">
            <button onClick={() => setStep(1)} className="text-[10px] font-black text-[#AAAAAA] uppercase mb-6 hover:text-[#1A1A1A] transition-colors tracking-widest flex items-center gap-2">
              <span className="text-lg">←</span> VOLTAR
            </button>
            <h3 className="text-2xl font-display font-bold tracking-tight text-[#1A1A1A] mb-8 uppercase">
              DETALHES DO <span className="text-outline text-[#AAAAAA]">REPARO</span>
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#888888] ml-2">Seu Nome</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: João Silva"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#F8F7F5] border border-[#ECEAE6] rounded-xl px-6 py-4 text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-all font-medium placeholder:text-[#CCCCCC]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#888888] ml-2">WhatsApp</label>
                  <input
                    required
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#F8F7F5] border border-[#ECEAE6] rounded-xl px-6 py-4 text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-all font-medium placeholder:text-[#CCCCCC]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#888888] ml-2">Modelo do Aparelho</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: iPhone 13 Pro, Notebook Dell G15..."
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full bg-[#F8F7F5] border border-[#ECEAE6] rounded-xl px-6 py-4 text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-all font-medium placeholder:text-[#CCCCCC]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#888888] ml-2">O que aconteceu?</label>
                <textarea
                  required
                  placeholder="Descreva brevemente o problema (Ex: Tela quebrada, não liga...)"
                  className="w-full bg-[#F8F7F5] border border-[#ECEAE6] rounded-xl px-6 py-4 text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-all font-medium min-h-[120px] placeholder:text-[#CCCCCC]"
                  value={formData.problem}
                  onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                />
              </div>

              <Button className="w-full bg-[#1A1A1A] hover:bg-[#333333] text-white font-black uppercase tracking-widest py-6 rounded-xl transition-all shadow-[0_10px_30px_rgba(0,0,0,0.1)] font-display" isLoading={loading}>
                GERAR VOUCHER DE PRIORIDADE
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 3 && voucher && (
        <Card className="border-[#D4D2CF] bg-white/95 backdrop-blur-md shadow-xl text-center overflow-hidden relative rounded-3xl">
          <CardContent className="p-10">
            <div className="flex justify-center mb-8">
              <div className="bg-[#F8F7F5] p-6 rounded-full text-[#1A1A1A] border border-[#ECEAE6]">
                <CheckCircle2 size={48} />
              </div>
            </div>
            <h3 className="text-3xl font-display font-bold tracking-tight text-[#1A1A1A] mb-4 uppercase">
              VOUCHER <span className="text-outline text-[#AAAAAA]">GERADO!</span>
            </h3>
            <p className="text-[#888888] text-[10px] font-bold uppercase tracking-widest mb-10">
              Apresente este código na nossa loja para atendimento prioritário.
            </p>

            <div className="bg-[#F8F7F5] border border-dashed border-[#D4D2CF] rounded-2xl p-8 mb-10 relative group overflow-hidden">
              <span className="text-[8px] font-black text-[#AAAAAA] uppercase tracking-[0.4em] mb-4 block">
                CÓDIGO ÚNICO DE ATENDIMENTO
              </span>
              <div className="text-4xl font-display font-bold tracking-[0.2em] text-[#1A1A1A] flex items-center justify-center gap-6">
                {voucher}
                <button 
                  onClick={() => navigator.clipboard.writeText(voucher)}
                  className="text-[#CCCCCC] hover:text-[#1A1A1A] transition-colors"
                >
                  <Copy size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <Button className="w-full bg-[#1A1A1A] hover:bg-[#333333] text-white font-black uppercase tracking-widest py-6 gap-3 rounded-xl transition-all shadow-[0_10px_30px_rgba(0,0,0,0.1)] font-display" onClick={handleWhatsAppRedirect}>
                <Send size={20} /> INICIAR NO WHATSAPP
              </Button>
              <p className="text-[10px] text-[#AAAAAA] font-bold uppercase tracking-widest italic">
                Um técnico está aguardando sua mensagem.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
