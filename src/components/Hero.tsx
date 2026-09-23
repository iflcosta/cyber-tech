"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Cpu, 
  Layers, 
  Building2, 
  ShieldCheck, 
  Search, 
  ArrowRight,
  Activity,
  Maximize2,
  Sliders,
  CheckCircle2,
  Disc,
  Flame,
  Zap,
  Clock
} from "lucide-react";
import { brand } from "@/lib/brand";
import TrackedWhatsAppLink from "./TrackedWhatsAppLink";

export default function Hero({ 
  serviceParam, 
  personaParam 
}: {
  serviceParam?: string | null;
  personaParam?: string | null;
  } = {}) {
  const router = useRouter();
  const [trackingInput, setTrackingInput] = useState("");
  const [activeFloor, setActiveFloor] = useState<"all" | "level2" | "level1">("all");

  const isB2B = personaParam === "lojista" || personaParam === "parceiro";

  const whatsappHeroMessage = isB2B
    ? "Olá! Sou lojista/assistência técnica na região de Bragança. Vim pelo site da Cyber e gostaria de falar sobre terceirização técnica e parcerias B2B."
    : "Olá! Vim pelo site da Cyber Informática e gostaria de solicitar um diagnóstico pericial para minha máquina.";

  const whatsappB2BMessage = "Olá! Gostaria de credenciar minha loja/assistência técnica como parceira B2B da Cyber Informática.";

  function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    const query = trackingInput.trim();
    if (!query) return;
    router.push(`/status?q=${encodeURIComponent(query)}`);
  }

  return (
    <section className="relative bg-[#09090c] border-b border-[#242429] pt-8 sm:pt-14 pb-14 sm:pb-20 overflow-hidden font-sans">
      {/* Grade técnica milimétrica de metrologia óptica de fundo */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Marcações de mira ótica nas extremidades (Leica Reticle Crosshairs) */}
      <div aria-hidden className="absolute top-4 left-4 text-zinc-700 font-mono text-[9px] select-none pointer-events-none">
        + 00.00.00 // NORTH ALIGN
      </div>
      <div aria-hidden className="absolute top-4 right-4 text-zinc-700 font-mono text-[9px] select-none pointer-events-none hidden sm:block">
        ELEV +817m // BRAGANÇA SP +
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Eyebrow Metrológico */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6 font-mono text-[11px]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#121216] border border-[#27272a] text-zinc-300 rounded-sm font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>SEDE FÍSICA // 10 ANOS DE BANCADA ATIVA</span>
          </span>
          <span className="text-zinc-600 hidden sm:inline">•</span>
          <span className="text-zinc-400">RUA CORONEL TEÓFILO LEME, 967 • CENTRO</span>
          <span className="text-zinc-600 hidden sm:inline">•</span>
          <span className="text-zinc-400 hidden md:inline">2 PISOS TÉCNICOS: TÉRREO 6M + MEZANINO OCA</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          
          {/* Coluna Esquerda: Tipografia Arquitetônica Sólida & Ações (7 colunas) */}
          <div className="lg:col-span-7">
            
            {/* H1 Principal Monumental e 100% Sólido — ZERO stroke text cópia do IF Tech */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.05] mb-5">
              Arquitetura de Hardware &amp;<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
                Engenharia de Precisão.
              </span>
            </h1>

            {/* Subtítulo Técnico Direto e Físico */}
            <p className="text-base sm:text-lg text-zinc-300 font-normal leading-relaxed mb-6 max-w-2xl">
              Eliminamos diagnósticos no chute. Montagem de workstations de alta performance no balcão térreo de 6 metros de pé-direito, e cirurgia de circuitos BGA com laminação óptica OCA a vácuo no mezanino industrial.
            </p>

            {/* Micro-Chips de Instrumentação Técnica (Teenage Engineering Inspired Spec-Chips) */}
            <div className="flex flex-wrap gap-2 mb-8">
              <div className="spec-chip">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-zinc-400">ΔT GPU:</span>
                <span className="text-white font-bold">-28°C CURADORIA</span>
              </div>
              <div className="spec-chip">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-zinc-400">VÁCUO OCA:</span>
                <span className="text-white font-bold">0.08 MPa</span>
              </div>
              <div className="spec-chip">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-zinc-400">AUTOCLAVE:</span>
                <span className="text-white font-bold">6.0 BAR</span>
              </div>
              <div className="spec-chip">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-zinc-400">LINHA 12V:</span>
                <span className="text-white font-bold">&lt;15mV RIPPLE</span>
              </div>
              <div className="spec-chip hidden sm:inline-flex">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-zinc-400">DDR5:</span>
                <span className="text-white font-bold">DUAL-CH 6000MHz</span>
              </div>
            </div>

            {/* Botões Tácteis Principais */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8">
              <TrackedWhatsAppLink
                phone={brand.whatsapp}
                message={whatsappHeroMessage}
                source="hero_cta_primary"
                className="btn-tactile-primary text-xs sm:text-sm py-3.5 px-6 sm:px-8"
                ariaLabel="Solicitar Laudo Pericial"
              >
                <span>SOLICITAR DIAGNÓSTICO PERICIAL</span>
                <ArrowRight className="w-4 h-4" />
              </TrackedWhatsAppLink>

              <TrackedWhatsAppLink
                phone={brand.whatsapp}
                message={whatsappB2BMessage}
                source="hero_cta_b2b"
                className="btn-tactile-secondary text-xs sm:text-sm py-3.5 px-6"
                ariaLabel="Canal B2B para Lojistas"
              >
                <Building2 className="w-4 h-4 text-zinc-400" />
                <span>CANAL LOJISTAS &amp; B2B</span>
              </TrackedWhatsAppLink>
            </div>

            {/* Painel Integrado de Rastreio de OS — Estética Milled Chassi */}
            <div className="p-4 sm:p-5 bg-[#0f0f13] border border-[#242429] rounded-sm max-w-2xl">
              <div className="flex items-center justify-between mb-3 font-mono text-[11px]">
                <span className="text-zinc-300 font-bold uppercase flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  CONSULTA DE PROTOCOLO PERICIAL
                </span>
                <span className="text-zinc-400 text-[10px]">SN-OS-2026 // LGPD SAFE</span>
              </div>

              <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-zinc-400 text-xs select-none">
                    OS-
                  </span>
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="Digite número, celular ou UUID..."
                    className="w-full bg-[#15151a] border border-[#2e2e36] pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-400 font-mono focus:outline-none focus:border-white transition-colors rounded-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-tactile-primary !py-2.5 !px-5 text-xs shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>INSPECIONAR OS</span>
                </button>
              </form>

              <div className="flex items-center justify-between mt-2.5 font-mono text-[10px] text-zinc-400">
                <span>Horário de bancada: Seg a Sex 09h-18h • Sáb 09h-13h</span>
                <span className="text-emerald-400 font-bold">TEMPO REAL 24/7</span>
              </div>
            </div>

          </div>

          {/* Coluna Direita: Console Arquitetônico Cross-Section dos 2 Pisos (5 colunas) */}
          <div className="lg:col-span-5">
            <div className="milled-chassis p-5 sm:p-6 rounded-sm">
              
              {/* Cabeçalho do Console Arquitetônico */}
              <div className="flex items-center justify-between border-b border-[#242429] pb-3 mb-4 font-mono">
                <div>
                  <span className="text-[10px] text-zinc-400 block tracking-widest uppercase">
                    CORTE ESQUEMÁTICO // FACILITY 967
                  </span>
                  <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5 text-zinc-400" />
                    DUAL-LEVEL HARDWARE FACILITY
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-sm block">
                    ONLINE • ESD SAFE
                  </span>
                  <span className="text-[9px] text-zinc-400">PÉ-DIREITO 6.00m</span>
                </div>
              </div>

              {/* Seletor Táctil de Nível (Teenage Engineering Tabs) */}
              <div className="grid grid-cols-3 gap-1.5 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveFloor("all")}
                  className={`console-tab ${activeFloor === "all" ? "active" : ""}`}
                >
                  COMPLEXO
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFloor("level2")}
                  className={`console-tab ${activeFloor === "level2" ? "active" : ""}`}
                >
                  PISO 02 // LAB
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFloor("level1")}
                  className={`console-tab ${activeFloor === "level1" ? "active" : ""}`}
                >
                  PISO 01 // 6M
                </button>
              </div>

              {/* Diagrama Esquemático dos Pisos Físicos */}
              <div className="space-y-3 font-mono text-xs">
                
                {/* NÍVEL 02: MEZANINO INDUSTRIAL (ELEV +3.60m) */}
                {(activeFloor === "all" || activeFloor === "level2") && (
                  <div className="bg-[#121217] border border-[#292930] p-4 rounded-sm transition-all duration-300">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-zinc-800 text-[9px] text-zinc-300 font-bold rounded-sm">
                            ELEV +3.60m
                          </span>
                          <span className="text-white font-bold text-xs flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-zinc-300" />
                            MEZANINO // OCA &amp; BGA SURGERY
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">
                          Operado por Jefferson • Microeletrônica &amp; Laminação
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 border border-emerald-900/60 rounded-sm">
                        SELADO
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-[#1f1f26] text-[11px] text-zinc-400">
                      <div className="bg-[#0b0b0e] p-2 rounded border border-[#202028]">
                        <span className="text-[9px] text-zinc-400 block uppercase">Câmara a Vácuo OCA</span>
                        <strong className="text-white font-mono text-xs">0.08 MPa</strong>
                        <span className="text-[9px] text-zinc-400 block">Sem microbolhas</span>
                      </div>
                      <div className="bg-[#0b0b0e] p-2 rounded border border-[#202028]">
                        <span className="text-[9px] text-zinc-400 block uppercase">Autoclave Industrial</span>
                        <strong className="text-white font-mono text-xs">6.0 Bar Pressão</strong>
                        <span className="text-[9px] text-zinc-400 block">Displays originais</span>
                      </div>
                    </div>

                    <div className="mt-2 text-[10px] text-zinc-400 flex items-center justify-between">
                      <span>• Estação BGA Infravermelha</span>
                      <span>• Microscópio Trinocular 4K</span>
                    </div>
                  </div>
                )}

                {/* Linha Divisória de Laje Estrutural com Metrologia */}
                {activeFloor === "all" && (
                  <div className="flex items-center gap-2 py-1 text-[9px] text-zinc-400 font-mono">
                    <span className="w-3 border-t border-zinc-700" />
                    <span>LAJE ESTRUTURAL // ISOLAMENTO TÉRMICO E ACÚSTICO</span>
                    <span className="flex-1 border-t border-zinc-700" />
                  </div>
                )}

                {/* NÍVEL 01: TÉRREO COM PÉ-DIREITO DE 6 METROS (ELEV +0.00m) */}
                {(activeFloor === "all" || activeFloor === "level1") && (
                  <div className="bg-[#121217] border border-[#292930] p-4 rounded-sm transition-all duration-300">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-zinc-800 text-[9px] text-zinc-300 font-bold rounded-sm">
                            ELEV +0.00m
                          </span>
                          <span className="text-white font-bold text-xs flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-zinc-300" />
                            TÉRREO // ESTANTE 6M &amp; WORKSTATIONS
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">
                          Atendimento: Iago &amp; Felipe • Balcão Pericial &amp; Curadoria
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-300 font-bold bg-zinc-800/80 px-1.5 py-0.5 border border-zinc-700 rounded-sm">
                        BALCÃO
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-[#1f1f26] text-[11px] text-zinc-400">
                      <div className="bg-[#0b0b0e] p-2 rounded border border-[#202028]">
                        <span className="text-[9px] text-zinc-400 block uppercase">Estante Industrial</span>
                        <strong className="text-white font-mono text-xs">6 Metros Altura</strong>
                        <span className="text-[9px] text-zinc-400 block">Estoque próprio imediato</span>
                      </div>
                      <div className="bg-[#0b0b0e] p-2 rounded border border-[#202028]">
                        <span className="text-[9px] text-zinc-400 block uppercase">Aterramento ESD</span>
                        <strong className="text-white font-mono text-xs">&lt; 1.0 Ω Loop</strong>
                        <span className="text-[9px] text-zinc-400 block">Proteção eletrostática</span>
                      </div>
                    </div>

                    <div className="mt-2 text-[10px] text-zinc-400 flex items-center justify-between">
                      <span>• Montagem Pericial Workstation</span>
                      <span>• Estresse AIDA64 / FurMark</span>
                    </div>
                  </div>
                )}

              </div>

              {/* Rodapé Metrológico do Console */}
              <div className="mt-4 pt-3 border-t border-[#242429] flex items-center justify-between font-mono text-[10px] text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  BANCADA PERICIAL CALIBRADA
                </span>
                <span className="text-zinc-400">SERIAL: CYB-HQ-967</span>
              </div>

            </div>
          </div>

        </div>

        {/* Faixa de Pilares de Autoridade Física (4 Módulos Metrológicos) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-12 pt-8 border-t border-[#242429] font-mono">
          {[
            { tag: "01 // HISTÓRICO", val: "10 ANOS", desc: "Loja física no Centro de Bragança", sub: "Rua Cel. Teófilo Leme 967" },
            { tag: "02 // INFRAESTRUTURA", val: "PÉ-DIREITO 6M", desc: "Estante industrial monumental", sub: "Estoque de hardware real" },
            { tag: "03 // MEZANINO", val: "OCA + BGA", desc: "Laboratório cirúrgico pesado", sub: "Autoclave 6 bar + Vácuo" },
            { tag: "04 // JURÍDICO", val: "90 DIAS CDC", desc: "Garantia legal integral Art. 26", sub: "Certificado pericial com S/N" },
          ].map((item) => (
            <div key={item.val} className="p-3.5 sm:p-4 bg-[#0d0d11] border border-[#242429] rounded-sm">
              <span className="text-[9px] text-zinc-400 block uppercase font-bold mb-1">
                {item.tag}
              </span>
              <strong className="text-white text-base sm:text-lg block tracking-tight">
                {item.val}
              </strong>
              <p className="text-zinc-400 text-xs mt-1 font-sans">
                {item.desc}
              </p>
              <span className="text-[10px] text-zinc-400 block mt-1">
                {item.sub}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
