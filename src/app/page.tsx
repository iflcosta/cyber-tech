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
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white text-zinc-950 font-sans antialiased">
        {/* ========================================================================= */}
        {/* HERO — PROPOSTA DIRETA + CONSULTA DE OS + ÍNDICE RÁPIDO                   */}
        {/* ========================================================================= */}
        <Hero />

        {/* ========================================================================= */}
        {/* SEÇÃO 01 — SHOWROOM DIGITAL DE COMPUTADORES À PRONTA-ENTREGA              */}
        {/* ========================================================================= */}
        <ShowroomSection />

        {/* ========================================================================= */}
        {/* SEÇÃO 02 — PC BUILDER EM CONSOLE DE 4 ABAS COMPACTAS                      */}
        {/* ========================================================================= */}
        <PCBuilderSection />

        {/* ========================================================================= */}
        {/* SEÇÃO 03 UNIFICADA — SERVIÇOS, EQUIPE & OPERAÇÃO FÍSICA EM 2 ANDARES      */}
        {/* ========================================================================= */}
        <section id="servicos" className="py-12 sm:py-20 bg-zinc-100 border-b border-zinc-300">
          <div id="estrutura" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 sm:pb-8 border-b-2 border-zinc-950 mb-6 sm:mb-8">
              <div>
                <div className="font-mono text-[11px] sm:text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5 sm:mb-2">
                  03 // ESTRUTURA FÍSICA DE 2 ANDARES & SERVIÇOS ESPECIALIZADOS
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
                  Dois Pisos de Operação. Um Canal Direto para Cada Demanda.
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-zinc-600 max-w-md leading-relaxed">
                Cada andar da nossa loja no Centro de Bragança Paulista conta com bancada própria e especialistas residentes:
              </p>
            </div>

            {/* Grid Arquitetônico de 2 Colunas: 1º Andar (Térreo) vs. 2º Andar (Mezanino) */}
            <div id="orcamento" className="grid grid-cols-1 lg:grid-cols-2 border-2 border-zinc-950 divide-y-2 lg:divide-y-0 lg:divide-x-2 divide-zinc-950 bg-white">
              {/* COLUNA 01: 1º ANDAR (TÉRREO) */}
              <div className="p-4 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] sm:text-xs pb-3.5 mb-4 border-b border-zinc-200">
                    <span className="font-bold text-zinc-950 bg-zinc-200 px-2.5 py-1">
                      1º ANDAR // TÉRREO
                    </span>
                    <span className="text-zinc-500 font-bold uppercase">
                      FELIPE · IAGO · EDUARDO
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-950 mb-2">
                    Manutenção Rápida, Upgrades & Varejo de Peças
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-5">
                    Atendimento rápido de balcão com check-in em 60 segundos, computadores expostos à pronta-entrega e estoque físico catalogado.
                  </p>

                  <div className="divide-y divide-zinc-200 border-y border-zinc-200 mb-5">
                    <div className="py-3.5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <strong className="text-xs sm:text-sm font-extrabold text-zinc-950">
                          01. Upgrades de SSD NVMe, RAM & Formatação
                        </strong>
                        <span className="font-mono text-[10px] font-bold uppercase bg-zinc-100 border border-zinc-300 px-2 py-0.5 text-zinc-700 shrink-0">
                          No Mesmo Dia
                        </span>
                      </div>
                      <span className="text-xs text-zinc-600 block leading-relaxed">
                        Deixe seu PC ou notebook até 10x mais rápido preservando seus arquivos, com limpeza térmica profissional.
                      </span>
                    </div>

                    <div className="py-3.5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <strong className="text-xs sm:text-sm font-extrabold text-zinc-950">
                          02. Combos HD→SSD + Limpeza Térmica
                        </strong>
                        <span className="font-mono text-[10px] font-bold uppercase bg-zinc-950 text-white px-2 py-0.5 shrink-0">
                          Mais Pedido
                        </span>
                      </div>
                      <span className="text-xs text-zinc-600 block leading-relaxed">
                        Substitua o HD por SSD NVMe e faça limpeza térmica completa: PC até 10× mais rápido no mesmo dia. Combos a partir de R$&nbsp;180.
                      </span>
                    </div>

                    <div className="py-3.5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <strong className="text-xs sm:text-sm font-extrabold text-zinc-950">
                          03. Cabos, Fontes, SSDs & Periféricos na Hora
                        </strong>
                        <span className="font-mono text-[10px] font-bold uppercase bg-zinc-100 border border-zinc-300 px-2 py-0.5 text-zinc-700 shrink-0">
                          Estoque Físico
                        </span>
                      </div>
                      <span className="text-xs text-zinc-600 block leading-relaxed">
                        Cabos DisplayPort/HDMI 2.1, fontes ATX certificadas, coolers, pastas térmicas, mouses e teclados para retirada imediata.
                      </span>
                    </div>

                    <div className="py-3.5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <strong className="text-xs sm:text-sm font-extrabold text-zinc-950">
                          04. Suporte Ágil para Empresas & Escritórios
                        </strong>
                        <span className="font-mono text-[10px] font-bold uppercase bg-zinc-100 border border-zinc-300 px-2 py-0.5 text-zinc-700 shrink-0">
                          B2B & PME
                        </span>
                      </div>
                      <span className="text-xs text-zinc-600 block leading-relaxed">
                        Prioridade de bancada, máquinas prontas para trabalho, recibo detalhado e garantia legal de 90 dias.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <TrackedWhatsAppLink
                    phone={brand.whatsapp}
                    message="Olá! Vim pelo site da Cyber Informática e gostaria de orçar um upgrade / manutenção de computador ou notebook."
                    source="terreo_manutencao_btn"
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white font-mono font-bold uppercase tracking-wider py-3.5 px-4 text-xs transition-colors min-h-[46px]"
                  >
                    <span>Orçar Manutenção / Upgrade</span>
                    <ArrowUpRight className="w-4 h-4 shrink-0" />
                  </TrackedWhatsAppLink>

                  <TrackedWhatsAppLink
                    phone={brand.whatsapp}
                    message="Olá! Vim pelo site da Cyber Informática e gostaria de consultar uma peça, cabo ou periférico no estoque."
                    source="terreo_pecas_btn"
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 border border-zinc-900 bg-white hover:bg-zinc-100 text-zinc-950 font-mono font-bold uppercase tracking-wider py-3.5 px-4 text-xs transition-colors min-h-[46px]"
                  >
                    <span>Consultar Peça</span>
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                  </TrackedWhatsAppLink>
                </div>
              </div>

              {/* COLUNA 02: 2º ANDAR (MEZANINO — LABORATÓRIO) */}
              <div className="p-4 sm:p-8 bg-[#09090b] text-white flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] sm:text-xs pb-3.5 mb-4 border-b border-zinc-800">
                    <span className="font-bold text-black bg-white px-2.5 py-1">
                      2º ANDAR // MEZANINO
                    </span>
                    <span className="text-zinc-400 font-bold uppercase">
                      ESP. JEFFERSON · B2C & B2B
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-2">
                    Laboratório de Celulares, Troca só do Vidro & Placas de Vídeo (GPUs)
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-5">
                    Laboratório próprio no segundo andar especializado em manutenção avançada de celulares, troca só do vidro a vácuo (preservando o display original) e reparo eletrônico de GPUs. Sem terceirização.
                  </p>

                  <div className="divide-y divide-zinc-800 border-y border-zinc-800 mb-5">
                    <div className="py-3.5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <strong className="text-xs sm:text-sm font-extrabold text-white">
                          01. Manutenção de Celulares & Smartphones
                        </strong>
                        <span className="font-mono text-[10px] font-bold uppercase bg-zinc-900 border border-zinc-700 px-2 py-0.5 text-zinc-300 shrink-0">
                          Bancada Própria
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400 block leading-relaxed">
                        Troca de conectores de carga, baterias, microfones, reparos de placa e solução de falhas elétricas em iPhones e Androids.
                      </span>
                    </div>

                    <div className="py-3.5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <strong className="text-xs sm:text-sm font-extrabold text-white">
                          02. Troca só do Vidro (Salve sua Tela Original)
                        </strong>
                        <span className="font-mono text-[10px] font-bold uppercase bg-white text-black px-2 py-0.5 shrink-0">
                          Tela Original
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400 block leading-relaxed">
                        A imagem e o toque funcionam? Trocamos apenas o vidro externo trincado a vácuo em autoclave industrial, mantendo sua tela original com até 70% de economia.
                      </span>
                    </div>

                    <div className="py-3.5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <strong className="text-xs sm:text-sm font-extrabold text-white">
                          03. Reparo Eletrônico de Placas de Vídeo (GPUs)
                        </strong>
                        <span className="font-mono text-[10px] font-bold uppercase bg-zinc-900 border border-zinc-700 px-2 py-0.5 text-zinc-300 shrink-0">
                          Microeletrônica
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400 block leading-relaxed">
                        Diagnóstico de curto em linhas 12V/VCore/VRAM, troca de componentes, reballing e recuperação de placas NVIDIA RTX e AMD Radeon.
                      </span>
                    </div>

                    <div className="py-3.5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <strong className="text-xs sm:text-sm font-extrabold text-white">
                          04. Parceria B2B para Lojistas da Região
                        </strong>
                        <span className="font-mono text-[10px] font-bold uppercase bg-zinc-900 border border-zinc-700 px-2 py-0.5 text-zinc-300 shrink-0">
                          Atacado B2B
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400 block leading-relaxed">
                        Tabela de atacado e prioridade de lote para lojistas de Bragança Paulista, Atibaia, Itatiba, Socorro e Extrema em celulares, telas e GPUs.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <TrackedWhatsAppLink
                    phone={brand.whatsapp}
                    message="Olá! Vim pelo site da Cyber Informática e gostaria de falar com o laboratório do 2º andar sobre manutenção de celular, troca só do vidro ou placa de vídeo (GPU)."
                    source="mezanino_lab_btn"
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black font-mono font-bold uppercase tracking-wider py-3.5 px-4 text-xs transition-colors min-h-[46px]"
                  >
                    <span>Falar com o Lab (Celular / Vidro / GPU)</span>
                    <ArrowUpRight className="w-4 h-4 shrink-0" />
                  </TrackedWhatsAppLink>

                  <a
                    href={TELAS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white font-mono font-bold uppercase tracking-wider py-3.5 px-4 text-xs transition-colors min-h-[46px]"
                  >
                    <span>Site de Telas</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SEÇÃO 04 — GARANTIA DE BANCADA & ENDEREÇO NO CENTRO DE BRAGANÇA           */}
        {/* ========================================================================= */}
        <section id="localizacao" className="py-12 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="border-2 border-zinc-950 bg-white">
              {/* Faixa Superior Compacta de Garantias (3 Pilares) */}
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-300 border-b-2 border-zinc-950 bg-zinc-50">
                <div className="p-4 sm:p-5 flex items-start gap-3">
                  <span className="font-mono text-xs font-bold bg-zinc-950 text-white px-2 py-0.5 shrink-0">
                    01
                  </span>
                  <div>
                    <strong className="text-xs sm:text-sm font-extrabold text-zinc-950 block">
                      Check-in em 60s com Fotos
                    </strong>
                    <span className="text-xs text-zinc-600 block mt-0.5">
                      Etiqueta térmica colada no chassi e vistoria fotográfica na entrada.
                    </span>
                  </div>
                </div>

                <div className="p-4 sm:p-5 flex items-start gap-3">
                  <span className="font-mono text-xs font-bold bg-zinc-950 text-white px-2 py-0.5 shrink-0">
                    02
                  </span>
                  <div>
                    <strong className="text-xs sm:text-sm font-extrabold text-zinc-950 block">
                      Rastreio Online em Tempo Real
                    </strong>
                    <span className="text-xs text-zinc-600 block mt-0.5">
                      Acompanhe cada etapa pelo celular em{" "}
                      <Link href="/status" className="underline font-semibold text-zinc-950">
                        /status
                      </Link>{" "}
                      com peças e mão de obra separadas.
                    </span>
                  </div>
                </div>

                <div className="p-4 sm:p-5 flex items-start gap-3">
                  <span className="font-mono text-xs font-bold bg-zinc-950 text-white px-2 py-0.5 shrink-0">
                    03
                  </span>
                  <div>
                    <strong className="text-xs sm:text-sm font-extrabold text-zinc-950 block">
                      Garantia Legal CDC de 90 Dias
                    </strong>
                    <span className="text-xs text-zinc-600 block mt-0.5">
                      Certificado oficial emitido na entrega com suporte direto na nossa loja física.
                    </span>
                  </div>
                </div>
              </div>

              {/* Bloco de Endereço e Horário */}
              <div className="p-4 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
                <div className="lg:col-span-7 space-y-3">
                  <div className="font-mono text-[11px] sm:text-xs font-bold uppercase tracking-widest text-zinc-500">
                    04 // LOJA FÍSICA HÁ 10 ANOS NO CENTRO DE BRAGANÇA PAULISTA
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
                    Rua Coronel Teófilo Leme, 967 — Centro
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-2xl">
                    Estacionamento fácil na região central. Venha testar os computadores do Showroom pessoalmente ou traga seu equipamento para avaliação direta no balcão.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-2.5 sm:gap-3 pt-2 text-xs font-mono">
                    <div className="border border-zinc-300 bg-zinc-50 p-3.5">
                      <strong className="text-zinc-950 uppercase block mb-1">
                        HORÁRIO DE FUNCIONAMENTO
                      </strong>
                      <span className="text-zinc-600 block">SEG A SEX: 09H00 ÀS 18H00</span>
                      <span className="text-zinc-600 block">SÁBADO: 09H00 ÀS 13H00</span>
                    </div>

                    <div className="border border-zinc-300 bg-zinc-50 p-3.5">
                      <strong className="text-zinc-950 uppercase block mb-1">
                        ATENDIMENTO & PORTAL OS
                      </strong>
                      <span className="text-zinc-600 block">WHATSAPP: (11) 95436-9269</span>
                      <Link
                        href="/status"
                        className="text-zinc-950 font-bold underline underline-offset-4 inline-flex items-center gap-1 mt-1"
                      >
                        <span>CONSULTAR ORDEM DE SERVIÇO</span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 flex flex-col gap-2.5 sm:gap-3">
                  {/* Banner de urgência exclusivo mobile */}
                  <div className="sm:hidden mb-3 bg-zinc-950 text-white px-4 py-2.5 text-center font-mono text-[10px] font-bold uppercase tracking-widest">
                    ⚡ RESPOSTA EM ATÉ 15 MIN NO WHATSAPP
                  </div>
                  <TrackedWhatsAppLink
                    phone={brand.whatsapp}
                    message="Olá! Vim pelo site da Cyber Informática e gostaria de falar com o atendimento."
                    source="location_section"
                    className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-mono font-bold uppercase tracking-wider py-4 px-6 text-xs flex items-center justify-center gap-2 transition-colors min-h-[48px]"
                  >
                    <span>Chamar no WhatsApp Agora</span>
                    <ArrowUpRight className="w-4 h-4 shrink-0" />
                  </TrackedWhatsAppLink>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      "Rua Coronel Teófilo Leme 967 Bragança Paulista SP"
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full border border-zinc-900 bg-white hover:bg-zinc-100 text-zinc-950 font-mono font-bold uppercase tracking-wider py-4 px-6 text-xs flex items-center justify-center gap-2 transition-colors min-h-[48px]"
                  >
                    <span>Abrir Rota no Google Maps</span>
                    <ArrowUpRight className="w-4 h-4 shrink-0" />
                  </a>
                </div>
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
