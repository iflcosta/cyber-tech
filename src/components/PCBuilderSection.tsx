"use client";

import { useState } from "react";
import { ArrowUpRight, RotateCcw, Check } from "lucide-react";
import { brand } from "@/lib/brand";
import { trackWhatsAppClick } from "@/lib/gtag";

const PURPOSES = [
  {
    id: "gamer_fhd",
    label: "Jogos Competitivos & Full HD",
    desc: "CS2, Valorant, Warzone, GTA V, Fortnite, EA FC com alto FPS",
    presetCpu: "ryzen5",
    presetGpu: "rtx4060",
    presetRam: "16gb",
    presetSsd: "1tb",
    presetCabinet: "aquario_air",
  },
  {
    id: "gamer_ultra",
    label: "Jogos no Ultra / Quad HD & 4K",
    desc: "Jogos AAA pesados com Ray Tracing, DLSS e máxima qualidade gráfica",
    presetCpu: "ryzen7",
    presetGpu: "rtx4070",
    presetRam: "32gb",
    presetSsd: "1tb",
    presetCabinet: "aquario_wc",
  },
  {
    id: "workstation",
    label: "Arquitetura, Engenharia & Edição",
    desc: "AutoCAD, Revit, SketchUp, Lumion, SolidWorks, Premiere Pro e 3D",
    presetCpu: "corei7",
    presetGpu: "rtx4070",
    presetRam: "32gb",
    presetSsd: "1tb",
    presetCabinet: "executivo",
  },
  {
    id: "office",
    label: "Escritório Rápido, Comércio & Estudos",
    desc: "Multitarefa ágil, sistemas comerciais, contabilidade, clínicas e uso diário",
    presetCpu: "ryzen5",
    presetGpu: "integrado",
    presetRam: "16gb",
    presetSsd: "500gb",
    presetCabinet: "executivo",
  },
];

const CPUS = [
  { id: "ryzen5", label: "AMD Ryzen 5", sub: "Excelente custo-benefício para jogos e trabalho" },
  { id: "ryzen7", label: "AMD Ryzen 7 / Ryzen 9", sub: "Alta performance para jogos pesados e renderização" },
  { id: "corei5", label: "Intel Core i5", sub: "Desempenho sólido em jogos e multitarefa" },
  { id: "corei7", label: "Intel Core i7 / Core i9", sub: "Máxima capacidade para workstations e entusiastas" },
  { id: "consultoria", label: "Indicação Técnica da Loja", sub: "Deixar a equipe indicar o melhor custo-benefício hoje" },
];

const GPUS = [
  { id: "integrado", label: "Vídeo Integrado (Sem Placa Dedicada)", sub: "Ideal para escritório, estudos e jogos leves" },
  { id: "rtx4060", label: "GeForce RTX 4060 8GB", sub: "A mais procurada para Full HD Ultra e DLSS 3" },
  { id: "rtx4070", label: "GeForce RTX 4060 Ti / 4070 Super", sub: "Alta performance para Quad HD, 4K e Render 3D" },
  { id: "radeon", label: "AMD Radeon RX 7600 / 7700 XT", sub: "Excelente performance bruta por real investido" },
  { id: "consultoria_gpu", label: "Me Indique a Melhor Opção", sub: "Dimensionar conforme meu orçamento e objetivo" },
];

const RAMS = [
  { id: "16gb", label: "16GB (2x8GB Dual-Channel)", sub: "Padrão ideal para jogos atuais e escritório avançado" },
  { id: "32gb", label: "32GB (2x16GB Dual-Channel)", sub: "Recomendado para longevidade, jogos pesados e projetos" },
  { id: "64gb", label: "64GB (2x32GB Workstation)", sub: "Para edição 4K, modelagem 3D pesada e virtualização" },
];

const SSDS = [
  { id: "500gb", label: "SSD 500GB NVMe M.2", sub: "Sistema rápido + programas principais" },
  { id: "1tb", label: "SSD 1TB NVMe M.2 Gen4", sub: "O mais equilibrado para vários jogos e arquivos" },
  { id: "2tb", label: "SSD 2TB NVMe M.2 Gen4", sub: "Espaço amplo de altíssima velocidade" },
];

