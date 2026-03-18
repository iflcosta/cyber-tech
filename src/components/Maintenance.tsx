"use client";

import { CheckCircle2, ShieldCheck, Clock, MapPin } from "lucide-react";
import { MaintenanceForm } from "./MaintenanceForm";
import { Badge } from "./ui/Badge";

const features = [
  { icon: <ShieldCheck className="text-[#1A1A1A]" />, text: "Garantia de 90 dias em todos os reparos" },
  { icon: <Clock className="text-[#1A1A1A]" />, text: "Orçamento rápido em até 15 minutos" },
  { icon: <MapPin className="text-[#1A1A1A]" />, text: "Localização central em Bragança Paulista" },
];

export default function Maintenance() {
  return (
    <section id="assistencia" className="py-24 bg-[#F8F7F5] relative overflow-hidden border-y border-[#D4D2CF]">
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <Badge variant="secondary" className="mb-6">SERVIÇOS TÉCNICOS</Badge>
            <h2 className="text-4xl md:text-7xl font-display font-bold mb-6 tracking-tight text-[#1A1A1A] leading-none uppercase">
              ASSISTÊNCIA <br />
              <span className="text-outline">ULTRA RÁPIDA</span>
            </h2>
            <p className="text-[#888888] text-[10px] font-bold uppercase tracking-widest mb-10 max-w-lg leading-relaxed">
              De smartphones a workstations complexas, nãossa equipe certificada resolve problemas com precisão cirúrgica e agilidade digital.
            </p>

            <div className="space-y-4 mb-12">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-4 text-[#555555] font-display font-bold uppercase tracking-tight text-sm">
                  <div className="bg-white p-2 rounded-[2px] border border-[#ECEAE6]">{f.icon}</div>
                  {f.text}
                </div>
              ))}
            </div>

            <div className="p-10 bg-white rounded-[2px] border border-[#D4D2CF] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-[2px] h-full bg-[#1A1A1A]" />
              <h4 className="font-display font-bold text-[#1A1A1A] mb-4 uppercase tracking-tight">PROVA DE ENTREGA DIGITAL</h4>
              <p className="text-[10px] text-[#888888] font-bold uppercase tracking-widest leading-relaxed">
                Segurança total: cada entrega é registrada com fotos e checkout digital, garantindo que seu equipamento volte exatamente como deveria.
              </p>
            </div>
          </div>

          <div className="lg:sticky lg:top-24">
            <MaintenanceForm />
          </div>
        </div>
      </div>
    </section>
  );
}



