"use client";

import { useState } from "react";
import { ArrowUpRight, RotateCcw } from "lucide-react";
import { brand } from "@/lib/brand";
import TrackedWhatsAppLink from "./TrackedWhatsAppLink";

const PURPOSE_OPTIONS = [
  {
    id: "gamer_fhd",
    label: "Jogos Competitivos & Full HD",
    detail: "CS2, Valorant, Warzone, GTA V, Fortnite, FIFA/EA FC com alto FPS",
  },
  {
    id: "gamer_ultra",
    label: "Jogos no Ultra / Quad HD & 4K",
    detail: "Jogos AAA pesados com Ray Tracing, DLSS e máxima qualidade gráfica",
  },
  {
    id: "workstation",
    label: "Arquitetura, Engenharia & Edição",
    detail: "AutoCAD, Revit, SketchUp, Lumion, SolidWorks, Premiere Pro e 3D",
  },
  {
    id: "office",
    label: "Escritório Rápido, Comércio & Estudos",
    detail: "Multitarefa ágil, sistemas comerciais, contabilidade, clínicas e uso diário",
  },
] as const;

const CPU_OPTIONS = [
  { id: "ryzen5", label: "AMD Ryzen 5", detail: "Excelente custo-benefício para jogos e trabalho" },
  { id: "ryzen7", label: "AMD Ryzen 7 / Ryzen 9", detail: "Alta performance para jogos pesados e renderização" },
  { id: "i5", label: "Intel Core i5", detail: "Desempenho sólido em jogos e multitarefa" },
  { id: "i7", label: "Intel Core i7 / Core i9", detail: "Máxima capacidade para workstations e entusiastas" },
  { id: "indiferente", label: "Indicação Técnica da Loja", detail: "Deixar a equipe indicar o melhor custo-benefício hoje" },
] as const;

const GPU_OPTIONS = [
  { id: "integrada", label: "Vídeo Integrado (Sem Placa Dedicada)", detail: "Ideal para escritório, estudos e jogos leves" },
  { id: "rtx4060", label: "GeForce RTX 4060 8GB", detail: "A mais procurada para Full HD Ultra e DLSS 3" },
  { id: "rtx4070", label: "GeForce RTX 4060 Ti / 4070 Super", detail: "Alta performance para Quad HD, 4K e Render 3D" },
  { id: "radeon", label: "AMD Radeon RX 7600 / 7700 XT", detail: "Excelente performance bruta por real investido" },
  { id: "indiferente_gpu", label: "Me Indique a Melhor Opção", detail: "Dimensionar conforme meu orçamento e objetivo" },
] as const;

const RAM_OPTIONS = [
  { id: "16gb", label: "16GB (2x8GB Dual-Channel)", detail: "Padrão ideal para jogos atuais e escritório avançado" },
  { id: "32gb", label: "32GB (2x16GB Dual-Channel)", detail: "Recomendado para longevidade, jogos pesados e projetos" },
  { id: "64gb", label: "64GB (2x32GB Workstation)", detail: "Para edição 4K, modelagem 3D pesada e virtualização" },
] as const;

const STORAGE_OPTIONS = [
  { id: "500gb", label: "SSD 500GB NVMe M.2", detail: "Sistema rápido + programas principais" },
  { id: "1tb", label: "SSD 1TB NVMe M.2 Gen4", detail: "O mais equilibrado para vários jogos e arquivos" },
  { id: "2tb", label: "SSD 2TB NVMe M.2 Gen4", detail: "Espaço amplo de altíssima velocidade" },
] as const;

const CASE_OPTIONS = [
  { id: "aquario_air", label: "Gabinete Aquário Vidro + Air Cooler", detail: "Visual moderno com lateral transparente e ótimo fluxo de ar" },
  { id: "aquario_wc", label: "Gabinete Aquário + Water Cooler 240/360mm", detail: "Estética limpa e refrigeração líquida silenciosa" },
  { id: "sobrio", label: "Gabinete Sóbrio Preto Fosco (Discreto)", detail: "Visual executivo sem luzes RGB para escritórios ou setups minimalistas" },
] as const;

