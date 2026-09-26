"use client";

import { useState } from "react";
import { ArrowUpRight, ArrowRight, ArrowLeft, RotateCcw } from "lucide-react";
import { brand } from "@/lib/brand";
import { trackWhatsAppClick } from "@/lib/gtag";

const PURPOSES = [
  {
    id: "gamer_fhd",
    label: "Jogos Full HD & Competitivo",
    desc: "CS2, Valorant, Warzone, GTA V e Fortnite com alto FPS",
    presetCpu: "ryzen5",
    presetGpu: "rtx4060",
    presetRam: "16gb",
    presetSsd: "1tb",
    presetCabinet: "aquario_air",
  },
  {
    id: "gamer_ultra",
    label: "Jogos no Ultra / Quad HD & 4K",
    desc: "Jogos AAA pesados com Ray Tracing e DLSS",
    presetCpu: "ryzen7",
    presetGpu: "rtx4070",
    presetRam: "32gb",
    presetSsd: "1tb",
    presetCabinet: "aquario_wc",
  },
  {
    id: "workstation",
    label: "Arquitetura, Engenharia & 3D",
    desc: "AutoCAD, Revit, SketchUp, Lumion e Premiere Pro",
    presetCpu: "corei7",
    presetGpu: "rtx4070",
    presetRam: "32gb",
    presetSsd: "1tb",
    presetCabinet: "executivo",
  },
  {
    id: "office",
    label: "Escritório Rápido & Estudos",
    desc: "Sistemas comerciais, contabilidade, clínicas e uso diário",
    presetCpu: "ryzen5",
    presetGpu: "integrado",
    presetRam: "16gb",
    presetSsd: "500gb",
    presetCabinet: "executivo",
  },
];

const CPUS = [
  { id: "ryzen5", label: "AMD Ryzen 5", sub: "Melhor custo-benefício p/ jogos e trabalho" },
  { id: "ryzen7", label: "AMD Ryzen 7 / 9", sub: "Alta performance p/ jogos e render" },
  { id: "corei5", label: "Intel Core i5", sub: "Desempenho sólido em multitarefa" },
  { id: "corei7", label: "Intel Core i7 / i9", sub: "Máxima capacidade p/ workstations" },
  { id: "consultoria", label: "Indicação da Loja", sub: "Deixar a equipe indicar o melhor hoje" },
];

const GPUS = [
  { id: "integrado", label: "Vídeo Integrado", sub: "Para escritório, estudos e jogos leves" },
  { id: "rtx4060", label: "GeForce RTX 4060 8GB", sub: "Ideal p/ Full HD Ultra e DLSS 3" },
  { id: "rtx4070", label: "RTX 4060 Ti / 4070 Super", sub: "Quad HD, 4K e Renderização 3D" },
  { id: "radeon", label: "Radeon RX 7600 / 7700 XT", sub: "Ótima performance por real investido" },
  { id: "consultoria_gpu", label: "Indicação da Loja", sub: "Dimensionar conforme meu orçamento" },
];

const RAMS = [
  { id: "16gb", label: "16GB (2x8GB Dual-Channel)", sub: "Padrão para jogos e escritório" },
  { id: "32gb", label: "32GB (2x16GB Dual-Channel)", sub: "Recomendado p/ jogos pesados e CAD" },
  { id: "64gb", label: "64GB (2x32GB Workstation)", sub: "Edição 4K e projetos complexos" },
];

const SSDS = [
  { id: "500gb", label: "SSD 500GB NVMe M.2", sub: "Sistema rápido + programas" },
  { id: "1tb", label: "SSD 1TB NVMe M.2 Gen4", sub: "Equilíbrio ideal p/ jogos e projetos" },
  { id: "2tb", label: "SSD 2TB NVMe M.2 Gen4", sub: "Espaço amplo de alta velocidade" },
];

const CABINETS = [
  { id: "aquario_air", label: "Gabinete Aquário + Air Cooler", sub: "Lateral de vidro e ótimo fluxo de ar" },
  { id: "aquario_wc", label: "Gabinete Aquário + Water Cooler", sub: "Estética limpa e refrigeração líquida" },
  { id: "executivo", label: "Gabinete Sóbrio Preto Fosco", sub: "Discreto sem RGB p/ escritórios" },
];

