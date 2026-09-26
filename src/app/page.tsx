"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";

import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ShowroomSection from "@/components/ShowroomSection";
import PCBuilderSection from "@/components/PCBuilderSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import TrackedWhatsAppLink from "@/components/TrackedWhatsAppLink";
import { brand } from "@/lib/brand";

const TELAS_URL = "https://telas.cyberinformatica.tech";

export default function Home() {
  const [selectedDemand, setSelectedDemand] = useState<"pc" | "upgrade" | "lab" | "b2b">("pc");

  const demandOptions = {
    pc: {
      code: "SETOR 01 // COMPUTADORES & WORKSTATIONS",
      title: "Computadores à Pronta-Entrega e Montagem Sob Medida",
      desc: "Contamos com máquinas Gamer, Workstations e computadores para escritório já montados, testados e prontos para levar no mesmo dia — ou ajustamos a configuração na hora conforme a sua necessidade.",
      specs: [
        "Máquinas montadas, com BIOS atualizada e prontas para testar na loja",
        "Possibilidade de alterar memória RAM, SSD ou placa de vídeo na hora no balcão",
        "Garantia direta na nossa loja física no Centro de Bragança Paulista",
      ],
      cta: "Consultar Computadores Disponíveis",
      msg: "Olá! Vim pelo site da Cyber Informática e gostaria de consultar os computadores disponíveis à pronta-entrega ou orçar uma montagem.",
    },
    upgrade: {
      code: "SETOR 02 // BANCADA TÉCNICA TÉRREO",
      title: "Upgrades de SSD NVMe, Memória RAM & Manutenção de Computadores",
      desc: "Deixe seu computador ou notebook muito mais rápido sem perder seus arquivos. Realizamos check-in em 60 segundos no balcão com fotos de vistoria, etiqueta térmica de identificação e acompanhamento online.",
      specs: [
        "Instalação de SSD NVMe e expansão de memória RAM preservando seus dados",
        "Limpeza interna completa, troca de pasta térmica de alta condutividade e fontes",
        "Diagnóstico claro com valores de peças e mão de obra separados",
      ],
      cta: "Solicitar Orçamento de Upgrade / Manutenção",
      msg: "Olá! Vim pelo site da Cyber Informática e gostaria de avaliar um upgrade ou manutenção para meu computador/notebook.",
    },
    lab: {
      code: "SETOR 03 // LABORATÓRIO 2º ANDAR (MEZANINO)",
      title: "Reparo de Placas de Vídeo (GPUs), Celulares & Troca só do Vidro (Tela Original)",
      desc: "Trincou apenas o vidro do celular mas a imagem e o toque funcionam perfeitamente? No segundo andar da loja trocamos somente o vidro externo mantendo a sua tela original de fábrica por muito menos que uma tela nova, além de recuperação eletrônica de Placas de Vídeo (GPUs).",
      specs: [
        "Troca só do vidro quebrado: você mantém o brilho, as cores e o toque 100% originais do aparelho",
        "Diagnóstico eletrônico e reparo de curto/componentes em Placas de Vídeo (NVIDIA RTX / AMD Radeon)",
        "Serviço executado dentro do nosso próprio laboratório no 2º andar, sem intermediários",
      ],
      cta: "Falar com o Laboratório (GPU / Celular / Troca de Vidro)",
      msg: "Olá! Vim pelo site da Cyber Informática e gostaria de falar sobre reparo de Placa de Vídeo (GPU), celular ou troca só do vidro mantendo minha tela original.",
    },
    b2b: {
      code: "SETOR 04 // CORPORATIVO & PARCEIROS B2B",
      title: "Atendimento para Empresas Locais & Terceirização para Lojistas",
      desc: "Atendemos escritórios, clínicas e comércios de Bragança Paulista que precisam de agilidade em computadores e rede, além de lojistas e assistências da região com tabela de atacado em troca de vidro e reparo de placas.",
      specs: [
        "Atendimento prioritário de bancada e computadores prontos para empresas",
        "Tabela de atacado B2B no laboratório do 2º andar para lojistas e assistências parceiras",
        "Recibo detalhado, histórico por equipamento e garantia legal de 90 dias",
      ],
      cta: "Falar sobre Atendimento Empresarial / Parceria B2B",
      msg: "Olá! Sou empresa/lojista na região e gostaria de falar sobre atendimento corporativo ou parceria B2B com a Cyber Informática.",
    },
  };

  const activeDemand = demandOptions[selectedDemand];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white text-zinc-950 font-sans antialiased">
        {/* Hero Monocromático (Preto, Cinza e Branco) */}
        <Hero />

        {/* ========================================================================= */}
        {/* SEÇÃO 01 — SHOWROOM DIGITAL DE COMPUTADORES À PRONTA-ENTREGA              */}
        {/* ========================================================================= */}
        <ShowroomSection />

        {/* ========================================================================= */}
        {/* SEÇÃO 02 — PC BUILDER INTERATIVO (MONTE SEU COMPUTADOR SOB MEDIDA)        */}
        {/* ========================================================================= */}
        <PCBuilderSection />

        {/* ========================================================================= */}
        {/* SEÇÃO 03 — ÍNDICE DE SERVIÇOS, LABORATÓRIO E VAREJO (CINZA & PRETO)       */}
        {/* ========================================================================= */}
        <section id="servicos" className="py-16 sm:py-24 bg-zinc-100 border-b border-zinc-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-10 border-b-2 border-zinc-950">
              <div>
                <div className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">
                  03 // ESCOPO TÉCNICO & COMERCIAL
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
                  O Que Fazemos no Térreo e no 2º Andar
                </h2>
              </div>
              <p className="text-sm text-zinc-600 max-w-md">
                Operação dividida por especialidade técnica: manutenção rápida e peças no 1º piso; microeletrônica, GPUs e troca só do vidro (mantendo sua tela original) no 2º piso.
              </p>
            </div>

            {/* Lista Arquitetônica Horizontal */}
            <div className="divide-y divide-zinc-300 border-b border-zinc-300">
              {/* Linha 01 */}
              <div className="py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-2 font-mono text-xs font-bold text-zinc-500 uppercase">
                  01 / TÉRREO
                </div>
                <div className="lg:col-span-4">
                  <h3 className="text-xl font-extrabold text-zinc-950">
                    Manutenção Rápida & Upgrades de SSD / RAM
                  </h3>
                </div>
                <div className="lg:col-span-4 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Diagnóstico ágil para computadores e notebooks lentos, travando ou aquecendo. Instalação de SSD NVMe até 10x mais rápido preservando seus arquivos, limpeza térmica profissional e troca de fontes.
                </div>
                <div className="lg:col-span-2 lg:text-right">
                  <TrackedWhatsAppLink
                    phone={brand.whatsapp}
                    message="Olá! Gostaria de um orçamento de manutenção / upgrade para meu computador ou notebook."
                    source="service_row_1"
                    className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-zinc-950 hover:text-zinc-600 underline underline-offset-4"
                  >
                    <span>Orçar no Balcão</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </TrackedWhatsAppLink>
                </div>
              </div>

              {/* Linha 02 */}
              <div className="py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-2 font-mono text-xs font-bold text-zinc-500 uppercase">
                  02 / 2º ANDAR
                </div>
                <div className="lg:col-span-4">
                  <h3 className="text-xl font-extrabold text-zinc-950">
                    Reparo Avançado de Placas de Vídeo (GPUs)
                  </h3>
                </div>
                <div className="lg:col-span-4 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Laboratório no mezanino equipado com microscópio trinocular, fonte de bancada e estação de retrabalho para diagnóstico de curto em linhas 12V/VCore/VRAM e recuperação de placas NVIDIA RTX e AMD Radeon.
                </div>
                <div className="lg:col-span-2 lg:text-right">
                  <TrackedWhatsAppLink
                    phone={brand.whatsapp}
                    message="Olá! Gostaria de falar com o laboratório sobre reparo de Placa de Vídeo (GPU)."
                    source="service_row_2"
                    className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-zinc-950 hover:text-zinc-600 underline underline-offset-4"
                  >
                    <span>Falar com Lab GPU</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </TrackedWhatsAppLink>
                </div>
              </div>

              {/* Linha 03 */}
              <div className="py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-2 font-mono text-xs font-bold text-zinc-500 uppercase">
                  03 / 2º ANDAR
                </div>
                <div className="lg:col-span-4">
                  <h3 className="text-xl font-extrabold text-zinc-950">
                    Troca só do Vidro (Mantendo sua Tela Original) & Celulares
                  </h3>
                </div>
                <div className="lg:col-span-4 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Trincou o vidro do celular mas a imagem continua limpa e o toque funciona? Trocamos apenas o vidro externo em equipamento industrial a vácuo: você mantém a sua tela original de fábrica e economiza até 60% em relação à troca da tela inteira.
                </div>
                <div className="lg:col-span-2 lg:text-right">
                  <a
                    href={TELAS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-zinc-950 hover:text-zinc-600 underline underline-offset-4"
                  >
                    <span>Ver Como Funciona</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Linha 04 */}
              <div className="py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-2 font-mono text-xs font-bold text-zinc-500 uppercase">
                  04 / TÉRREO
                </div>
                <div className="lg:col-span-4">
                  <h3 className="text-xl font-extrabold text-zinc-950">
                    Cabos, Fontes, SSDs & Periféricos na Hora
                  </h3>
                </div>
                <div className="lg:col-span-4 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Estoque catalogado no balcão para retirada imediata: cabos DisplayPort, HDMI 2.1, cabos de força, fontes ATX, coolers, pastas térmicas, teclados, mouses, monitores e adaptadores específicos.
                </div>
                <div className="lg:col-span-2 lg:text-right">
                  <TrackedWhatsAppLink
                    phone={brand.whatsapp}
                    message="Olá! Gostaria de consultar a disponibilidade de um cabo / peça / periférico no estoque da loja."
                    source="service_row_4"
                    className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-zinc-950 hover:text-zinc-600 underline underline-offset-4"
                  >
                    <span>Consultar Peça</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </TrackedWhatsAppLink>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SEÇÃO 04 — ESTRUTURA FÍSICA DE 2 ANDARES & EQUIPE (PRETO, CINZA, BRANCO)  */}
        {/* ========================================================================= */}
        <section id="estrutura" className="py-16 sm:py-24 bg-[#09090b] text-white border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="pb-12 border-b border-zinc-800 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <div className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
                  04 // RUA CORONEL TEÓFILO LEME, 967 — CENTRO
                </div>
                <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                  Dois Andares de Operação Física e Equipe Própria.
                </h2>
              </div>
              <p className="text-sm text-zinc-400 max-w-md leading-relaxed">
                Aqui você não fala com robôs nem entrega seu equipamento sem saber quem vai mexer. Cada andar tem sua bancada e seus especialistas residentes.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800 border-x border-b border-zinc-800">
              {/* 1º Andar */}
              <div className="p-6 sm:p-10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between font-mono text-xs text-zinc-400 pb-4 mb-6 border-b border-zinc-800">
                    <span>PISO 01 // TÉRREO</span>
                    <span className="text-white font-bold">SHOWROOM & BANCADA RÁPIDA</span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-white mb-3">
                    Computadores à Pronta-Entrega, Atendimento e Upgrades
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-8">
                    No térreo fica nossa bancada de 6 metros com os computadores expostos à pronta-entrega, o balcão de check-in rápido com etiqueta térmica de identificação, a bancada de testes de estresse e o estoque de cabos e periféricos.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800 border border-zinc-800 bg-zinc-900/50 text-xs">
                  <div className="p-4">
                    <strong className="text-white font-mono uppercase block mb-1">Felipe</strong>
                    <span className="text-zinc-400 block">Fundador, Gestão & Bancada de Testes</span>
                  </div>
                  <div className="p-4">
                    <strong className="text-white font-mono uppercase block mb-1">Iago</strong>
                    <span className="text-zinc-400 block">Hardware, Sistemas, Upgrades & Balcão</span>
                  </div>
                  <div className="p-4">
                    <strong className="text-white font-mono uppercase block mb-1">Eduardo</strong>
                    <span className="text-zinc-400 block">Organização de Estoque, Peças & Cabos</span>
                  </div>
                </div>
              </div>

              {/* 2º Andar */}
              <div className="p-6 sm:p-10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between font-mono text-xs text-zinc-400 pb-4 mb-6 border-b border-zinc-800">
                    <span>PISO 02 // MEZANINO</span>
                    <span className="text-white font-bold">LABORATÓRIO DE MICROELETRÔNICA</span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-white mb-3">
                    Placas de Vídeo (GPUs), Smartphones & Troca só do Vidro
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-8">
                    No segundo andar funciona o laboratório isolado para serviços de alta precisão: reparo eletrônico em placas de vídeo, manutenção avançada de celulares e recuperação do vidro trincado preservando a tela original do aparelho.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800 border border-zinc-800 bg-zinc-900/50 text-xs">
                  <div className="p-4">
                    <strong className="text-white font-mono uppercase block mb-1">Jefferson</strong>
                    <span className="text-zinc-400 block">Especialista em GPUs, Celulares & Troca de Vidro</span>
                  </div>
                  <div className="p-4">
                    <strong className="text-white font-mono uppercase block mb-1">Clientes & Lojistas</strong>
                    <span className="text-zinc-400 block">Atendimento direto ao público e parceria B2B regional</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SEÇÃO 05 — DIRECIONAMENTO DIRETO PARA O WHATSAPP (MONOCROMÁTICO)          */}
        {/* ========================================================================= */}
        <section id="orcamento" className="py-16 sm:py-24 bg-white border-b border-zinc-300">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="pb-8 border-b-2 border-zinc-950 mb-8">
              <div className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">
                05 // CANAL DIRETO COM A BANCADA
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
                Selecione o Setor para Falar no WhatsApp
              </h2>
            </div>

            {/* Abas Monocromáticas (Preto / Cinza / Branco) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border border-zinc-900 divide-y sm:divide-y-0 sm:divide-x divide-zinc-900 mb-8">
              <button
                type="button"
                onClick={() => setSelectedDemand("pc")}
                className={`p-4 text-left transition-colors cursor-pointer ${
                  selectedDemand === "pc"
                    ? "bg-zinc-950 text-white"
                    : "bg-white text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                <span className="font-mono text-[11px] uppercase block opacity-70">01 / Showroom</span>
                <strong className="text-xs sm:text-sm font-bold block mt-1">
                  PCs & Workstations
                </strong>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDemand("upgrade")}
                className={`p-4 text-left transition-colors cursor-pointer ${
                  selectedDemand === "upgrade"
                    ? "bg-zinc-950 text-white"
                    : "bg-white text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                <span className="font-mono text-[11px] uppercase block opacity-70">02 / Térreo</span>
                <strong className="text-xs sm:text-sm font-bold block mt-1">
                  Upgrade & Manutenção
                </strong>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDemand("lab")}
                className={`p-4 text-left transition-colors cursor-pointer ${
                  selectedDemand === "lab"
                    ? "bg-zinc-950 text-white"
                    : "bg-white text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                <span className="font-mono text-[11px] uppercase block opacity-70">03 / 2º Andar</span>
                <strong className="text-xs sm:text-sm font-bold block mt-1">
                  GPU / Celular / Vidro
                </strong>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDemand("b2b")}
                className={`p-4 text-left transition-colors cursor-pointer ${
                  selectedDemand === "b2b"
                    ? "bg-zinc-950 text-white"
                    : "bg-white text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                <span className="font-mono text-[11px] uppercase block opacity-70">04 / B2B</span>
                <strong className="text-xs sm:text-sm font-bold block mt-1">
                  Empresas & Lojistas
                </strong>
              </button>
            </div>

            {/* Painel Selecionado */}
            <div className="border border-zinc-900 bg-zinc-50 p-6 sm:p-10">
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                {activeDemand.code}
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-950 mb-3">
                {activeDemand.title}
              </h3>
              <p className="text-sm text-zinc-700 leading-relaxed mb-6 max-w-3xl">
                {activeDemand.desc}
              </p>

              <ul className="space-y-2.5 mb-8 border-t border-zinc-200 pt-5">
                {activeDemand.specs.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-xs sm:text-sm text-zinc-800 font-medium">
                    <span className="font-mono font-bold text-zinc-950">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <TrackedWhatsAppLink
                phone={brand.whatsapp}
                message={activeDemand.msg}
                source={`demand_selector_${selectedDemand}`}
                className="inline-flex items-center justify-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white font-mono font-bold uppercase tracking-wider py-4 px-8 text-xs transition-colors w-full sm:w-auto"
              >
                <span>{activeDemand.cta}</span>
                <ArrowUpRight className="w-4 h-4" />
              </TrackedWhatsAppLink>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SEÇÃO 06 — PROCESSO DE BALCÃO & ENDEREÇO NO CENTRO DE BRAGANÇA            */}
        {/* ========================================================================= */}
        <section id="localizacao" className="py-16 sm:py-24 bg-zinc-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* 3 Pilares Operacionais Monocromáticos */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-300 border border-zinc-300 bg-white mb-14">
              <div className="p-6 sm:p-8">
                <div className="font-mono text-xs font-bold text-zinc-400 mb-3">
                  ETAPA 01 // BALCÃO
                </div>
                <h3 className="text-lg font-extrabold text-zinc-950 mb-2">
                  Check-in em 60s com Fotos e Etiqueta Térmica
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Ao deixar seu equipamento, fazemos o registro fotográfico na hora e colamos a etiqueta térmica com o número da OS para acompanhamento imediato.
                </p>
              </div>

              <div className="p-6 sm:p-8">
                <div className="font-mono text-xs font-bold text-zinc-400 mb-3">
                  ETAPA 02 // PORTAL /STATUS
                </div>
                <h3 className="text-lg font-extrabold text-zinc-950 mb-2">
                  Acompanhamento Online Pelo Celular
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Consulte a etapa atual do serviço, veja as fotos de entrada, valores de peças e mão de obra separados e aprove o orçamento em 1 clique pelo WhatsApp.
                </p>
              </div>

              <div className="p-6 sm:p-8">
                <div className="font-mono text-xs font-bold text-zinc-400 mb-3">
                  ETAPA 03 // PÓS-VENDA
                </div>
                <h3 className="text-lg font-extrabold text-zinc-950 mb-2">
                  Garantia Legal CDC de 90 Dias
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Todos os computadores e serviços contam com Certificado de Garantia Legal de 90 dias (Art. 26 do CDC) com suporte direto na nossa loja física.
                </p>
              </div>
            </div>

            {/* Bloco de Endereço e Horário em Preto & Branco */}
            <div className="border-2 border-zinc-950 bg-white p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-500">
                  LOJA FÍSICA HÁ 10 ANOS NO CENTRO DE BRAGANÇA PAULISTA
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
                  Rua Coronel Teófilo Leme, 967 — Centro
                </h2>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Venha conhecer nossas máquinas à pronta-entrega ou traga seu equipamento para uma avaliação transparente diretamente com nossa equipe.
                </p>

                <div className="grid sm:grid-cols-2 gap-4 pt-2 text-xs font-mono">
                  <div className="border border-zinc-300 bg-zinc-50 p-4">
                    <strong className="text-zinc-950 uppercase block mb-1">
                      HORÁRIO DE ATENDIMENTO
                    </strong>
                    <span className="text-zinc-600 block">SEG A SEX: 09H00 ÀS 18H00</span>
                    <span className="text-zinc-600 block">SÁBADO: 09H00 ÀS 13H00</span>
                  </div>

                  <div className="border border-zinc-300 bg-zinc-50 p-4">
                    <strong className="text-zinc-950 uppercase block mb-1">
                      CONTATO & RASTREIO DE OS
                    </strong>
                    <span className="text-zinc-600 block">WHATSAPP: (11) 95436-9269</span>
                    <Link href="/status" className="text-zinc-950 font-bold underline underline-offset-4 inline-flex items-center gap-1 mt-1">
                      <span>ACOMPANHAR MINHA OS</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col gap-3">
                <TrackedWhatsAppLink
                  phone={brand.whatsapp}
                  message="Olá! Vim pelo site da Cyber Informática e gostaria de falar com o atendimento."
                  source="location_section"
                  className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-mono font-bold uppercase tracking-wider py-4 px-6 text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Chamar no WhatsApp Agora</span>
                  <ArrowUpRight className="w-4 h-4" />
                </TrackedWhatsAppLink>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    "Rua Coronel Teófilo Leme 967 Bragança Paulista SP"
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full border border-zinc-900 bg-white hover:bg-zinc-100 text-zinc-950 font-mono font-bold uppercase tracking-wider py-4 px-6 text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Abrir Rota no Google Maps</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