const CABINETS = [
  { id: "aquario_air", label: "Gabinete Aquário Vidro + Air Cooler", sub: "Visual moderno com lateral transparente e ótimo fluxo de ar" },
  { id: "aquario_wc", label: "Gabinete Aquário + Water Cooler 240/360mm", sub: "Estética limpa e refrigeração líquida silenciosa" },
  { id: "executivo", label: "Gabinete Sóbrio Preto Fosco (Discreto)", sub: "Visual executivo sem luzes RGB para escritórios ou setups minimalistas" },
];

export default function PCBuilderSection() {
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
  };

  const waMessage = [
    `Olá! Montei uma configuração no *PC Builder* do site da Cyber Informática e gostaria de receber um orçamento:`,
    `*1. Objetivo:* ${selectedPurpose.label}`,
    `*2. Processador:* ${selectedCpu.label}`,
    `*3. Placa de Vídeo:* ${selectedGpu.label}`,
    `*4. Memória RAM:* ${selectedRam.label}`,
    `*5. Armazenamento:* ${selectedSsd.label}`,
    `*6. Gabinete & Cooler:* ${selectedCabinet.label}`,
    `*7. Periféricos:* ${peripherals === "completo" ? "Incluir Monitor, Teclado e Mouse" : "Somente o Computador (Gabinete Completo)"}`,
    notes.trim() ? `*Observações / Jogos / Orçamento alvo:* ${notes.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const waUrl = `https://wa.me/55${brand.whatsapp}?text=${encodeURIComponent(waMessage)}`;

  return (
    <section id="pc-builder" className="py-16 sm:py-24 bg-[#09090b] text-white border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10 border-b border-zinc-800 items-end">
          <div className="lg:col-span-8">
            <div className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
              02 // CONFIGURADOR SOB MEDIDA · PC BUILDER CYBER
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.05]">
              Monte Seu Computador e Peça o Orçamento na Hora.
            </h2>
          </div>
          <div className="lg:col-span-4">
            <p className="text-sm text-zinc-400 leading-relaxed">
              Escolha o seu objetivo no Passo 01 para carregar automaticamente uma recomendação da nossa bancada — ou personalize peça por peça abaixo.
            </p>
          </div>
        </div>

        {/* Grid Principal: 8 Colunas de Seleção + 4 Colunas de Ficha Técnica Sticky */}
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:divide-x lg:divide-zinc-800 border-x border-b border-zinc-800">
          {/* Coluna Esquerda: Passos */}
          <div className="lg:col-span-8 divide-y divide-zinc-800">
            {/* Passo 1: Objetivo + Preset Rápido */}
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-300">
                  PASSO 01 / QUAL O OBJETIVO PRINCIPAL DA MÁQUINA?
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 bg-zinc-800 text-zinc-300">
                  SELECIONA AS PEÇAS RECOMENDADAS AUTOMATICAMENTE
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PURPOSES.map((item) => {
                  const active = purpose === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handlePresetPurpose(item.id)}
                      className={`p-4 text-left border transition-colors cursor-pointer ${
                        active
                          ? "bg-white text-black border-white"
                          : "bg-zinc-900/60 text-zinc-200 border-zinc-800 hover:border-zinc-600"
                      }`}
                    >
                      <strong className="text-sm font-extrabold block mb-1">
                        {item.label}
                      </strong>
                      <span
                        className={`text-xs block leading-snug ${
                          active ? "text-zinc-700" : "text-zinc-400"
                        }`}
                      >
                        {item.desc}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Box de Conversão Rápida em 1 Clique para Clientes Leigos */}
              <div className="mt-5 p-4 bg-zinc-900 border border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase text-white mb-1">
                    <Check className="w-3.5 h-3.5 text-white shrink-0" />
                    <span>RECOMENDAÇÃO PRONTA PARA {selectedPurpose.label.toUpperCase()}:</span>
                  </div>
                  <p className="text-xs font-mono text-zinc-300">
                    {selectedCpu.label} · {selectedGpu.label} · {selectedRam.label} · {selectedSsd.label}
                  </p>
                </div>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackWhatsAppClick("pc_builder_quick_preset")}
                  className="bg-white hover:bg-zinc-200 text-black font-mono font-bold uppercase tracking-wider py-2.5 px-4 text-[11px] shrink-0 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Orçar Recomendação</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Passo 2: Processador */}
            <div className="p-6 sm:p-8">
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-300 mb-4">
                PASSO 02 / PROCESSADOR (PLATAFORMA AMD OU INTEL)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {CPUS.map((item) => {
                  const active = cpu === item.id;
                  const isRec = selectedPurpose.presetCpu === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCpu(item.id)}
                      className={`p-3.5 text-left border transition-colors cursor-pointer ${
                        active
                          ? "bg-white text-black border-white"
                          : "bg-zinc-900/60 text-zinc-200 border-zinc-800 hover:border-zinc-600"
                      }`}
                    >
                      {isRec && (
                        <span
                          className={`inline-block font-mono text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 mb-1.5 ${
                            active ? "bg-black text-white" : "bg-zinc-800 text-zinc-300"
                          }`}
                        >
                          ★ Recomendado p/ seu perfil
                        </span>
                      )}
                      <strong className="text-xs sm:text-sm font-extrabold block mb-1">
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

            {/* Passo 3: Placa de Vídeo */}
            <div className="p-6 sm:p-8">
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-300 mb-4">
                PASSO 03 / PLACA DE VÍDEO (GPU)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {GPUS.map((item) => {
                  const active = gpu === item.id;
                  const isRec = selectedPurpose.presetGpu === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setGpu(item.id)}
                      className={`p-3.5 text-left border transition-colors cursor-pointer ${
                        active
                          ? "bg-white text-black border-white"
                          : "bg-zinc-900/60 text-zinc-200 border-zinc-800 hover:border-zinc-600"
                      }`}
                    >
                      {isRec && (
                        <span
                          className={`inline-block font-mono text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 mb-1.5 ${
                            active ? "bg-black text-white" : "bg-zinc-800 text-zinc-300"
                          }`}
                        >
                          ★ Recomendado p/ seu perfil
                        </span>
                      )}
                      <strong className="text-xs sm:text-sm font-extrabold block mb-1">
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

            {/* Passo 4 e 5: Memória RAM + SSD NVMe */}
            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-300 mb-3">
                  PASSO 04 / MEMÓRIA RAM
                </div>
                <div className="space-y-2.5">
                  {RAMS.map((item) => {
                    const active = ram === item.id;
                    const isRec = selectedPurpose.presetRam === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setRam(item.id)}
                        className={`w-full p-3.5 text-left border transition-colors cursor-pointer ${
                          active
                            ? "bg-white text-black border-white"
                            : "bg-zinc-900/60 text-zinc-200 border-zinc-800 hover:border-zinc-600"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-xs sm:text-sm font-extrabold block">
                            {item.label}
                          </strong>
                          {isRec && (
                            <span
                              className={`font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 ${
                                active ? "bg-black text-white" : "bg-zinc-800 text-zinc-300"
                              }`}
                            >
                              ★ Ideal
                            </span>
                          )}
                        </div>
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
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-300 mb-3">
                  PASSO 05 / ARMAZENAMENTO SSD NVME
                </div>
                <div className="space-y-2.5">
                  {SSDS.map((item) => {
                    const active = ssd === item.id;
                    const isRec = selectedPurpose.presetSsd === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSsd(item.id)}
                        className={`w-full p-3.5 text-left border transition-colors cursor-pointer ${
                          active
                            ? "bg-white text-black border-white"
                            : "bg-zinc-900/60 text-zinc-200 border-zinc-800 hover:border-zinc-600"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-xs sm:text-sm font-extrabold block">
                            {item.label}
                          </strong>
                          {isRec && (
                            <span
                              className={`font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 ${
                                active ? "bg-black text-white" : "bg-zinc-800 text-zinc-300"
                              }`}
                            >
                              ★ Ideal
                            </span>
                          )}
                        </div>
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

            {/* Passo 6: Gabinete, Periféricos e Observações */}
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-300 mb-3">
                  PASSO 06 / ESTÉTICA DO GABINETE & REFRIGERAÇÃO
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {CABINETS.map((item) => {
                    const active = cabinet === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setCabinet(item.id)}
                        className={`p-3.5 text-left border transition-colors cursor-pointer ${
                          active
                            ? "bg-white text-black border-white"
                            : "bg-zinc-900/60 text-zinc-200 border-zinc-800 hover:border-zinc-600"
                        }`}
                      >
                        <strong className="text-xs font-extrabold block mb-1">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-zinc-400 mb-2">
                    PRECISA DE MONITOR, TECLADO E MOUSE?
                  </label>
                  <div className="grid grid-cols-2 border border-zinc-700">
                    <button
                      type="button"
                      onClick={() => setPeripherals("somente_pc")}
                      className={`py-2.5 px-3 font-mono text-xs font-bold uppercase cursor-pointer ${
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
                      className={`py-2.5 px-3 font-mono text-xs font-bold uppercase cursor-pointer ${
                        peripherals === "completo"
                          ? "bg-white text-black"
                          : "bg-zinc-900 text-zinc-400 hover:text-white"
                      }`}
                    >
                      PC + Monitor/Kit
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="pc-builder-notes"
                    className="block font-mono text-[11px] uppercase tracking-wider text-zinc-400 mb-2"
                  >
                    JOGO, PROGRAMA OU ORÇAMENTO ALVO (OPCIONAL)
                  </label>
                  <input
                    id="pc-builder-notes"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Quero gastar até R$ 4.500 / Tenho PC usado p/ troca"
                    className="w-full bg-zinc-900 border border-zinc-700 px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Ficha Técnica Sticky (Sem espaço vazio no desktop) */}
          <div className="lg:col-span-4 bg-zinc-950 border-t lg:border-t-0 border-zinc-800">
            <div className="p-6 sm:p-8 lg:sticky lg:top-24">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                  RESUMO DA SUA MÁQUINA
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

              <div className="divide-y divide-zinc-800 border-b border-zinc-800 text-xs mb-5">
                <div className="py-2.5">
                  <span className="font-mono text-[10px] uppercase text-zinc-500 block">
                    01 · OBJETIVO
                  </span>
                  <strong className="text-white font-bold block mt-0.5">
                    {selectedPurpose.label}
                  </strong>
                </div>
                <div className="py-2.5">
                  <span className="font-mono text-[10px] uppercase text-zinc-500 block">
                    02 · PROCESSADOR
                  </span>
                  <strong className="text-white font-bold block mt-0.5">
                    {selectedCpu.label}
                  </strong>
                </div>
                <div className="py-2.5">
                  <span className="font-mono text-[10px] uppercase text-zinc-500 block">
                    03 · PLACA DE VÍDEO (GPU)
                  </span>
                  <strong className="text-white font-bold block mt-0.5">
                    {selectedGpu.label}
                  </strong>
                </div>
                <div className="py-2.5">
                  <span className="font-mono text-[10px] uppercase text-zinc-500 block">
                    04 · MEMÓRIA RAM
                  </span>
                  <strong className="text-white font-bold block mt-0.5">
                    {selectedRam.label}
                  </strong>
                </div>
                <div className="py-2.5">
                  <span className="font-mono text-[10px] uppercase text-zinc-500 block">
                    05 · ARMAZENAMENTO SSD
                  </span>
                  <strong className="text-white font-bold block mt-0.5">
                    {selectedSsd.label}
                  </strong>
                </div>
                <div className="py-2.5">
                  <span className="font-mono text-[10px] uppercase text-zinc-500 block">
                    06 · GABINETE & COOLER
                  </span>
                  <strong className="text-white font-bold block mt-0.5">
                    {selectedCabinet.label}
                  </strong>
                </div>
                <div className="py-2.5">
                  <span className="font-mono text-[10px] uppercase text-zinc-500 block">
                    07 · FORMATO DO ORÇAMENTO
                  </span>
                  <strong className="text-zinc-300 font-bold block mt-0.5">
                    {peripherals === "completo"
                      ? "PC + Monitor, Teclado e Mouse"
                      : "Somente o Gabinete Completo"}
                  </strong>
                </div>
              </div>

              <div className="border border-zinc-800 bg-zinc-900/50 p-4 mb-5 text-xs text-zinc-300 space-y-1.5">
                <div className="font-mono text-[11px] font-bold text-white uppercase">
                  INCLUSO EM TODA MONTAGEM CYBER:
                </div>
                <p>— Montagem limpa com organização profissional de cabos</p>
                <p>— Atualização de BIOS, perfil XMP/EXPO e sistema instalado</p>
                <p>— Aceitamos seu PC/notebook usado como parte do pagamento</p>
              </div>

              <div className="space-y-3">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackWhatsAppClick("pc_builder_submit")}
                  className="w-full bg-white hover:bg-zinc-200 text-black font-mono font-bold uppercase tracking-wider py-4 px-6 text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Pedir Orçamento Desta Máquina</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
                <p className="text-[11px] font-mono text-zinc-500 text-center">
                  Abre o WhatsApp da loja já com toda a ficha preenchida.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
