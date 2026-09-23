"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Cpu, 
  Layers, 
  Building2, 
  ShieldCheck, 
  ArrowRight, 
  MessageSquare, 
  ExternalLink, 
  MapPin, 
  Clock, 
  Shield, 
  Maximize2,
  CheckCircle2,
  Sliders,
  FileText,
  Activity,
  Award,
  ChevronRight,
  Flame,
  Zap,
  HelpCircle,
  Hash
} from "lucide-react";

import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import TrackedWhatsAppLink from "@/components/TrackedWhatsAppLink";
import { brand } from "@/lib/brand";

const TELAS_URL = "https://telas.cyberinformatica.tech";

export default function Home() {
  // Estado para o Console Seletor de Demanda (Substitui os 3 cards do IF Tech)
  const [selectedDemand, setSelectedDemand] = useState<"retail" | "lab" | "b2b">("retail");
  
  // Estado para o Corte Arquitetônico da Seção Facility
  const [facilityFloor, setFacilityFloor] = useState<"all" | "level1" | "level2" | "b2b">("all");

  const whatsappRetailMessage = "Olá! Vim pelo site da Cyber e gostaria de um orçamento para montagem de PC / upgrade de hardware com Iago ou Felipe.";
  const whatsappLabMessage = "Olá! Vim pelo site da Cyber e gostaria de um laudo para recuperação de placa de vídeo / tela quebrada com Jefferson no mezanino.";
  const whatsappB2BMessage = "Olá! Sou lojista/assistência técnica na região e gostaria de credenciar minha loja como parceira B2B da Cyber Informática.";
  const whatsappGeralMessage = "Olá! Gostaria de falar com a equipe técnica da Cyber Informática.";

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#09090c] text-zinc-300 font-sans antialiased selection:bg-white selection:text-black">
        {/* Hero Autoral CIS-01 */}
        <Hero />

        {/* ========================================================================= */}
        {/* SEÇÃO 1 — CORTE ARQUITETÔNICO DOS 2 PISOS (DUAL-LEVEL FACILITY CONSOLE)   */}
        {/* ========================================================================= */}
        <section id="facility" className="py-20 sm:py-24 border-b border-[#242429] bg-[#0c0c10] font-sans">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Header da Seção */}
            <div className="mb-12">
              <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400 uppercase mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>[ ARQUITETURA FÍSICA // FACILITY 967 ]</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Dois Pisos de Engenharia.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 via-zinc-400 to-zinc-500">
                  Infraestrutura Real no Centro de Bragança.
                </span>
              </h2>
              <p className="text-base sm:text-lg text-zinc-400 mt-3 max-w-3xl leading-relaxed">
                Ao contrário de assistências improvisadas em galerias, a Cyber Informática conta com 2 andares dedicados e equipados com maquinário industrial próprio, bancada aterrada e técnicos residentes.
              </p>
            </div>

            {/* Console de Inspeção Arquitetônica */}
            <div className="milled-chassis p-6 sm:p-8 rounded-sm">
              
              {/* Barra Superior de Seleção de Nível */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#242429]">
                <div className="font-mono">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-widest block">
                    INSPEÇÃO DE INFRAESTRUTURA
                  </span>
                  <h3 className="text-base font-bold text-white">
                    SELECIONE O NÍVEL PARA VISUALIZAR OS EQUIPAMENTOS
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setFacilityFloor("all")}
                    className={`console-tab ${facilityFloor === "all" ? "active" : ""}`}
                  >
                    COMPLEXO GERAL (2 PISOS)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFacilityFloor("level1")}
                    className={`console-tab ${facilityFloor === "level1" ? "active" : ""}`}
                  >
                    NÍVEL 01 // TÉRREO (6 METROS)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFacilityFloor("level2")}
                    className={`console-tab ${facilityFloor === "level2" ? "active" : ""}`}
                  >
                    NÍVEL 02 // MEZANINO (OCA/BGA)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFacilityFloor("b2b")}
                    className={`console-tab ${facilityFloor === "b2b" ? "active" : ""}`}
                  >
                    HUB REGIONAL // B2B
                  </button>
                </div>
              </div>

              {/* Conteúdo Dinâmico do Piso Inspecionado */}
              <div className="mt-8">
                {facilityFloor === "all" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-[#242429] font-mono text-xs text-zinc-400">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        CORTE ESQUEMÁTICO INTEGRAL // SEDE FÍSICA 10 ANOS NA RUA CEL. TEÓFILO LEME 967
                      </span>
                      <span className="text-zinc-500 hidden sm:inline">PÉ-DIREITO 6.00m + MEZANINO INDUSTRIAL</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Nível 02: Mezanino */}
                      <div className="bg-[#121217] border border-[#24242c] p-6 rounded-sm font-mono text-xs flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start pb-3 border-b border-[#202027] mb-4">
                            <div>
                              <span className="px-1.5 py-0.5 bg-zinc-800 text-[10px] text-zinc-300 font-bold rounded-sm">
                                ELEV +3.60m
                              </span>
                              <h4 className="text-sm font-bold text-white mt-1.5 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-zinc-300" />
                                MEZANINO // OCA &amp; CIRURGIA BGA
                              </h4>
                              <span className="text-[10px] text-zinc-400 block mt-0.5 font-sans">
                                Especialista Residente: Jefferson • Microeletrônica &amp; Laminação
                              </span>
                            </div>
                            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 border border-emerald-900/60 rounded-sm">
                              SALA SELADA
                            </span>
                          </div>

                          <div className="space-y-2.5 text-[11px]">
                            <div className="flex justify-between py-1 border-b border-[#1a1a22]">
                              <span className="text-zinc-400">Autoclave Desbolhadora:</span>
                              <span className="text-white font-bold">6.0 Bar Regulados</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-[#1a1a22]">
                              <span className="text-zinc-400">Câmara Pneumática Vácuo:</span>
                              <span className="text-white font-bold">-0.08 MPa Constante</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-[#1a1a22]">
                              <span className="text-zinc-400">Estação de Retrabalho BGA:</span>
                              <span className="text-white font-bold">Infravermelho 4 Estágios</span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-zinc-400">Microscópio Trinocular:</span>
                              <span className="text-emerald-400 font-bold">4K Óptico (Microtrilhas 0.05mm)</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-[#1c1c24] flex items-center justify-between">
                          <span className="text-[10px] text-zinc-400">Preserva display 100% original</span>
                          <button
                            type="button"
                            onClick={() => setFacilityFloor("level2")}
                            className="text-[11px] text-zinc-300 hover:text-white font-bold underline cursor-pointer"
                          >
                            Ver Detalhes do Mezanino &rarr;
                          </button>
                        </div>
                      </div>

                      {/* Nível 01: Térreo */}
                      <div className="bg-[#121217] border border-[#24242c] p-6 rounded-sm font-mono text-xs flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start pb-3 border-b border-[#202027] mb-4">
                            <div>
                              <span className="px-1.5 py-0.5 bg-zinc-800 text-[10px] text-zinc-300 font-bold rounded-sm">
                                ELEV +0.00m
                              </span>
                              <h4 className="text-sm font-bold text-white mt-1.5 flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-zinc-300" />
                                TÉRREO // ESTANTE 6M &amp; WORKSTATIONS
                              </h4>
                              <span className="text-[10px] text-zinc-400 block mt-0.5 font-sans">
                                Bancada ESD: Iago &amp; Felipe • Gestão de Cabos: Eduardo
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-300 font-bold bg-zinc-800/80 px-2 py-0.5 border border-zinc-700 rounded-sm">
                              BALCÃO FÍSICO
                            </span>
                          </div>

                          <div className="space-y-2.5 text-[11px]">
                            <div className="flex justify-between py-1 border-b border-[#1a1a22]">
                              <span className="text-zinc-400">Pé-Direito Arquitetônico:</span>
                              <span className="text-white font-bold">6,00 metros livres</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-[#1a1a22]">
                              <span className="text-zinc-400">Estante Industrial Aço:</span>
                              <span className="text-white font-bold">Estoque Cabos do Eduardo</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-[#1a1a22]">
                              <span className="text-zinc-400">Aterramento Eletrostático:</span>
                              <span className="text-white font-bold">Malha ESD &lt; 1.0Ω</span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-zinc-400">Garantia Legal CDC:</span>
                              <span className="text-emerald-400 font-bold">90 Dias com Certificado</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-[#1c1c24] flex items-center justify-between">
                          <span className="text-[10px] text-zinc-400">Curadoria e estresse FurMark</span>
                          <button
                            type="button"
                            onClick={() => setFacilityFloor("level1")}
                            className="text-[11px] text-zinc-300 hover:text-white font-bold underline cursor-pointer"
                          >
                            Ver Detalhes do Térreo &rarr;
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {facilityFloor === "level1" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    <div className="lg:col-span-6 space-y-4">
                      <div className="inline-flex items-center gap-2 font-mono text-[11px] text-zinc-400 bg-[#15151b] border border-[#27272f] px-2.5 py-1 rounded-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>ELEV +0.00m // ATENDIMENTO COM IAGO &amp; FELIPE</span>
                      </div>
                      <h4 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        Térreo: Pé-Direito de 6 Metros &amp; Estante Industrial
                      </h4>
                      <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                        Nosso térreo abriga uma monumental estante industrial de aço de 6 metros de altura com estoque imediato curado por Eduardo (cabos blindados HDMI 2.1 / DisplayPort 1.4, cabos sleeved, adaptadores industriais e fontes 80 Plus Gold/Platinum), além de bancadas de montagem pericial operadas por Iago e Felipe.
                      </p>
                      <div className="space-y-2 font-mono text-xs text-zinc-400 pt-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Bancadas com manta dissipativa e aterramento ESD &lt; 1.0Ω</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Curadoria pericial e montagem sem curvatura mecânica em placas</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Testes de estresse de 30 minutos em AIDA64 e FurMark antes da entrega</span>
                        </div>
                      </div>
                      <div className="pt-4">
                        <TrackedWhatsAppLink
                          phone={brand.whatsapp}
                          message={whatsappRetailMessage}
                          source="facility_floor1_cta"
                          className="btn-tactile-primary text-xs"
                        >
                          <span>PROJETAR WORKSTATION COM OS ESPECIALISTAS</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </TrackedWhatsAppLink>
                      </div>
                    </div>

                    <div className="lg:col-span-6 bg-[#121217] border border-[#24242c] p-6 rounded-sm font-mono text-xs">
                      <div className="flex justify-between items-center pb-3 border-b border-[#202027] mb-4">
                        <span className="text-zinc-400 font-bold uppercase text-[11px]">FICHA TÉCNICA // NÍVEL 01</span>
                        <span className="text-emerald-400 font-bold text-[10px]">CERTIFICADO ESD</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-[#1a1a22]">
                          <span className="text-zinc-400">Pé-Direito Arquitetônico:</span>
                          <span className="text-white font-bold">6,00 metros livres</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[#1a1a22]">
                          <span className="text-zinc-400">Estante Estrutural:</span>
                          <span className="text-white font-bold">Aço Carbono Industrial 6m</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[#1a1a22]">
                          <span className="text-zinc-400">Equipe de Bancada &amp; Estoque:</span>
                          <span className="text-white font-bold">Iago, Felipe &amp; Eduardo</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[#1a1a22]">
                          <span className="text-zinc-400">Aterramento Eletrostático:</span>
                          <span className="text-white font-bold">Barramento Dedicado &lt; 0.8Ω</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-zinc-400">Garantia CDC:</span>
                          <span className="text-emerald-400 font-bold">90 Dias com Certificado Digital</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {facilityFloor === "level2" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    <div className="lg:col-span-6 space-y-4">
                      <div className="inline-flex items-center gap-2 font-mono text-[11px] text-zinc-400 bg-[#15151b] border border-[#27272f] px-2.5 py-1 rounded-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>ELEV +3.60m // SALA SELADA DE MICROELETRÔNICA</span>
                      </div>
                      <h4 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        Mezanino: Câmara a Vácuo OCA &amp; Cirurgia BGA
                      </h4>
                      <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                        O segundo piso abriga nosso laboratório pesado operado por Jefferson no modelo de parceria técnica. Aqui estão instaladas a autoclave industrial desbolhadora de 6 bar, a câmara pneumática a vácuo para colagem óptica OCA e a estação infravermelha de reballing para placas de vídeo.
                      </p>
                      <div className="space-y-2 font-mono text-xs text-zinc-400 pt-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Autoclave de 6.0 Bar para desbolhamento total de telas</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Estação de retrabalho BGA com perfil térmico em 4 etapas</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Microscópio trinocular 4K para restauração de microtrilhas de 0.05mm</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 pt-4">
                        <TrackedWhatsAppLink
                          phone={brand.whatsapp}
                          message={whatsappLabMessage}
                          source="facility_floor2_cta"
                          className="btn-tactile-primary text-xs"
                        >
                          <span>CONSULTAR LAUDO DE MEZANINO</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </TrackedWhatsAppLink>
                        <a
                          href={TELAS_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white font-mono text-xs font-bold transition-colors"
                        >
                          <span>Acessar Portal Telas OCA</span>
                          <ExternalLink className="w-3 h-3 text-zinc-500" />
                        </a>
                      </div>
                    </div>

                    <div className="lg:col-span-6 bg-[#121217] border border-[#24242c] p-6 rounded-sm font-mono text-xs">
                      <div className="flex justify-between items-center pb-3 border-b border-[#202027] mb-4">
                        <span className="text-zinc-400 font-bold uppercase text-[11px]">FICHA TÉCNICA // NÍVEL 02</span>
                        <span className="text-emerald-400 font-bold text-[10px]">MICRO SOLDAGEM ATIVA</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-[#1a1a22]">
                          <span className="text-zinc-400">Responsável de Microeletrônica:</span>
                          <span className="text-white font-bold">Jefferson (Especialista BGA/OCA)</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[#1a1a22]">
                          <span className="text-zinc-400">Pressão da Autoclave:</span>
                          <span className="text-white font-bold">6.0 Bar Regulados</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[#1a1a22]">
                          <span className="text-zinc-400">Câmara Pneumática de Vácuo:</span>
                          <span className="text-white font-bold">-0.08 MPa</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[#1a1a22]">
                          <span className="text-zinc-400">Estação de Retrabalho BGA:</span>
                          <span className="text-white font-bold">Infravermelho com Termopar K</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-zinc-400">Economia em Telas OCA:</span>
                          <span className="text-emerald-400 font-bold">Até 60% vs Troca de Módulo Paralelo</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {facilityFloor === "b2b" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    <div className="lg:col-span-6 space-y-4">
                      <div className="inline-flex items-center gap-2 font-mono text-[11px] text-zinc-400 bg-[#15151b] border border-[#27272f] px-2.5 py-1 rounded-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>REDE REGIONAL // TERCEIRIZAÇÃO LOJISTA</span>
                      </div>
                      <h4 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        Hub Regional: Bragança, Atibaia, Amparo e Extrema
                      </h4>
                      <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                        Dezenas de assistências técnicas da Região Bragantina terceirizam conosco reparos complexos em placas de vídeo e remanufatura de telas que exigiriam maquinário de alto custo. Oferecemos laudos neutros com a identidade técnica da sua assistência e tabela com margem saudável.
                      </p>
                      <div className="space-y-2 font-mono text-xs text-zinc-400 pt-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Laudos técnicos neutros: sua assistência fatura com segurança</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Blindagem de dados do cliente final (LGPD estrita)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Fila prioritária com SLA expresso para lojistas credenciados</span>
                        </div>
                      </div>
                      <div className="pt-4">
                        <TrackedWhatsAppLink
                          phone={brand.whatsapp}
                          message={whatsappB2BMessage}
                          source="facility_b2b_cta"
                          className="btn-tactile-primary text-xs"
                        >
                          <span>CREDENCIAR MINHA ASSISTÊNCIA NO CANAL B2B</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </TrackedWhatsAppLink>
                      </div>
                    </div>

                    <div className="lg:col-span-6 bg-[#121217] border border-[#24242c] p-6 rounded-sm font-mono text-xs">
                      <div className="flex justify-between items-center pb-3 border-b border-[#202027] mb-4">
                        <span className="text-zinc-400 font-bold uppercase text-[11px]">PARCERIA B2B // MODELO OPERACIONAL</span>
                        <span className="text-emerald-400 font-bold text-[10px]">CONFIDENCIAL</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-[#1a1a22]">
                          <span className="text-zinc-400">Cidades Atendidas:</span>
                          <span className="text-white font-bold">Bragança, Atibaia, Socorro, Extrema, Amparo</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[#1a1a22]">
                          <span className="text-zinc-400">Emissão de Laudo:</span>
                          <span className="text-white font-bold">Identificação Neutra para Repasse</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[#1a1a22]">
                          <span className="text-zinc-400">Condições Comerciais:</span>
                          <span className="text-white font-bold">Tabela Especial para Volume Técnico</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[#1a1a22]">
                          <span className="text-zinc-400">Canal de Comunicação:</span>
                          <span className="text-white font-bold">Linha Direta WhatsApp com os Técnicos</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-zinc-400">Retorno em Garantia:</span>
                          <span className="text-emerald-400 font-bold">Prioridade Máxima de Reavaliação</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* SEÇÃO 2 — SPEC-SHEETS MODULARES (ZERO BORDER-L-4, ZERO LISTAS COM SETAS) */}
        {/* ========================================================================= */}
        <section id="solucoes" className="py-20 sm:py-28 border-b border-[#242429] bg-[#09090c] font-sans">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="mb-14">
              <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400 uppercase mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>[ CATÁLOGO DE ENGENHARIA // MODULAR SPEC-SHEETS ]</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Módulos de Solução Técnica.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 via-zinc-400 to-zinc-600">
                  Especificações Nominais de Bancada.
                </span>
              </h2>
              <p className="text-base sm:text-lg text-zinc-400 mt-3 max-w-2xl leading-relaxed">
                Design estruturado com fichas técnicas de usinagem e diagramas de fluxo de bancada. Sem jargões vazios, sem empurrar peças desnecessárias.
              </p>
            </div>

            {/* Grid dos 3 Módulos de Hardware */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Módulo 01: Workstations & Componentes */}
              <div className="milled-chassis p-6 rounded-sm flex flex-col justify-between">
                <div>
                  {/* Cabeçalho do Módulo */}
                  <div className="flex justify-between items-center pb-3 border-b border-[#242429] mb-4 font-mono">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                      MOD-01 // TÉRREO
                    </span>
                    <span className="text-[9px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 border border-emerald-900/60 rounded-sm font-bold">
                      BALCÃO ESD
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-white mb-2 tracking-tight">
                    Workstations de Alta Capacidade &amp; Setup
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-5">
                    Projetamos computadores para profissionais de arquitetura, edição pesada, engenharia e setups gamer. Ajuste térmico, memória Dual-Channel com perfil XMP/EXPO testado e cabos blindados.
                  </p>

                  {/* Tabela de Especificações do Módulo */}
                  <div className="bg-[#121217] border border-[#24242c] p-3 rounded-sm font-mono text-[11px] mb-5 space-y-2">
                    <div className="flex justify-between border-b border-[#1c1c24] pb-1.5">
                      <span className="text-zinc-400">Delta Térmico sob Carga:</span>
                      <span className="text-white font-bold">&Delta;T -20°C a -28°C Estável</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1c1c24] pb-1.5">
                      <span className="text-zinc-400">Ripple Linha 12V:</span>
                      <span className="text-white font-bold">&lt; 15mV Peak-to-Peak</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1c1c24] pb-1.5">
                      <span className="text-zinc-400">Impedância de Aterramento:</span>
                      <span className="text-white font-bold">&lt; 1.0 &Omega; Loop ESD</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1c1c24] pb-1.5">
                      <span className="text-zinc-400">Estresse Obrigatório:</span>
                      <span className="text-white font-bold">AIDA64 + FurMark</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1c1c24] pb-1.5">
                      <span className="text-zinc-400">Fontes Certificadas:</span>
                      <span className="text-white font-bold">80 Plus Gold / Platinum</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Bancada &amp; Cabos 6m:</span>
                      <span className="text-emerald-400 font-bold">Iago, Felipe &amp; Eduardo</span>
                    </div>
                  </div>

                  {/* Fluxo de Bancada */}
                  <div className="border border-[#202027] bg-[#0c0c10] p-3 rounded-sm mb-6 font-mono text-[10px] text-zinc-400">
                    <span className="text-zinc-400 uppercase block font-bold mb-1.5">// FLUXO TÉCNICO DE MONTAGEM</span>
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <span>TRIAGEM</span>
                      <span className="text-zinc-600">&rarr;</span>
                      <span>MONTAGEM ESD</span>
                      <span className="text-zinc-600">&rarr;</span>
                      <span>BURNING QA</span>
                      <span className="text-zinc-600">&rarr;</span>
                      <span className="text-white font-bold">ENTREGA CDC</span>
                    </div>
                  </div>
                </div>

                <TrackedWhatsAppLink
                  phone={brand.whatsapp}
                  message={whatsappRetailMessage}
                  source="module_retail_cta"
                  className="btn-tactile-primary w-full text-xs"
                >
                  <span>SOLICITAR PROJETO WORKSTATION</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </TrackedWhatsAppLink>
              </div>

              {/* Módulo 02: Cirurgia BGA & Telas OCA */}
              <div className="milled-chassis p-6 rounded-sm flex flex-col justify-between">
                <div>
                  {/* Cabeçalho do Módulo */}
                  <div className="flex justify-between items-center pb-3 border-b border-[#242429] mb-4 font-mono">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                      MOD-02 // MEZANINO
                    </span>
                    <span className="text-[9px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 border border-emerald-900/60 rounded-sm font-bold">
                      AUTOCLAVE 6 BAR
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-white mb-2 tracking-tight">
                    Microeletrônica BGA &amp; Laminação OCA
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-5">
                    Recuperação de placas de vídeo com linhas de 12V em curto, substituição de módulos de VRAM, reballing com estêncil a laser e remanufatura óptica de telas preservando o display original.
                  </p>

                  {/* Tabela de Especificações do Módulo */}
                  <div className="bg-[#121217] border border-[#24242c] p-3 rounded-sm font-mono text-[11px] mb-5 space-y-2">
                    <div className="flex justify-between border-b border-[#1c1c24] pb-1.5">
                      <span className="text-zinc-400">Vácuo de Laminação:</span>
                      <span className="text-white font-bold">-0.08 MPa Constante</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1c1c24] pb-1.5">
                      <span className="text-zinc-400">Pressão da Autoclave:</span>
                      <span className="text-white font-bold">6.0 Bar Regulados</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1c1c24] pb-1.5">
                      <span className="text-zinc-400">Curva Térmica BGA:</span>
                      <span className="text-white font-bold">4 Estágios (150°C-217°C)</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1c1c24] pb-1.5">
                      <span className="text-zinc-400">Resolução Microtrilhas:</span>
                      <span className="text-white font-bold">0.05mm Óptico 4K</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1c1c24] pb-1.5">
                      <span className="text-zinc-400">Fidelidade do Display:</span>
                      <span className="text-white font-bold">100% Original de Fábrica</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Operador do Mezanino:</span>
                      <span className="text-emerald-400 font-bold">Jefferson (Especialista)</span>
                    </div>
                  </div>

                  {/* Fluxo de Bancada */}
                  <div className="border border-[#202027] bg-[#0c0c10] p-3 rounded-sm mb-6 font-mono text-[10px] text-zinc-400">
                    <span className="text-zinc-400 uppercase block font-bold mb-1.5">// PROTOCOLO CIRÚRGICO</span>
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <span>TERMOGRAFIA</span>
                      <span className="text-zinc-600">&rarr;</span>
                      <span>SOLDA BGA</span>
                      <span className="text-zinc-600">&rarr;</span>
                      <span>VÁCUO OCA</span>
                      <span className="text-zinc-600">&rarr;</span>
                      <span className="text-white font-bold">LAUDO S/N</span>
                    </div>
                  </div>
                </div>

                <TrackedWhatsAppLink
                  phone={brand.whatsapp}
                  message={whatsappLabMessage}
                  source="module_lab_cta"
                  className="btn-tactile-primary w-full text-xs"
                >
                  <span>CONSULTAR LAUDO DE MEZANINO</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </TrackedWhatsAppLink>
              </div>

              {/* Módulo 03: Hub B2B para Lojistas */}
              <div className="milled-chassis p-6 rounded-sm flex flex-col justify-between">
                <div>
                  {/* Cabeçalho do Módulo */}
                  <div className="flex justify-between items-center pb-3 border-b border-[#242429] mb-4 font-mono">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                      MOD-03 // REGIONAL B2B
                    </span>
                    <span className="text-[9px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 border border-emerald-900/60 rounded-sm font-bold">
                      ATACADO PARCEIRO
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-white mb-2 tracking-tight">
                    Terceirização para Lojas &amp; Assistências
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-5">
                    Infraestrutura de ponta para a sua loja não perder clientes de alta complexidade. Laudos com identificação técnica neutra, tabela com margem saudável e prioridade na fila técnica.
                  </p>

                  {/* Tabela de Especificações do Módulo */}
                  <div className="bg-[#121217] border border-[#24242c] p-3 rounded-sm font-mono text-[11px] mb-5 space-y-2">
                    <div className="flex justify-between border-b border-[#1c1c24] pb-1.5">
                      <span className="text-zinc-400">SLA Triagem Lojista:</span>
                      <span className="text-white font-bold">&lt; 24h Prioritário</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1c1c24] pb-1.5">
                      <span className="text-zinc-400">Emissão de Laudo:</span>
                      <span className="text-white font-bold">100% White-Label Neutro</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1c1c24] pb-1.5">
                      <span className="text-zinc-400">Sigilo de Dados:</span>
                      <span className="text-white font-bold">Blindagem LGPD Estrita</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1c1c24] pb-1.5">
                      <span className="text-zinc-400">Raio de Cobertura:</span>
                      <span className="text-white font-bold">Bragança, Atibaia, Amparo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Garantia Técnica:</span>
                      <span className="text-emerald-400 font-bold">90 Dias com Fila Rápida</span>
                    </div>
                  </div>

                  {/* Fluxo de Bancada */}
                  <div className="border border-[#202027] bg-[#0c0c10] p-3 rounded-sm mb-6 font-mono text-[10px] text-zinc-400">
                    <span className="text-zinc-400 uppercase block font-bold mb-1.5">// CANAL LOJISTA</span>
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <span>ENTREGA</span>
                      <span className="text-zinc-600">&rarr;</span>
                      <span>LAB PRIVADO</span>
                      <span className="text-zinc-600">&rarr;</span>
                      <span>LAUDO NEUTRO</span>
                      <span className="text-zinc-600">&rarr;</span>
                      <span className="text-white font-bold">REVENDA</span>
                    </div>
                  </div>
                </div>

                <TrackedWhatsAppLink
                  phone={brand.whatsapp}
                  message={whatsappB2BMessage}
                  source="module_b2b_cta"
                  className="btn-tactile-secondary w-full text-xs"
                >
                  <span>CREDENCIAR COMO PARCEIRO B2B</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </TrackedWhatsAppLink>
              </div>

            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* SEÇÃO 3 — CONSOLE DE TRIAGEM COM CHAVES SELETORAS TÁCTEIS (SUBSTITUI OS 3 CARDS) */}
        {/* ========================================================================= */}
        <section id="triagem" className="py-20 sm:py-24 border-b border-[#242429] bg-[#0d0d11] font-sans">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="mb-12">
              <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400 uppercase mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>[ SELETOR DE ATENDIMENTO DIRETO // WHATSAPP DISPATCH ]</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Qual é a sua demanda técnica hoje?
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 mt-2 max-w-2xl leading-relaxed">
                Utilize nossa chave seletora táctil para carregar o protocolo exato e abrir o canal direto com o especialista no WhatsApp sem formulários cansativos:
              </p>
            </div>

            {/* Painel Central com Chave Seletora Táctil */}
            <div className="milled-chassis p-6 sm:p-8 rounded-sm">
              
              {/* Barra de Seleção Táctil de Modos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
                
                <button
                  type="button"
                  onClick={() => setSelectedDemand("retail")}
                  className={`p-4 border text-left rounded-sm font-mono transition-all cursor-pointer ${
                    selectedDemand === "retail"
                      ? "bg-white text-black border-white shadow-md"
                      : "bg-[#131318] text-zinc-300 border-[#272730] hover:border-zinc-500"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      CENÁRIO 01 // BALCÃO TÉRREO
                    </span>
                    <Cpu className={`w-4 h-4 ${selectedDemand === "retail" ? "text-black" : "text-zinc-400"}`} />
                  </div>
                  <strong className="text-sm sm:text-base block font-sans font-extrabold leading-snug">
                    Workstations, Setup Gamer &amp; Upgrades
                  </strong>
                  <span className={`text-[11px] block mt-1 ${selectedDemand === "retail" ? "text-zinc-700" : "text-zinc-400"}`}>
                    Máquina lenta, superaquecimento, boot travado
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDemand("lab")}
                  className={`p-4 border text-left rounded-sm font-mono transition-all cursor-pointer ${
                    selectedDemand === "lab"
                      ? "bg-white text-black border-white shadow-md"
                      : "bg-[#131318] text-zinc-300 border-[#272730] hover:border-zinc-500"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      CENÁRIO 02 // MEZANINO
                    </span>
                    <Layers className={`w-4 h-4 ${selectedDemand === "lab" ? "text-black" : "text-zinc-400"}`} />
                  </div>
                  <strong className="text-sm sm:text-base block font-sans font-extrabold leading-snug">
                    Cirurgia BGA, Placa de Vídeo &amp; Tela OCA
                  </strong>
                  <span className={`text-[11px] block mt-1 ${selectedDemand === "lab" ? "text-zinc-700" : "text-zinc-400"}`}>
                    Linhas 12V em curto, VRAM com artefato, vidro quebrado
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDemand("b2b")}
                  className={`p-4 border text-left rounded-sm font-mono transition-all cursor-pointer ${
                    selectedDemand === "b2b"
                      ? "bg-white text-black border-white shadow-md"
                      : "bg-[#131318] text-zinc-300 border-[#272730] hover:border-zinc-500"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      CENÁRIO 03 // B2B REGIONAL
                    </span>
                    <Building2 className={`w-4 h-4 ${selectedDemand === "b2b" ? "text-black" : "text-zinc-400"}`} />
                  </div>
                  <strong className="text-sm sm:text-base block font-sans font-extrabold leading-snug">
                    Terceirização para Minha Assistência Técnica
                  </strong>
                  <span className={`text-[11px] block mt-1 ${selectedDemand === "b2b" ? "text-zinc-700" : "text-zinc-400"}`}>
                    Tabela de atacado, laudo neutro e sigilo comercial
                  </span>
                </button>

              </div>

              {/* Painel de Ação Detalhado do Modo Selecionado */}
              <div className="bg-[#121217] border border-[#24242c] p-6 sm:p-7 rounded-sm">
                
                {selectedDemand === "retail" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    <div className="lg:col-span-8 space-y-3">
                      <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>TRIAGEM TÉRREO // RESPONSÁVEIS: IAGO &amp; FELIPE</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                        Diagnóstico Térmico e de Estresse em Bancada
                      </h3>
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        Abriremos sua máquina na bancada física, verificaremos pasta térmica com condutividade certificada, mediremos o ripple da fonte e analisaremos a saúde do SSD/NVMe sem trocas desnecessárias.
                      </p>
                      <div className="flex flex-wrap gap-4 font-mono text-xs text-zinc-400 pt-2">
                        <span>• Prazo de Triagem: 2 a 4 horas úteis</span>
                        <span>• Laudo transparente com fotos</span>
                        <span>• Garantia legal de 90 dias</span>
                      </div>
                    </div>
                    <div className="lg:col-span-4 flex flex-col justify-center">
                      <TrackedWhatsAppLink
                        phone={brand.whatsapp}
                        message={whatsappRetailMessage}
                        source="triage_switch_retail"
                        className="btn-tactile-primary text-xs py-4 px-6 text-center justify-center"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>INICIAR DIAGNÓSTICO COM IAGO/FELIPE</span>
                      </TrackedWhatsAppLink>
                    </div>
                  </div>
                )}

                {selectedDemand === "lab" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    <div className="lg:col-span-8 space-y-3">
                      <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>TRIAGEM MEZANINO // RESPONSÁVEL: JEFFERSON</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                        Microeletrônica Pesada &amp; Remanufatura OCA
                      </h3>
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        Sua GPU não dá vídeo ou está em curto? Seu display de smartphone está com o vidro trincado mas com toque e imagem funcionando? O mezanino conta com autoclave de 6 bar e estação BGA infravermelha para recuperação precisa.
                      </p>
                      <div className="flex flex-wrap gap-4 font-mono text-xs text-zinc-400 pt-2">
                        <span>• Economia de até 60% em telas</span>
                        <span>• Termografia óptica de curtos</span>
                        <span>• Reballing com esferas Lead-Free</span>
                      </div>
                    </div>
                    <div className="lg:col-span-4 flex flex-col justify-center">
                      <TrackedWhatsAppLink
                        phone={brand.whatsapp}
                        message={whatsappLabMessage}
                        source="triage_switch_lab"
                        className="btn-tactile-primary text-xs py-4 px-6 text-center justify-center"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>CONSULTAR LAUDO COM JEFFERSON</span>
                      </TrackedWhatsAppLink>
                    </div>
                  </div>
                )}

                {selectedDemand === "b2b" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    <div className="lg:col-span-8 space-y-3">
                      <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>CREDENCIAMENTO B2B // LOJISTAS REGIONAIS</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                        Parceria de Terceirização sem Risco de Imagem
                      </h3>
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        Receba seus clientes com total autoridade, envie os casos de microeletrônica para nossa bancada no Centro de Bragança e entregue ao seu cliente um laudo neutro profissional, aumentando o ticket médio da sua loja.
                      </p>
                      <div className="flex flex-wrap gap-4 font-mono text-xs text-zinc-400 pt-2">
                        <span>• Sigilo absoluto de dados LGPD</span>
                        <span>• Faturamento em tabela de atacado</span>
                        <span>• Canal exclusivo WhatsApp B2B</span>
                      </div>
                    </div>
                    <div className="lg:col-span-4 flex flex-col justify-center">
                      <TrackedWhatsAppLink
                        phone={brand.whatsapp}
                        message={whatsappB2BMessage}
                        source="triage_switch_b2b"
                        className="btn-tactile-secondary text-xs py-4 px-6 text-center justify-center"
                      >
                        <Building2 className="w-4 h-4" />
                        <span>SOLICITAR CADASTRO DE LOJISTA</span>
                      </TrackedWhatsAppLink>
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* SEÇÃO 4 — LAUDO PERICIAL & PERFORMANCE COMPROVADA (METROLOGIA REAL)       */}
        {/* ========================================================================= */}
        <section id="laudo" className="py-20 sm:py-28 border-b border-[#242429] bg-[#09090c] font-sans">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-6 space-y-5">
                <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>[ METROLOGIA DE BANCADA // LAUDO TÉCNICO ]</span>
                </div>
                <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                  Dados Numéricos Reais.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 via-zinc-400 to-zinc-600">
                    Zero Gráficos Abstratos de IA.
                  </span>
                </h2>
                <p className="text-base text-zinc-300 leading-relaxed">
                  Não colocamos ilustrações 3D decorativas sem significado. Apresentamos dados metrológicos reais obtidos nas máquinas calibradas nas nossas bancadas em Bragança Paulista:
                </p>

                <div className="bg-[#121217] border border-[#24242c] p-5 rounded-sm font-mono text-xs space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1f1f26]">
                    <span className="text-zinc-400">Tempo de Inicialização (Boot Dell Inspiron):</span>
                    <span className="text-white font-bold">De 84s para 11s (-87%)</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-[#1f1f26]">
                    <span className="text-zinc-400">Temperatura GPU sob Estresse (RTX 3070 Ti):</span>
                    <span className="text-white font-bold">De 88°C para 68°C (-20°C)</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-[#1f1f26]">
                    <span className="text-zinc-400">Fidelidade Cromática da Tela Remanufaturada:</span>
                    <span className="text-white font-bold">100% Gamut Original</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Custódia e Privacidade de Armazenamento:</span>
                    <span className="text-emerald-400 font-bold">Zero Violação LGPD</span>
                  </div>
                </div>

                <div className="pt-2">
                  <TrackedWhatsAppLink
                    phone={brand.whatsapp}
                    message={whatsappRetailMessage}
                    source="laudo_cta_btn"
                    className="btn-tactile-primary text-xs"
                  >
                    <span>AGENDAR DIAGNÓSTICO EM BANCADA</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </TrackedWhatsAppLink>
                </div>
              </div>

              {/* Certificado de Metrologia em Estilo Aeronáutico */}
              <div className="lg:col-span-6">
                <div className="milled-chassis p-6 sm:p-7 rounded-sm font-mono text-xs">
                  
                  {/* Cabeçalho do Laudo */}
                  <div className="flex justify-between items-center pb-4 border-b border-[#242429] mb-5">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase block tracking-wider font-bold">
                        PROTOCOLO OFICIAL DE BANCADA
                      </span>
                      <strong className="text-white text-sm font-bold block">
                        CERTIFICADO PERICIAL DE PERFORMANCE
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 block">ID // CYB-CERT-2026</span>
                      <span className="text-emerald-400 font-bold text-[10px] bg-emerald-950/80 px-2 py-0.5 border border-emerald-900/60 rounded-sm">
                        VALIDADO [OK]
                      </span>
                    </div>
                  </div>

                  {/* Barras de Comparativo Metrológico */}
                  <div className="space-y-4">
                    
                    {/* Item 1: Boot Time */}
                    <div className="bg-[#121217] border border-[#22222a] p-3.5 rounded-sm space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white font-bold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          Tempo de Boot (Inicialização de Sistema)
                        </span>
                        <span className="text-[10px] text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded-sm font-bold">
                          -87% TEMPO
                        </span>
                      </div>
                      <div className="space-y-1.5 text-[11px]">
                        <div>
                          <div className="flex justify-between text-zinc-400">
                            <span>HD Mecânico Antigo:</span>
                            <span className="text-red-400 font-bold">84 segundos</span>
                          </div>
                          <div className="w-full bg-[#0a0a0d] h-2 rounded-sm overflow-hidden mt-1 border border-[#202027]">
                            <div className="bg-red-500 h-full" style={{ width: "84%" }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-zinc-300 font-bold">
                            <span>Tuning NVMe Gen4 Cyber:</span>
                            <span className="text-white font-black">11 segundos</span>
                          </div>
                          <div className="w-full bg-[#0a0a0d] h-2 rounded-sm overflow-hidden mt-1 border border-[#202027]">
                            <div className="bg-white h-full" style={{ width: "13%" }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Item 2: Temperatura em Carga */}
                    <div className="bg-[#121217] border border-[#22222a] p-3.5 rounded-sm space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white font-bold flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-zinc-400" />
                          Temperatura GPU sob Estresse (FurMark)
                        </span>
                        <span className="text-[10px] text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded-sm font-bold">
                          -20°C ESTÁVEL
                        </span>
                      </div>
                      <div className="space-y-1.5 text-[11px]">
                        <div>
                          <div className="flex justify-between text-zinc-400">
                            <span>Estado Anterior (Thermal Throttling):</span>
                            <span className="text-red-400 font-bold">88°C</span>
                          </div>
                          <div className="w-full bg-[#0a0a0d] h-2 rounded-sm overflow-hidden mt-1 border border-[#202027]">
                            <div className="bg-red-500 h-full" style={{ width: "88%" }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-zinc-300 font-bold">
                            <span>Bancada Cyber (Pads Térmicos &amp; Pasta Prata):</span>
                            <span className="text-white font-black">68°C</span>
                          </div>
                          <div className="w-full bg-[#0a0a0d] h-2 rounded-sm overflow-hidden mt-1 border border-[#202027]">
                            <div className="bg-white h-full" style={{ width: "68%" }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Item 3: Remanufatura OCA */}
                    <div className="bg-[#121217] border border-[#22222a] p-3.5 rounded-sm space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white font-bold flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-zinc-400" />
                          Fidelidade de Tela &amp; Sensibilidade de Toque
                        </span>
                        <span className="text-[10px] text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded-sm font-bold">
                          100% ORIGINAL
                        </span>
                      </div>
                      <div className="space-y-1.5 text-[11px]">
                        <div>
                          <div className="flex justify-between text-zinc-400">
                            <span>Peça Paralela Comum:</span>
                            <span className="text-red-400 font-bold">Toque impreciso / Cores opacas</span>
                          </div>
                          <div className="w-full bg-[#0a0a0d] h-2 rounded-sm overflow-hidden mt-1 border border-[#202027]">
                            <div className="bg-red-500 h-full" style={{ width: "45%" }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-zinc-300 font-bold">
                            <span>Remanufatura OCA Cyber no Mezanino:</span>
                            <span className="text-white font-black">Display Original de Fábrica Preservado</span>
                          </div>
                          <div className="w-full bg-[#0a0a0d] h-2 rounded-sm overflow-hidden mt-1 border border-[#202027]">
                            <div className="bg-white h-full" style={{ width: "100%" }} />
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Carimbo de Hash Criptográfico */}
                  <div className="mt-5 pt-3 border-t border-[#242429] flex items-center justify-between text-[10px] text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Hash className="w-3 h-3 text-zinc-500" />
                      SHA-256: 9e67...d4a1 // PROTOCOLO CDC ART. 26
                    </span>
                    <span className="text-emerald-400 font-bold">CONFORME</span>
                  </div>

                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* SEÇÃO 5 — MATRIZ DE QUALIDADE (CYBER VS ASSISTÊNCIAS COMUNS)             */}
        {/* ========================================================================= */}
        <section id="comparativo" className="py-20 sm:py-24 border-b border-[#242429] bg-[#0c0c10] font-sans">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="mb-12">
              <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400 uppercase mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>[ MATRIZ DE CRITÉRIOS // TRANSPARÊNCIA RADICAL ]</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Critérios Técnicos: Cyber vs Assistências de Galeria
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 mt-2 max-w-2xl leading-relaxed">
                Entenda os padrões de conformidade técnica que protegem seu investimento e garantem a durabilidade real dos seus equipamentos:
              </p>
            </div>

            <div className="overflow-x-auto border border-[#242429] rounded-sm shadow-xl font-mono text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#242429] bg-[#121217] text-zinc-400 uppercase text-[11px]">
                    <th className="py-3.5 px-4 sm:px-6 w-1/3">Critério Técnico de Bancada</th>
                    <th className="py-3.5 px-4 sm:px-6 w-1/3 text-zinc-400">Assistência de Galeria Comum</th>
                    <th className="py-3.5 px-4 sm:px-6 w-1/3 text-white bg-[#15151b] border-l border-zinc-700 font-bold">
                      Cyber Informática // Padrão Industrial
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f1f26] text-zinc-300">
                  <tr className="hover:bg-[#121217]/50">
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-white">Método de Diagnóstico</td>
                    <td className="py-3.5 px-4 sm:px-6 text-zinc-400">Troca de peça no chute sem instrumentação</td>
                    <td className="py-3.5 px-4 sm:px-6 text-white font-bold bg-[#15151b]/40 border-l border-zinc-700">
                      Câmera térmica, estresse AIDA64 e análise de ripple da fonte
                    </td>
                  </tr>
                  <tr className="hover:bg-[#121217]/50">
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-white">Infraestrutura Física</td>
                    <td className="py-3.5 px-4 sm:px-6 text-zinc-400">Balcão improvisado sem aterramento antiestático</td>
                    <td className="py-3.5 px-4 sm:px-6 text-white font-bold bg-[#15151b]/40 border-l border-zinc-700">
                      Bancada ESD aterrada, estante de 6m e mezanino industrial OCA
                    </td>
                  </tr>
                  <tr className="hover:bg-[#121217]/50">
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-white">Acompanhamento do Serviço</td>
                    <td className="py-3.5 px-4 sm:px-6 text-zinc-400">Cliente liga sem saber o status da máquina</td>
                    <td className="py-3.5 px-4 sm:px-6 text-white font-bold bg-[#15151b]/40 border-l border-zinc-700">
                      Portal Digital 24/7 com histórico pericial fotográfico
                    </td>
                  </tr>
                  <tr className="hover:bg-[#121217]/50">
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-white">Procedência de Componentes</td>
                    <td className="py-3.5 px-4 sm:px-6 text-zinc-400">Peças genéricas sem nota ou rastreabilidade</td>
                    <td className="py-3.5 px-4 sm:px-6 text-white font-bold bg-[#15151b]/40 border-l border-zinc-700">
                      Componentes homologados com Número de Série (S/N) arquivado
                    </td>
                  </tr>
                  <tr className="hover:bg-[#121217]/50">
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-white">Microeletrônica Pesada</td>
                    <td className="py-3.5 px-4 sm:px-6 text-zinc-400">Condena a placa ou envia para terceiros distantes</td>
                    <td className="py-3.5 px-4 sm:px-6 text-white font-bold bg-[#15151b]/40 border-l border-zinc-700">
                      Mezanino próprio com autoclave de 6 bar e estação BGA (Jefferson)
                    </td>
                  </tr>
                  <tr className="hover:bg-[#121217]/50">
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-white">Garantia Legal</td>
                    <td className="py-3.5 px-4 sm:px-6 text-zinc-400">30 dias informais "de boca"</td>
                    <td className="py-3.5 px-4 sm:px-6 text-emerald-400 font-bold bg-[#15151b]/40 border-l border-zinc-700">
                      90 Dias Integrais (Art. 26 CDC) com Certificado Digital
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* SEÇÃO 6 — INFRAESTRUTURA FÍSICA & LOCALIZAÇÃO (10 ANOS NO CENTRO)         */}
        {/* ========================================================================= */}
        <section id="localizacao" className="py-20 sm:py-28 border-b border-[#242429] bg-[#09090c] font-sans">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              <div className="lg:col-span-7 space-y-5">
                <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>[ ENDEREÇO OFICIAL // CENTRO HISTÓRICO ]</span>
                </div>
                <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                  Rua Coronel Teófilo Leme, 967.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 via-zinc-400 to-zinc-600">
                    10 Anos no Centro de Bragança.
                  </span>
                </h2>
                <p className="text-base text-zinc-300 leading-relaxed">
                  Não somos uma operação fantasma de marketplace. Nossa loja física de pé-direito duplo de 6 metros está localizada em ponto central e acessível, com atendimento humano especializado, estoque físico à vista e laboratório residente.
                </p>

                <div className="bg-[#121217] border border-[#24242c] p-5 rounded-sm font-mono text-xs space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Endereço de Bancada:</strong>
                      <p className="text-zinc-400 mt-0.5">
                        Rua Coronel Teófilo Leme, 967 — Centro, Bragança Paulista - SP, CEP 12900-003
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 pt-2.5 border-t border-[#1c1c24]">
                    <Clock className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Horário de Atendimento Presencial:</strong>
                      <p className="text-zinc-400 mt-0.5">
                        Segunda a Sexta: 09h às 18h • Sábado: 09h às 13h
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <a
                    href="https://maps.google.com/?q=Rua+Coronel+Teófilo+Leme+967+Bragança+Paulista"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-tactile-secondary text-xs py-3.5 px-6"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>ABRIR NO GOOGLE MAPS</span>
                  </a>

                  <TrackedWhatsAppLink
                    phone={brand.whatsapp}
                    message={whatsappGeralMessage}
                    source="localizacao_whatsapp_cta"
                    className="btn-tactile-primary text-xs py-3.5 px-6"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>CHAMAR NO WHATSAPP</span>
                  </TrackedWhatsAppLink>
                </div>
              </div>

              {/* Painel do Mapa de Estrutura Física */}
              <div className="lg:col-span-5">
                <div className="milled-chassis p-6 rounded-sm font-mono text-xs space-y-4">
                  <div className="border-b border-[#242429] pb-3">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                      FACILITY OVERVIEW // 967
                    </span>
                    <strong className="text-white text-sm font-bold">
                      QUADRO TÉCNICO RESIDENTE
                    </strong>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-[#121217] border border-[#202028] rounded-sm">
                      <div className="flex justify-between items-center text-white font-bold mb-1">
                        <span>IAGO &amp; FELIPE</span>
                        <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded-sm">TÉRREO 6M</span>
                      </div>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        Curadoria de hardware, montagem de workstations, upgrades e atendimento direto no balcão pericial.
                      </p>
                    </div>

                                        <div className="p-3 bg-[#121217] border border-[#202028] rounded-sm">
                      <div className="flex justify-between items-center text-white font-bold mb-1">
                        <span>EDUARDO</span>
                        <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded-sm">ESTANTE 6M</span>
                      </div>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        Gestão da monumental estante de 6m e estoque de cabos blindados HDMI 2.1, DisplayPort 1.4, fontes 80 Plus e insumos de bancada.
                      </p>
                    </div>

                    <div className="p-3 bg-[#121217] border border-[#202028] rounded-sm">
                      <div className="flex justify-between items-center text-white font-bold mb-1">
                        <span>JEFFERSON</span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded-sm">MEZANINO</span>
                      </div>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        Microeletrônica avançada, cirurgia de placas de vídeo BGA e remanufatura em autoclave de 6 bar.
                      </p>
                    </div>

                    <div className="p-3 bg-[#121217] border border-[#202028] rounded-sm">
                      <div className="flex justify-between items-center text-white font-bold mb-1">
                        <span>CANAIS B2B &amp; LOJISTAS</span>
                        <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded-sm">REGIONAL</span>
                      </div>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        Terceirização para assistências técnicas de Bragança, Atibaia, Extrema, Socorro e Amparo.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* SEÇÃO 7 — TECH-NOTES / PERGUNTAS FREQUENTES (FAQ ESTRUTURADO)             */}
        {/* ========================================================================= */}
        <section id="faq" className="py-20 sm:py-24 border-b border-[#242429] bg-[#0c0c10] font-sans">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="mb-12">
              <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400 uppercase mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>[ TECH-NOTES // DÚVIDAS RECORRENTES ]</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Perguntas Frequentes &amp; Prazos
              </h2>
            </div>

            <div className="space-y-3 font-mono">
              {[
                {
                  code: "NOTE-01",
                  q: "Preciso agendar horário para levar meu computador ou placa?",
                  a: "Não. Nosso balcão pericial na Rua Coronel Teófilo Leme 967 está aberto em horário comercial contínuo. Basta comparecer com seu equipamento para abertura imediata de protocolo com checklist fotográfico.",
                },
                {
                  code: "NOTE-02",
                  q: "Como funciona a garantia legal de 90 dias?",
                  a: "Todos os serviços de bancada, montagens e reparos em microeletrônica contam com 90 dias de garantia legal integral (Art. 26 do Código de Defesa do Consumidor), com emissão de Certificado Digital e laudo pericial formal.",
                },
                {
                  code: "NOTE-03",
                  q: "Minha assistência pode terceirizar serviços pesados com a Cyber?",
                  a: "Sim. Temos um canal exclusivo B2B com tabela de atacado para assistências técnicas e lojistas de Bragança, Atibaia, Socorro, Amparo e Extrema. Entregamos laudos neutros com sigilo total de dados do seu cliente final.",
                },
                {
                  code: "NOTE-04",
                  q: "Qual a vantagem de remanufaturar a tela com película OCA?",
                  a: "Preserva o display original OLED/AMOLED de fábrica, mantendo 100% da sensibilidade ao toque, brilho e taxas de atualização nativas, gerando uma economia de até 60% comparado à troca do módulo completo por peças paralelas.",
                },
              ].map((item) => (
                <div key={item.code} className="milled-chassis p-5 rounded-sm">
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase mb-1">
                    <span>{item.code}</span>
                    <span>•</span>
                    <span className="text-zinc-300">PROTOCOLO DE BANCADA</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white mb-2 font-sans">
                    {item.q}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans pl-3 border-l border-zinc-700">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* SEÇÃO 8 — CTA FINAL DE CONTRASTE INDUSTRIAL (CHASSI USINADO)              */}
        {/* ========================================================================= */}
        <section id="contato" className="py-20 sm:py-24 bg-[#09090c] border-b border-[#242429] font-sans relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] text-zinc-400 uppercase bg-[#121217] border border-[#272730] px-3 py-1 rounded-sm mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>ATENDIMENTO DIRETO COM ESPECIALISTAS</span>
            </div>
            
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
              Hardware de Precisão.<br />
              Bancada de Confiança para o seu Projeto.
            </h2>
            
            <p className="text-base sm:text-lg text-zinc-300 max-w-2xl mx-auto leading-relaxed mb-8">
              De um upgrade de alto rendimento à recuperação de placas complexas e terceirização B2B no Centro de Bragança Paulista.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <TrackedWhatsAppLink
                phone={brand.whatsapp}
                message={whatsappGeralMessage}
                source="final_cta_button"
                className="btn-tactile-primary text-sm py-4 px-8"
              >
                <Zap className="w-4 h-4" />
                <span>FALAR COM O ESPECIALISTA AGORA</span>
              </TrackedWhatsAppLink>

              <Link
                href="/status"
                className="btn-tactile-secondary text-sm py-4 px-8"
              >
                <FileText className="w-4 h-4" />
                <span>CONSULTAR ORDEM DE SERVIÇO (OS)</span>
              </Link>
            </div>
          </div>
        </section>

        <Footer />
        <WhatsAppButton />
      </main>
    </>
  );
}