const STEPS = [
  { id: 1, short: "1. Perfil", title: "1. Objetivo" },
  { id: 2, short: "2. CPU/GPU", title: "2. CPU & Vídeo" },
  { id: 3, short: "3. RAM/SSD", title: "3. RAM & SSD" },
  { id: 4, short: "4. Gabinete", title: "4. Gabinete" },
];

export default function PCBuilderSection() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [purpose, setPurpose] = useState(PURPOSES[0].id);
  const [cpu, setCpu] = useState(CPUS[0].id);
  const [gpu, setGpu] = useState(GPUS[1].id);
  const [ram, setRam] = useState(RAMS[0].id);
  const [ssd, setSsd] = useState(SSDS[1].id);
  const [cabinet, setCabinet] = useState(CABINETS[0].id);
  const [peripherals, setPeripherals] = useState<"somente_pc" | "completo">("somente_pc");
  const [notes, setNotes] = useState("");

  const selectedPurpose = PURPOSES.find((p) => p.id === purpose) || PURPOSES[0];
  const selectedCpu = CPUS.find((c) => c.id === cpu) || CPUS[0];
  const selectedGpu = GPUS.find((g) => g.id === gpu) || GPUS[1];
  const selectedRam = RAMS.find((r) => r.id === ram) || RAMS[0];
  const selectedSsd = SSDS.find((s) => s.id === ssd) || SSDS[1];
  const selectedCabinet = CABINETS.find((c) => c.id === cabinet) || CABINETS[0];

  const handlePresetPurpose = (newPurposeId: string) => {
    setPurpose(newPurposeId);
    const p = PURPOSES.find((item) => item.id === newPurposeId);
    if (p) {
      setCpu(p.presetCpu);
      setGpu(p.presetGpu);
      setRam(p.presetRam);
      setSsd(p.presetSsd);
      setCabinet(p.presetCabinet);
    }
  };

  const resetBuilder = () => {
    handlePresetPurpose("gamer_fhd");
    setPeripherals("somente_pc");
    setNotes("");
    setActiveStep(1);
  };

  const waMessage = [
    `Olá! Montei uma configuração no *PC Builder* do site da Cyber Informática e gostaria de um orçamento:`,
    `• *Objetivo:* ${selectedPurpose.label}`,
    `• *Processador:* ${selectedCpu.label}`,
    `• *Placa de Vídeo:* ${selectedGpu.label}`,
    `• *Memória RAM:* ${selectedRam.label}`,
    `• *Armazenamento:* ${selectedSsd.label}`,
    `• *Gabinete:* ${selectedCabinet.label}`,
    `• *Formato:* ${peripherals === "completo" ? "PC + Monitor, Teclado e Mouse" : "Somente o Gabinete Completo"}`,
    notes.trim() ? `• *Obs / Orçamento alvo:* ${notes.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const waUrl = `https://wa.me/55${brand.whatsapp}?text=${encodeURIComponent(waMessage)}`;

  return (
    <section id="pc-builder" className="py-12 sm:py-20 bg-[#09090b] text-white border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho Enxuto */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 sm:gap-4 pb-6 sm:pb-8 border-b border-zinc-800">
          <div>
            <div className="font-mono text-[11px] sm:text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5 sm:mb-2">
              02 // PC BUILDER SOB MEDIDA
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Monte Seu PC e Peça Orçamento em 1 Clique.
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md">
            Escolha o perfil na Aba 1 para carregar nossa recomendação na hora — ou navegue pelas 4 abas para personalizar cada peça.
          </p>
        </div>

        {/* Console Compacto em Abas (Apenas 1 Etapa Visível por Vez = Zero Poluição) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:divide-x lg:divide-zinc-800 border-x border-b border-zinc-800">
          {/* Coluna Esquerda (8 cols): Navegação por 4 Abas */}
          <div className="lg:col-span-8 flex flex-col justify-between">
            <div>
              {/* Barra de 4 Abas em 1 Única Linha Horizontal no Mobile & Desktop */}
              <div className="grid grid-cols-4 gap-px bg-zinc-800 border-b border-zinc-800">
                {STEPS.map((st) => {
                  const isCurrent = activeStep === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setActiveStep(st.id)}
                      className={`py-3 px-1.5 sm:py-3.5 sm:px-4 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-tight sm:tracking-wider text-center sm:text-left transition-colors cursor-pointer ${
                        isCurrent
                          ? "bg-white text-black"
                          : "bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-900"
                      }`}
                    >
                      <span className="sm:hidden">{st.short}</span>
                      <span className="hidden sm:inline">{st.title}</span>
                    </button>
                  );
                })}
              </div>

              {/* Faixa "Sua Máquina Ao Vivo" no Topo Mobile (Permite ver a config e pedir orçamento sem rolar até o fim!) */}
              <div className="lg:hidden bg-zinc-900/90 border-b border-zinc-800 px-3.5 py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400 block">
                    CONFIGURAÇÃO SELECIONADA:
                  </span>
                  <strong className="font-mono text-[11px] font-bold text-white block truncate">
                    {selectedCpu.label} · {selectedGpu.label} · {selectedRam.id.toUpperCase()} · {selectedSsd.id.toUpperCase()}
                  </strong>
                </div>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackWhatsAppClick("pc_builder_mobile_top")}
                  className="bg-white text-black font-mono text-[10px] font-bold uppercase px-2.5 py-2 shrink-0 flex items-center gap-1"
                >
                  <span>Orçar</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>

              {/* Conteúdo da Aba Ativa */}
              <div className="p-4 sm:p-8">
                {activeStep === 1 && (
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3.5 sm:mb-4">
                      <span className="font-mono text-xs font-bold uppercase text-zinc-300">
                        QUAL O OBJETIVO PRINCIPAL DA MÁQUINA?
                      </span>
                      <span className="font-mono text-[10px] uppercase text-zinc-500 hidden sm:inline">
                        PREENCHE AS PEÇAS AUTOMATICAMENTE
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                      {PURPOSES.map((item) => {
                        const active = purpose === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handlePresetPurpose(item.id)}
                            className={`p-3.5 sm:p-4 text-left border transition-colors cursor-pointer ${
                              active
                                ? "bg-white text-black border-white"
                                : "bg-zinc-900/60 text-zinc-200 border-zinc-800 hover:border-zinc-600"
                            }`}
                          >
                            <strong className="text-xs sm:text-sm font-extrabold block mb-0.5 sm:mb-1">
                              {item.label}
                            </strong>
                            <span
                              className={`text-[11px] sm:text-xs block leading-snug ${
                                active ? "text-zinc-700" : "text-zinc-400"
                              }`}
                            >
                              {item.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="space-y-5">
                    <div>
                      <div className="font-mono text-xs font-bold uppercase text-zinc-300 mb-2.5">
                        PROCESSADOR (AMD RYZEN OU INTEL CORE)
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {CPUS.map((item, idx) => {
                          const active = cpu === item.id;
                          const isLast = idx === CPUS.length - 1;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setCpu(item.id)}
                              className={`p-2.5 sm:p-3 text-left border transition-colors cursor-pointer ${
                                isLast ? "col-span-2 sm:col-span-1" : ""
                              } ${
                                active
                                  ? "bg-white text-black border-white"
                                  : "bg-zinc-900/60 text-zinc-200 border-zinc-800 hover:border-zinc-600"
                              }`}
                            >
                              <strong className="text-xs font-extrabold block mb-0.5">
                                {item.label}
                              </strong>
                              <span
                                className={`text-[10px] sm:text-[11px] block leading-tight ${
                                  active ? "text-zinc-700" : "text-zinc-400"
                                }`}
                              >
                                {item.sub}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="font-mono text-xs font-bold uppercase text-zinc-300 mb-2.5">
                        PLACA DE VÍDEO (GPU)
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {GPUS.map((item, idx) => {
                          const active = gpu === item.id;
                          const isLast = idx === GPUS.length - 1;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setGpu(item.id)}
                              className={`p-2.5 sm:p-3 text-left border transition-colors cursor-pointer ${
                                isLast ? "col-span-2 sm:col-span-1" : ""
                              } ${
                                active
                                  ? "bg-white text-black border-white"
                                  : "bg-zinc-900/60 text-zinc-200 border-zinc-800 hover:border-zinc-600"
                              }`}
                            >
                              <strong className="text-xs font-extrabold block mb-0.5">
                                {item.label}
                              </strong>
                              <span
                                className={`text-[10px] sm:text-[11px] block leading-tight ${
                                  active ? "text-zinc-700" : "text-zinc-400"
                                }`}
                              >
                                {item.sub}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <div className="font-mono text-xs font-bold uppercase text-zinc-300 mb-2.5">
                        MEMÓRIA RAM
                      </div>
                      <div className="space-y-2">
                        {RAMS.map((item) => {
                          const active = ram === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setRam(item.id)}
                              className={`w-full p-3 text-left border transition-colors cursor-pointer ${
                                active
                                  ? "bg-white text-black border-white"
                                  : "bg-zinc-900/60 text-zinc-200 border-zinc-800 hover:border-zinc-600"
                              }`}
                            >
                              <strong className="text-xs sm:text-sm font-extrabold block">
                                {item.label}
                              </strong>
                              <span
                                className={`text-[11px] block mt-0.5 ${
                                  active ? "text-zinc-700" : "text-zinc-400"
                                }`}
                              >
                                {item.sub}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="font-mono text-xs font-bold uppercase text-zinc-300 mb-2.5">
                        ARMAZENAMENTO SSD NVME
                      </div>
                      <div className="space-y-2">
                        {SSDS.map((item) => {
                          const active = ssd === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setSsd(item.id)}
                              className={`w-full p-3 text-left border transition-colors cursor-pointer ${
                                active
                                  ? "bg-white text-black border-white"
                                  : "bg-zinc-900/60 text-zinc-200 border-zinc-800 hover:border-zinc-600"
                              }`}
                            >
                              <strong className="text-xs sm:text-sm font-extrabold block">
                                {item.label}
                              </strong>
                              <span
                                className={`text-[11px] block mt-0.5 ${
                                  active ? "text-zinc-700" : "text-zinc-400"
                                }`}
                              >
                                {item.sub}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === 4 && (
                  <div className="space-y-4">
                    <div>
                      <div className="font-mono text-xs font-bold uppercase text-zinc-300 mb-2.5">
                        ESTÉTICA DO GABINETE & REFRIGERAÇÃO
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {CABINETS.map((item) => {
                          const active = cabinet === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setCabinet(item.id)}
                              className={`p-3 text-left border transition-colors cursor-pointer ${
                                active
                                  ? "bg-white text-black border-white"
                                  : "bg-zinc-900/60 text-zinc-200 border-zinc-800 hover:border-zinc-600"
                              }`}
                            >
                              <strong className="text-xs font-extrabold block mb-0.5">
                                {item.label}
                              </strong>
                              <span
                                className={`text-[11px] block leading-snug ${
                                  active ? "text-zinc-700" : "text-zinc-400"
                                }`}
                              >
                                {item.sub}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block font-mono text-[11px] uppercase text-zinc-400 mb-1.5">
                          PRECISA DE MONITOR E KIT?
                        </label>
                        <div className="grid grid-cols-2 border border-zinc-700">
                          <button
                            type="button"
                            onClick={() => setPeripherals("somente_pc")}
                            className={`py-2.5 px-3 font-mono text-xs font-bold uppercase cursor-pointer min-h-[42px] ${
                              peripherals === "somente_pc"
                                ? "bg-white text-black"
                                : "bg-zinc-900 text-zinc-400 hover:text-white"
                            }`}
                          >
                            Só o PC
                          </button>
                          <button
                            type="button"
                            onClick={() => setPeripherals("completo")}
                            className={`py-2.5 px-3 font-mono text-xs font-bold uppercase cursor-pointer min-h-[42px] ${
                              peripherals === "completo"
                                ? "bg-white text-black"
                                : "bg-zinc-900 text-zinc-400 hover:text-white"
                            }`}
                          >
                            PC + Monitor
                          </button>
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="pc-builder-notes"
                          className="block font-mono text-[11px] uppercase text-zinc-400 mb-1.5"
                        >
                          ORÇAMENTO ALVO OU USADO NA TROCA (OPCIONAL)
                        </label>
                        <input
                          id="pc-builder-notes"
                          type="text"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Ex: Até R$ 4.500 / Tenho notebook p/ troca"
                          className="w-full bg-zinc-900 border border-zinc-700 px-3.5 py-2.5 text-base sm:text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white min-h-[42px]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rodapé de Navegação entre Abas */}
            <div className="px-4 sm:px-6 py-3.5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-3">
              {activeStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setActiveStep(activeStep - 1)}
                  className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-zinc-300 hover:text-white cursor-pointer py-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                  <span>Anterior</span>
                </button>
              ) : (
                <span className="font-mono text-[10px] sm:text-[11px] text-zinc-400">
                  <span className="sm:hidden">Recomendação pronta ↓</span>
                  <span className="hidden sm:inline">Peças recomendadas já selecionadas ao lado →</span>
                </span>
              )}

              {activeStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setActiveStep(activeStep + 1)}
                  className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase px-3.5 sm:px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white cursor-pointer"
                >
                  <span>Ajustar {STEPS[activeStep].short}</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              ) : (
                <span className="font-mono text-xs font-bold text-white uppercase">
                  Configuração Pronta ✓
                </span>
              )}
            </div>
          </div>

          {/* Coluna Direita (4 cols): Ficha Compacta + CTA Direto */}
          <div className="lg:col-span-4 p-4 sm:p-8 bg-zinc-950 flex flex-col justify-between border-t lg:border-t-0 border-zinc-800">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                  SUA CONFIGURAÇÃO
                </span>
                <button
                  type="button"
                  onClick={resetBuilder}
                  className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Resetar</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4 sm:mb-5 text-xs">
                <div className="p-2.5 bg-zinc-900 border border-zinc-800 col-span-2 min-w-0">
                  <span className="font-mono text-[10px] uppercase text-zinc-500 block">OBJETIVO</span>
                  <strong className="text-white font-bold block leading-snug">{selectedPurpose.label}</strong>
                </div>
                <div className="p-2.5 bg-zinc-900 border border-zinc-800 min-w-0">
                  <span className="font-mono text-[10px] uppercase text-zinc-500 block">PROCESSADOR</span>
                  <strong className="text-white font-bold block leading-snug">{selectedCpu.label}</strong>
                </div>
                <div className="p-2.5 bg-zinc-900 border border-zinc-800 min-w-0">
                  <span className="font-mono text-[10px] uppercase text-zinc-500 block">PLACA DE VÍDEO</span>
                  <strong className="text-white font-bold block leading-snug">{selectedGpu.label}</strong>
                </div>
                <div className="p-2.5 bg-zinc-900 border border-zinc-800 min-w-0">
                  <span className="font-mono text-[10px] uppercase text-zinc-500 block">MEMÓRIA RAM</span>
                  <strong className="text-white font-bold block leading-snug">{selectedRam.label}</strong>
                </div>
                <div className="p-2.5 bg-zinc-900 border border-zinc-800 min-w-0">
                  <span className="font-mono text-[10px] uppercase text-zinc-500 block">SSD NVME</span>
                  <strong className="text-white font-bold block leading-snug">{selectedSsd.label}</strong>
                </div>
                <div className="p-2.5 bg-zinc-900 border border-zinc-800 col-span-2 min-w-0">
                  <span className="font-mono text-[10px] uppercase text-zinc-500 block">GABINETE & EXTRAS</span>
                  <strong className="text-zinc-200 font-bold block leading-snug">
                    {selectedCabinet.label} · {peripherals === "completo" ? "Com Monitor/Kit" : "Só o Gabinete"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackWhatsAppClick("pc_builder_submit")}
                className="w-full bg-white hover:bg-zinc-200 text-black font-mono font-bold uppercase tracking-wider py-4 px-5 text-xs flex items-center justify-center gap-2 transition-colors min-h-[48px]"
              >
                <span>Pedir Orçamento no WhatsApp</span>
                <ArrowUpRight className="w-4 h-4 shrink-0" />
              </a>
              <p className="text-[11px] font-mono text-zinc-500 text-center">
                Enviamos o valor à vista e em 12x no seu WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