export default function PCBuilderSection() {
  const [purpose, setPurpose] = useState<string>(PURPOSE_OPTIONS[0].id);
  const [cpu, setCpu] = useState<string>(CPU_OPTIONS[0].id);
  const [gpu, setGpu] = useState<string>(GPU_OPTIONS[1].id);
  const [ram, setRam] = useState<string>(RAM_OPTIONS[0].id);
  const [storage, setStorage] = useState<string>(STORAGE_OPTIONS[1].id);
  const [chassis, setChassis] = useState<string>(CASE_OPTIONS[0].id);
  const [peripherals, setPeripherals] = useState<"only_pc" | "complete">("only_pc");
  const [customNotes, setCustomNotes] = useState("");

  const selectedPurpose = PURPOSE_OPTIONS.find((o) => o.id === purpose) ?? PURPOSE_OPTIONS[0];
  const selectedCpu = CPU_OPTIONS.find((o) => o.id === cpu) ?? CPU_OPTIONS[0];
  const selectedGpu = GPU_OPTIONS.find((o) => o.id === gpu) ?? GPU_OPTIONS[1];
  const selectedRam = RAM_OPTIONS.find((o) => o.id === ram) ?? RAM_OPTIONS[0];
  const selectedStorage = STORAGE_OPTIONS.find((o) => o.id === storage) ?? STORAGE_OPTIONS[1];
  const selectedChassis = CASE_OPTIONS.find((o) => o.id === chassis) ?? CASE_OPTIONS[0];

  const handlePresetPurpose = (newPurpose: string) => {
    setPurpose(newPurpose);
    if (newPurpose === "office") {
      setCpu("ryzen5");
      setGpu("integrada");
      setRam("16gb");
      setStorage("500gb");
      setChassis("sobrio");
    } else if (newPurpose === "gamer_fhd") {
      setCpu("ryzen5");
      setGpu("rtx4060");
      setRam("16gb");
      setStorage("1tb");
      setChassis("aquario_air");
    } else if (newPurpose === "gamer_ultra" || newPurpose === "workstation") {
      setCpu("ryzen7");
      setGpu("rtx4070");
      setRam("32gb");
      setStorage("1tb");
      setChassis("aquario_wc");
    }
  };

  const whatsappBuilderMessage = [
    "Olá! Montei uma configuração no *PC Builder* do site da Cyber Informática e gostaria de receber um orçamento:",
    "",
    `*1. Objetivo:* ${selectedPurpose.label}`,
    `*2. Processador:* ${selectedCpu.label}`,
    `*3. Placa de Vídeo:* ${selectedGpu.label}`,
    `*4. Memória RAM:* ${selectedRam.label}`,
    `*5. Armazenamento:* ${selectedStorage.label}`,
    `*6. Gabinete & Cooler:* ${selectedChassis.label}`,
    `*7. Periféricos:* ${peripherals === "complete" ? "Incluir Monitor, Teclado e Mouse" : "Somente o Computador (Gabinete Completo)"}`,
    customNotes.trim() ? `*Observações:* ${customNotes.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <section id="pc-builder" className="py-16 sm:py-24 bg-[#09090b] text-white border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho do PC Builder */}
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
              Escolha o objetivo e as peças desejadas abaixo. Nossa equipe confere a compatibilidade, verifica as peças em estoque e envia o orçamento completo no seu WhatsApp.
            </p>
          </div>
        </div>

        {/* Estrutura Principal: 8 Colunas de Seleção + 4 Colunas de Resumo Fixo */}
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:divide-x lg:divide-zinc-800 border-x border-b border-zinc-800">
          {/* Coluna Esquerda: Passos de Configuração */}
          <div className="lg:col-span-8 divide-y divide-zinc-800">
            {/* PASSO 1: OBJETIVO */}
            <div className="p-6 sm:p-8">
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">
                PASSO 01 / QUAL O OBJETIVO PRINCIPAL DA MÁQUINA?
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PURPOSE_OPTIONS.map((opt) => {
                  const active = purpose === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handlePresetPurpose(opt.id)}
                      className={`p-4 text-left border transition-colors cursor-pointer ${
                        active
                          ? "bg-white text-black border-white"
                          : "bg-zinc-900/60 text-zinc-200 border-zinc-800 hover:border-zinc-600"
                      }`}
                    >
                      <strong className="text-sm font-extrabold block mb-1">{opt.label}</strong>
                      <span
                        className={`text-xs block leading-snug ${
                          active ? "text-zinc-700" : "text-zinc-400"
                        }`}
                      >
                        {opt.detail}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PASSO 2: PROCESSADOR */}
            <div className="p-6 sm:p-8">
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">
                PASSO 02 / PROCESSADOR (PLATAFORMA AMD OU INTEL)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {CPU_OPTIONS.map((opt) => {
                  const active = cpu === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setCpu(opt.id)}
                      className={`p-3.5 text-left border transition-colors cursor-pointer ${
                        active
                          ? "bg-white text-black border-white"
                          : "bg-zinc-900/60 text-zinc-200 border-zinc-800 hover:border-zinc-600"
                      }`}
                    >
                      <strong className="text-xs sm:text-sm font-extrabold block mb-1">
                        {opt.label}
                      </strong>
                      <span
                        className={`text-[11px] block leading-snug ${
                          active ? "text-zinc-700" : "text-zinc-400"
                        }`}
                      >
                        {opt.detail}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PASSO 3: PLACA DE VÍDEO */}
            <div className="p-6 sm:p-8">
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">
                PASSO 03 / PLACA DE VÍDEO (GPU)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {GPU_OPTIONS.map((opt) => {
                  const active = gpu === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setGpu(opt.id)}
                      className={`p-3.5 text-left border transition-colors cursor-pointer ${
                        active
                          ? "bg-white text-black border-white"
                          : "bg-zinc-900/60 text-zinc-200 border-zinc-800 hover:border-zinc-600"
                      }`}
                    >
                      <strong className="text-xs sm:text-sm font-extrabold block mb-1">
                        {opt.label}
                      </strong>
                      <span
                        className={`text-[11px] block leading-snug ${
                          active ? "text-zinc-700" : "text-zinc-400"
                        }`}
                      >
                        {opt.detail}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PASSO 4 & 5: MEMÓRIA RAM E ARMAZENAMENTO SSD */}
            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                  PASSO 04 / MEMÓRIA RAM
                </div>
                <div className="space-y-2.5">
                  {RAM_OPTIONS.map((opt) => {
                    const active = ram === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setRam(opt.id)}
                        className={`w-full p-3.5 text-left border transition-colors cursor-pointer ${
                          active
                            ? "bg-white text-black border-white"
                            : "bg-zinc-900/60 text-zinc-200 border-zinc-800 hover:border-zinc-600"
                        }`}
                      >
                        <strong className="text-xs sm:text-sm font-extrabold block">
                          {opt.label}
                        </strong>
                        <span
                          className={`text-[11px] block mt-0.5 ${
                            active ? "text-zinc-700" : "text-zinc-400"
                          }`}
                        >
                          {opt.detail}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                  PASSO 05 / ARMAZENAMENTO SSD NVME
                </div>
                <div className="space-y-2.5">
                  {STORAGE_OPTIONS.map((opt) => {
                    const active = storage === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setStorage(opt.id)}
                        className={`w-full p-3.5 text-left border transition-colors cursor-pointer ${
                          active
                            ? "bg-white text-black border-white"
                            : "bg-zinc-900/60 text-zinc-200 border-zinc-800 hover:border-zinc-600"
                        }`}
                      >
                        <strong className="text-xs sm:text-sm font-extrabold block">
                          {opt.label}
                        </strong>
                        <span
                          className={`text-[11px] block mt-0.5 ${
                            active ? "text-zinc-700" : "text-zinc-400"
                          }`}
                        >
                          {opt.detail}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* PASSO 6: GABINETE, PERIFÉRICOS E OBSERVAÇÕES */}
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                  PASSO 06 / ESTÉTICA DO GABINETE & REFRIGERAÇÃO
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {CASE_OPTIONS.map((opt) => {
                    const active = chassis === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setChassis(opt.id)}
                        className={`p-3.5 text-left border transition-colors cursor-pointer ${
                          active
                            ? "bg-white text-black border-white"
                            : "bg-zinc-900/60 text-zinc-200 border-zinc-800 hover:border-zinc-600"
                        }`}
                      >
                        <strong className="text-xs font-extrabold block mb-1">{opt.label}</strong>
                        <span
                          className={`text-[11px] block leading-snug ${
                            active ? "text-zinc-700" : "text-zinc-400"
                          }`}
                        >
                          {opt.detail}
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
                      onClick={() => setPeripherals("only_pc")}
                      className={`py-2.5 px-3 font-mono text-xs font-bold uppercase cursor-pointer ${
                        peripherals === "only_pc"
                          ? "bg-white text-black"
                          : "bg-zinc-900 text-zinc-400 hover:text-white"
                      }`}
                    >
                      Só o PC
                    </button>
                    <button
                      type="button"
                      onClick={() => setPeripherals("complete")}
                      className={`py-2.5 px-3 font-mono text-xs font-bold uppercase cursor-pointer ${
                        peripherals === "complete"
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
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="Ex: Quero gastar até R$ 4.500 / Rodar Flight Simulator"
                    className="w-full bg-zinc-900 border border-zinc-700 px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Ficha Técnica da Montagem em Tempo Real */}
          <div className="lg:col-span-4 p-6 sm:p-8 bg-zinc-950 flex flex-col justify-between border-t lg:border-t-0 border-zinc-800">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                  RESUMO DA SUA MÁQUINA
                </span>
                <button
                  type="button"
                  onClick={() => {
                    handlePresetPurpose("gamer_fhd");
                    setPeripherals("only_pc");
                    setCustomNotes("");
                  }}
                  className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Resetar</span>
                </button>
              </div>

              <div className="divide-y divide-zinc-800 border-b border-zinc-800 text-xs mb-6">
                <div className="py-3">
                  <span className="font-mono text-[10px] uppercase text-zinc-500 block">
                    01 · OBJETIVO
                  </span>
                  <strong className="text-white font-bold block mt-0.5">
                    {selectedPurpose.label}
                  </strong>
                </div>

                <div className="py-3">
                  <span className="font-mono text-[10px] uppercase text-zinc-500 block">
                    02 · PROCESSADOR
                  </span>
                  <strong className="text-white font-bold block mt-0.5">
                    {selectedCpu.label}
                  </strong>
                </div>

                <div className="py-3">
                  <span className="font-mono text-[10px] uppercase text-zinc-500 block">
                    03 · PLACA DE VÍDEO (GPU)
                  </span>
                  <strong className="text-white font-bold block mt-0.5">
                    {selectedGpu.label}
                  </strong>
                </div>

                <div className="py-3">
                  <span className="font-mono text-[10px] uppercase text-zinc-500 block">
                    04 · MEMÓRIA RAM
                  </span>
                  <strong className="text-white font-bold block mt-0.5">
                    {selectedRam.label}
                  </strong>
                </div>

                <div className="py-3">
                  <span className="font-mono text-[10px] uppercase text-zinc-500 block">
                    05 · ARMAZENAMENTO SSD
                  </span>
                  <strong className="text-white font-bold block mt-0.5">
                    {selectedStorage.label}
                  </strong>
                </div>

                <div className="py-3">
                  <span className="font-mono text-[10px] uppercase text-zinc-500 block">
                    06 · GABINETE & COOLER
                  </span>
                  <strong className="text-white font-bold block mt-0.5">
                    {selectedChassis.label}
                  </strong>
                </div>

                <div className="py-3">
                  <span className="font-mono text-[10px] uppercase text-zinc-500 block">
                    07 · FORMATO DO ORÇAMENTO
                  </span>
                  <strong className="text-zinc-300 font-bold block mt-0.5">
                    {peripherals === "complete"
                      ? "PC Completo + Monitor, Teclado e Mouse"
                      : "Somente o Gabinete Completo"}
                  </strong>
                </div>
              </div>

              <div className="border border-zinc-800 bg-zinc-900/50 p-4 mb-6 text-xs text-zinc-300 space-y-1.5">
                <div className="font-mono text-[11px] font-bold text-white uppercase">
                  INCLUSO EM TODA MONTAGEM CYBER:
                </div>
                <p>— Montagem limpa com organização profissional de cabos</p>
                <p>— Atualização de BIOS, perfil XMP/EXPO e sistema instalado</p>
                <p>— Teste de estabilidade térmica e garantia na nossa loja física</p>
              </div>
            </div>

            <div className="space-y-3">
              <TrackedWhatsAppLink
                phone={brand.whatsapp}
                message={whatsappBuilderMessage}
                source="pc_builder_submit"
                className="w-full bg-white hover:bg-zinc-200 text-black font-mono font-bold uppercase tracking-wider py-4 px-6 text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>Pedir Orçamento Desta Máquina</span>
                <ArrowUpRight className="w-4 h-4" />
              </TrackedWhatsAppLink>
              <p className="text-[11px] font-mono text-zinc-500 text-center">
                Abre o WhatsApp da loja já com toda a ficha preenchida.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
