"use client";
import { MessageCircle, Building2, Sparkles, Cpu, Zap, Shield, Microscope } from "lucide-react";
import Link from "next/link";
import { brand } from "@/lib/brand";
import TrackedWhatsAppLink from "./TrackedWhatsAppLink";
import HeroOSTrack from "./HeroOSTrack";

/**
 * Hero — Cyber Informática V2 (Stealth Industrial & Google Ads Compliant)
 */
export default function Hero({ serviceParam, personaParam }: {
  serviceParam?: string | null;
  personaParam?: string | null;
} = {}) {
  const isB2B = personaParam === 'lojista' || personaParam === 'parceiro';

  const whatsappCuradoriaMessage = "Olá! Vim pelo site da Cyber e gostaria de falar com a curadoria técnica sobre PCs, Workstations e Laboratório.";
  const whatsappB2BMessage = isB2B
    ? "Olá! Sou lojista/assistência em Bragança e região. Vim pelo site da Cyber e gostaria de falar sobre terceirização técnica e parcerias B2B."
    : "Olá! Sou lojista/assistência técnica. Gostaria de falar sobre terceirização com a Cyber.";

  const headline = isB2B ? (
    <>
      Terceirização e Engenharia B2B para <span className="gradient-text">Lojistas & Parceiros</span>.
    </>
  ) : (
    <>
      Laboratório de Engenharia e <span className="gradient-text">Varejo de Alta Performance</span>.
    </>
  );

  const subheadline = isB2B ? (
    "Estrutura avançada de microeletrônica, reballing de placas e laminação óptica OCA para atender a demanda pesada da sua loja com garantia e margem."
  ) : (
    "A maior infraestrutura de tecnologia e microeletrônica no Centro de Bragança Paulista. Varejo de PCs Gamers, Workstations sob medida e bancada pericial com total transparência."
  );

  return (
    <section className="relative overflow-hidden bg-[#09090b] pt-28 pb-16 md:pt-32 md:pb-24 border-b border-white/[0.06]">
      {/* Grid sutil de precisão aeroespacial */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse 900px 600px at center, black 10%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 900px 600px at center, black 10%, transparent 80%)",
        }}
      />

      <div className="container-narrow relative">
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-12 items-center mb-12">
          {/* Coluna de Texto e Rastreio */}
          <div>
            {/* Badge com dot pulsante */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-white/5 border border-white/15 text-xs font-mono font-semibold uppercase tracking-[0.14em] text-white">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              Lab Bragança Paulista · Bancada Ativa ESD
            </div>

            {/* H1 Principal */}
            <h1 className="display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.04] mb-6 text-white">
              {headline}
            </h1>

            {/* Subtítulo Institucional */}
            <p className="text-base sm:text-lg text-zinc-400 mb-8 leading-relaxed max-w-xl">
              {subheadline}
            </p>

            {/* Rastreio Instantâneo de OS no Hero */}
            <div className="mb-8 max-w-lg">
              <HeroOSTrack />
            </div>

            {/* Ações Primárias */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
              <TrackedWhatsAppLink
                phone={brand.whatsapp}
                message={whatsappCuradoriaMessage}
                source="hero_curadoria"
                className="btn-primary inline-flex items-center justify-center gap-2 text-sm sm:text-base px-6 py-3.5 font-bold"
                ariaLabel="Falar com a curadoria técnica"
              >
                <MessageCircle size={18} />
                Falar com a Curadoria
              </TrackedWhatsAppLink>

              <TrackedWhatsAppLink
                phone={brand.whatsapp}
                message={whatsappB2BMessage}
                source="hero_b2b"
                className="btn-ghost inline-flex items-center justify-center gap-2 text-sm sm:text-base px-6 py-3.5 font-semibold"
                ariaLabel="Parceria para Lojistas"
              >
                <Building2 size={18} />
                Canal para Lojistas
              </TrackedWhatsAppLink>
            </div>

            {/* Badges de Confiança Pericial */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <Microscope size={14} className="text-emerald-400" />
                Microeletrônica & Mezanino OCA
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Shield size={14} className="text-white" />
                Garantia Legal CDC 90 Dias
              </span>
            </div>
          </div>

          {/* Coluna Visual — Bancada de Engenharia Stealth */}
          <div className="relative">
            <BancadaStealthMockup />
          </div>
        </div>

        {/* Stats em Grid de Precisão */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 border-t border-white/[0.08]">
          {[
            { value: '10+', label: 'Anos no Centro de Bragança', icon: Sparkles },
            { value: '500+', label: 'Itens em Estoque Físico', icon: Cpu },
            { value: '100%', label: 'Bancada Aterrada ESD', icon: Shield },
            { value: 'CDC 90D', label: 'Garantia Legal Registrada', icon: Zap },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="p-5 rounded-lg bg-[#111114] border border-white/[0.08] hover:border-white/20 transition-all font-mono"
              >
                <div className="flex items-start justify-between mb-2">
                  <Icon size={16} className="text-zinc-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1">
                  {stat.value}
                </div>
                <div className="text-[11px] uppercase tracking-[0.1em] text-zinc-400 font-sans">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * BancadaStealthMockup — Visualização gráfica SVG em estética Stealth Industrial
 * Representa estação de trabalho de alta engenharia, osciloscópio e telemetria térmica.
 */
function BancadaStealthMockup() {
  return (
    <div className="relative aspect-[4/3] w-full">
      {/* Sutil halo cinza de profundidade */}
      <div
        className="absolute inset-0 rounded-2xl blur-3xl opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, transparent 70%)" }}
        aria-hidden
      />

      <div className="relative w-full h-full rounded-xl bg-[#111114] border border-white/10 overflow-hidden shadow-2xl p-6 flex flex-col justify-between font-mono">
        {/* Top bar de telemetria */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-white font-bold tracking-wider">LAB_TELEMETRY // V2</span>
          </div>
          <span className="text-[10px] uppercase text-zinc-500">STATION_B01 · 24.1°C</span>
        </div>

        {/* Diagrama pericial de hardware e osciloscópio */}
        <div className="my-auto space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            <div className="bg-black/50 border border-white/5 p-2.5 rounded">
              <span className="text-zinc-500 block">VRAM_CLK</span>
              <span className="text-white font-bold text-xs">1750 MHz</span>
            </div>
            <div className="bg-black/50 border border-white/5 p-2.5 rounded">
              <span className="text-zinc-500 block">GPU_HOTSPOT</span>
              <span className="text-emerald-400 font-bold text-xs">62.4 °C</span>
            </div>
            <div className="bg-black/50 border border-white/5 p-2.5 rounded">
              <span className="text-zinc-500 block">SMART_NVME</span>
              <span className="text-white font-bold text-xs">HEALTH 100%</span>
            </div>
          </div>

          {/* Gráfico vetorial de estresse pericial */}
          <div className="bg-black/60 border border-white/10 p-3 rounded h-28 relative flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 300 80" className="w-full h-full opacity-80" preserveAspectRatio="none">
              <line x1="0" y1="20" x2="300" y2="20" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="40" x2="300" y2="40" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="60" x2="300" y2="60" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />
              <path
                d="M0,65 L30,62 L60,45 L90,48 L120,30 L150,32 L180,22 L210,24 L240,18 L270,19 L300,18"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <path
                d="M0,72 L35,70 L70,55 L105,58 L140,42 L175,44 L210,34 L245,36 L280,28 L300,28"
                fill="none"
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            </svg>
            <div className="absolute top-2 left-3 text-[9px] text-zinc-500 uppercase">
              Curva de Carga Térmica (Bancada AIDA64)
            </div>
          </div>
        </div>

        {/* Rodapé do mockup */}
        <div className="border-t border-white/10 pt-3 flex items-center justify-between text-[11px] text-zinc-400">
          <span>Microscópio Óptico 4K</span>
          <span className="text-zinc-300 font-bold">Câmara a Vácuo OCA</span>
        </div>
      </div>
    </div>
  );
}