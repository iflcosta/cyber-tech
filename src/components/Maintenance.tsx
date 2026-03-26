"use client";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, Clock, MapPin, Zap } from "lucide-react";
import { MaintenanceForm } from "./MaintenanceForm";

const features = [
  { icon: <ShieldCheck size={20} className="text-[var(--accent-primary)]" />, text: "Garantia de 90 dias em todos os reparos" },
  { icon: <Clock size={20} className="text-[var(--accent-primary)]" />, text: "Orçamento rápido em até 15 minutos" },
  { icon: <MapPin size={20} className="text-[var(--accent-primary)]" />, text: "Unidade Física em Bragança Paulista" },
];

export default function Maintenance() {
  const searchParams = useSearchParams();
  const serviceParam = searchParams.get('service');

  const formattedService = serviceParam 
    ? serviceParam.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : null;

  return (
    <section id="assistencia" className="py-24 bg-[var(--bg-primary)] relative overflow-hidden hero-texture border-y border-[var(--border-subtle)] red-line-top">
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          <div className="space-y-12">
            <div>
              <div className="flex items-center gap-2 text-[var(--accent-primary)] text-[10px] font-mono font-bold uppercase tracking-[0.3em] mb-6">
                <Zap size={14} fill="currentColor" />
                <span>LABORATÓRIO DE ALTA PERFORMANCE</span>
              </div>
              <h2 className="text-6xl md:text-8xl font-display font-bold mb-8 tracking-tighter text-[var(--text-primary)] leading-[0.85] uppercase chrome-text">
                {formattedService ? (
                  <>
                    ASSISTÊNCIA EM <br />
                    <span className="opacity-40 italic">{formattedService}</span>
                  </>
                ) : (
                  <>
                    ASSISTÊNCIA <br />
                    <span className="opacity-40 italic">TÉCNICA ELITE</span>
                  </>
                )}
              </h2>
              <p className="text-[var(--text-secondary)] text-sm font-medium max-w-lg leading-relaxed">
                De smartphones a workstations complexas, nossa equipe certificada resolve problemas com precisão cirúrgica e agilidade digital em Bragança Paulista.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-5 group">
                  <div className="bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border-subtle)] group-hover:border-[var(--accent-primary)] transition-colors duration-300 shadow-xl">
                    {f.icon}
                  </div>
                  <span className="text-[var(--text-primary)] font-display font-bold uppercase tracking-tight text-sm group-hover:text-[var(--accent-primary)] transition-colors">
                    {f.text}
                  </span>
                </div>
              ))}
            </div>

            <div className="card-dark p-10 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] relative overflow-hidden shadow-2xl group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent-primary)] opacity-50" />
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
                <Zap size={120} />
              </div>
              <h4 className="font-display font-bold text-[var(--text-primary)] mb-4 uppercase tracking-[0.1em] text-lg chrome-text">CHECKOUT DIGITAL</h4>
              <p className="text-[10px] text-[var(--text-muted)] font-mono font-bold uppercase tracking-widest leading-relaxed">
                CONTROLE TOTAL: Cada reparo é registrado via software próprio com fotos e logs técnicos, garantindo que seu equipamento volte 100% certificado.
              </p>
            </div>
          </div>

          <div className="lg:sticky lg:top-32">
            <MaintenanceForm />
          </div>
        </div>
      </div>
    </section>
  );
}



