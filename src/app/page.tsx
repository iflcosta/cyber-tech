import {
  Monitor,
  Laptop,
  Cpu,
  Layers,
  Sparkles,
  Wrench,
  MessageCircle,
  ArrowRight,
  Building2,
  ShieldCheck,
  Microscope,
  HardDrive,
  Cable,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import TrackedWhatsAppLink from "@/components/TrackedWhatsAppLink";
import { Reveal, RevealGroup } from "@/components/Reveal";
import { brand } from "@/lib/brand";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; persona?: string; utm_source?: string; utm_campaign?: string }>;
}) {
  const params = await searchParams;
  const serviceParam = params?.service ?? null;
  const isB2BFromUtm =
    params?.utm_campaign?.toLowerCase().includes("b2b") ||
    params?.utm_campaign?.toLowerCase().includes("lojista") ||
    params?.utm_campaign?.toLowerCase().includes("parceiro");
  const personaParam = params?.persona === "lojista" || isB2BFromUtm ? "lojista" : null;

  const whatsappCuradoriaMessage = "Olá! Vim pelo site da Cyber e gostaria de falar com a curadoria técnica sobre PCs e Workstations.";
  const whatsappMezaninoMessage = "Olá! Vim pelo site da Cyber e gostaria de falar sobre recuperação de placas de vídeo e laminação de telas OCA.";
  const whatsappB2BMessage =
    "Olá! Sou lojista/assistência técnica em Bragança ou região. Vim pelo site da Cyber e gostaria de falar sobre terceirização técnica e parcerias B2B.";

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
        {/* Hero V2 com Rastreio de OS em Tempo Real */}
        <Hero serviceParam={serviceParam} personaParam={personaParam} />

        {/* ========================================================================= */}
        {/* SEÇÃO 1 — VAREJO HIGH-END & WORKSTATIONS (ID: CATALOGO)                   */}
        {/* ========================================================================= */}
        <section id="catalogo" className="section bg-[#111114] border-b border-white/[0.06]">
          <div className="container-narrow">
            <Reveal>
              <div className="text-center mb-12">
                <span className="kicker">Varejo & Projetos High-End</span>
                <h2 className="display mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                  Engenharia de hardware e setups sob medida com <span className="gradient-text">curadoria técnica</span>.
                </h2>
                <p className="mt-3 text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto">
                  Equipamentos montados para durabilidade extrema, silêncio e estabilidade térmica. Sem peças genéricas e sem fanatismo por marca.
                </p>
              </div>
            </Reveal>

            <RevealGroup as="div" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.12}>
              {[
                {
                  icon: Monitor,
                  tag: "PROJETO SOB MEDIDA",
                  title: "Workstations & PCs Gamers",
                  copy: "Montagem cirúrgica com cable management pericial, escolha de VRMs robustos, pasta térmica de prata e estresse AIDA64 de 15 minutos antes da liberação.",
                  cta: "Solicitar Projeto Sob Medida",
                  href: whatsappCuradoriaMessage,
                  source: "card_workstations",
                },
                {
                  icon: HardDrive,
                  tag: "ALTA PERFORMANCE",
                  title: "Upgrades Profissionais de Hardware",
                  copy: "Substituição e clonagem pericial para NVMe Gen4, expansão de memória em Dual-Channel calibrado, trocas de fontes com certificação 80 Plus Gold e cooling de alta pressão.",
                  cta: "Consultar Upgrades Disponíveis",
                  href: whatsappCuradoriaMessage,
                  source: "card_upgrades",
                },
                {
                  icon: Cable,
                  tag: "ESTOQUE FÍSICO PRONTA-ENTREGA",
                  title: "Periféricos & Cabos Especiais",
                  copy: "Cabos blindados DisplayPort 1.4, HDMI 2.1 8K, adaptadores de precisão, insumos térmicos, memórias e conectores de alta condutividade a pronta-entrega na loja.",
                  cta: "Consultar Estoque em Loja",
                  href: whatsappCuradoriaMessage,
                  source: "card_estoque",
                },
              ].map((card) => (
                <Reveal as="article" key={card.title}>
                  <article className="relative bg-[#18181b] border border-white/[0.08] hover:border-white/20 transition-all rounded-lg p-6 flex flex-col justify-between h-full group">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <card.icon size={26} className="text-white" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                          {card.tag}
                        </span>
                      </div>
                      <h3 className="display text-xl font-bold mb-2 text-white group-hover:text-zinc-200 transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                        {card.copy}
                      </p>
                    </div>

                    <TrackedWhatsAppLink
                      phone={brand.whatsapp}
                      message={card.href}
                      source={card.source}
                      className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-white hover:text-emerald-400 transition-colors group/link mt-auto pt-4 border-t border-white/5"
                      ariaLabel={card.cta}
                    >
                      <span>{card.cta}</span>
                      <ArrowRight size={14} className="transition-transform group-hover/link:translate-x-1" />
                    </TrackedWhatsAppLink>
                  </article>
                </Reveal>
              ))}
            </RevealGroup>

            {/* Aviso de Transparência */}
            <Reveal delay={0.2}>
              <div className="mt-10 text-center">
                <p className="text-xs font-mono text-zinc-400">
                  Já possui equipamento em atendimento?{' '}
                  <Link href="/status" className="text-white underline hover:text-emerald-400 font-bold ml-1">
                    Acompanhe em tempo real pelo Portal de Rastreio &rarr;
                  </Link>
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SEÇÃO 2 — LABORATÓRIO DE ENGENHARIA & BANCADA (ID: LABORATORIO)           */}
        {/* ========================================================================= */}
        <section id="laboratorio" className="section bg-[#09090b] border-b border-white/[0.06]">
          <div className="container-narrow">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <Reveal>
                <span className="kicker">Infraestrutura Física</span>
                <h2 className="display mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
                  Laboratório com bancadas aterradas e <span className="gradient-text">diagnóstico pericial</span>.
                </h2>
                <p className="text-base text-zinc-300 leading-relaxed mb-6">
                  Diferente de assistências que terceirizam o serviço ou operam sem equipamentos adequados, a Cyber Informática conta com laboratório próprio no Centro de Bragança Paulista com manta antiestática ESD, osciloscópio digital, microscópio pericial e fontes de precisão.
                </p>

                <div className="space-y-3 font-mono text-xs text-zinc-300 mb-8">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                    <span>Laudo fotográfico de entrada comprovando o estado do chassi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                    <span>Orçamento detalhado discriminando insumos e mão de obra</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                    <span>Garantia legal de 90 dias com certificado digital registrado</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <TrackedWhatsAppLink
                    phone={brand.whatsapp}
                    message={whatsappCuradoriaMessage}
                    source="lab_bancada"
                    className="btn-primary inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold"
                  >
                    <MessageCircle size={16} />
                    Falar com os Técnicos
                  </TrackedWhatsAppLink>
                </div>
              </Reveal>

              <Reveal delay={0.15}>
                <div className="bg-[#111114] border border-white/10 p-6 sm:p-8 rounded-lg space-y-4 font-mono">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <Microscope className="w-5 h-5 text-emerald-400" />
                      <span>CORPO TÉCNICO RESIDENTE</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 uppercase">Sem Intermediários</span>
                  </div>

                  <div className="space-y-4 text-xs text-zinc-300">
                    <div className="bg-black/50 border border-white/5 p-4 rounded">
                      <p className="font-bold text-white text-sm">Iago & Felipe</p>
                      <p className="text-zinc-400 mt-1">
                        Curadoria pericial, montagem de workstations de alta performance, projetos de arquitetura de hardware e gestão do laboratório.
                      </p>
                    </div>

                    <div className="bg-black/50 border border-white/5 p-4 rounded">
                      <p className="font-bold text-white text-sm">Jefferson (Mezanino)</p>
                      <p className="text-zinc-400 mt-1">
                        Especialista em microeletrônica avançada, recuperação de circuitos complexos BGA (GPUs e placas lógicas) e engenharia óptica de telas OCA.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 text-[11px] text-zinc-400 text-center">
                    Atendimento técnico direto ao cliente e balcão parceiro para lojistas.
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SEÇÃO 3 — MEZANINO DE MICROELETRÔNICA & TELAS OCA (ID: MEZANINO)           */}
        {/* ========================================================================= */}
        <section id="mezanino" className="section bg-[#111114] border-b border-white/[0.06]">
          <div className="container-narrow">
            <Reveal>
              <div className="text-center mb-12">
                <span className="kicker">Engenharia Avançada no Mezanino</span>
                <h2 className="display mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                  Microeletrônica, Reballing BGA e <span className="gradient-text">Laminação Óptica OCA</span>.
                </h2>
                <p className="mt-3 text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto">
                  Nosso segundo andar abriga câmara a vácuo, autoclave industrial e estação infravermelha para reestruturação de placas de vídeo e recuperação de displays originais.
                </p>
              </div>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Card GPU & BGA */}
              <Reveal>
                <div className="bg-[#18181b] border border-white/10 rounded-lg p-6 sm:p-8 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Cpu className="w-8 h-8 text-white" />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                        CIRCUITOS COMPLEXOS
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Recuperação de Placas de Vídeo & BGA
                    </h3>
                    <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                      Análise de curtos em linhas de alimentação secundárias (VRM, VDD, VDDQ), substituição cirúrgica de memórias VRAM GDDR6/GDDR6X, reballing com esferas especiais e regravação de BIOS SPI.
                    </p>
                    <ul className="space-y-2 text-xs font-mono text-zinc-300 mb-6">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        <span>Diagnóstico com câmera térmica e osciloscópio</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        <span>Restauração de trilhas rompidas sob microscópio 4K</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        <span>Estresse em bancada FurMark 15 min com telemetria</span>
                      </li>
                    </ul>
                  </div>

                  <TrackedWhatsAppLink
                    phone={brand.whatsapp}
                    message={whatsappMezaninoMessage}
                    source="mezanino_gpu"
                    className="btn-ghost w-full justify-center text-xs font-mono font-bold"
                  >
                    Consultar Laudo de Placa
                  </TrackedWhatsAppLink>
                </div>
              </Reveal>

              {/* Card Telas OCA Industrial */}
              <Reveal delay={0.15}>
                <div className="bg-[#18181b] border border-white/10 rounded-lg p-6 sm:p-8 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Layers className="w-8 h-8 text-white" />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                        LAMINAÇÃO A VÁCUO
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Unidade de Remanufatura de Displays OCA
                    </h3>
                    <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                      Troca do vidro trincado preservando o display OLED/AMOLED original de fábrica. Processo limpo com película óptica OCA, laminação pneumática em câmara pressurizada e cura em autoclave.
                    </p>
                    <ul className="space-y-2 text-xs font-mono text-zinc-300 mb-6">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        <span>Mantém touch, brilho e cores originais de fábrica</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        <span>Economia de até 60% comparado à troca do módulo completo</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        <span>Tabela especial de lote para lojistas e assistências</span>
                      </li>
                    </ul>
                  </div>

                  <a
                    href="https://telas.cyberinformatica.tech"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full justify-center text-xs font-mono font-bold inline-flex items-center gap-1.5"
                  >
                    <span>Acessar Portal Telas OCA</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SEÇÃO 4 — PARCERIAS TÉCNICAS B2B PARA LOJISTAS (ID: PARCEIROS)            */}
        {/* ========================================================================= */}
        <section id="parceiros" className="section bg-[#09090b] border-b border-white/[0.06]">
          <div className="container-narrow">
            <Reveal>
              <div className="bg-[#111114] border border-white/10 rounded-lg p-8 sm:p-12 relative overflow-hidden">
                <div className="flex flex-col lg:flex-row gap-10 items-start">
                  <div className="flex-1">
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 block mb-2">
                      [ Canal de Terceirização B2B ]
                    </span>
                    <h2 className="display text-3xl sm:text-4xl font-bold text-white mb-4">
                      Terceirize reparos pesados com nosso laboratório e <span className="gradient-text">aumente o faturamento</span> da sua loja.
                    </h2>
                    <p className="text-sm sm:text-base text-zinc-300 leading-relaxed mb-6">
                      Sua assistência não tem câmara a vácuo OCA ou microscópio de precisão para BGA? Não perca clientes para grandes centros. Terceirize a bancada com a Cyber Informática com total confidencialidade, garantia documentada e preços com margem saudável de revenda.
                    </p>

                    <TrackedWhatsAppLink
                      phone={brand.whatsapp}
                      message={whatsappB2BMessage}
                      source="b2b_section"
                      className="btn-primary text-sm px-6 py-3.5 inline-flex items-center gap-2 font-bold"
                      ariaLabel="Cadastrar como lojista parceiro"
                    >
                      <Building2 size={18} />
                      Cadastrar como Lojista Parceiro
                    </TrackedWhatsAppLink>

                    <p className="text-xs font-mono text-zinc-400 mt-4">
                      Atendimento regional: Bragança Paulista · Atibaia · Socorro · Amparo · Extrema · Piracaia
                    </p>
                  </div>

                  <div className="flex-1 grid gap-4 sm:grid-cols-2 w-full font-mono text-xs">
                    {[
                      {
                        title: "Sigilo Comercial Rigoroso",
                        copy: "Seu cliente final é seu. Entregamos os laudos com identificação técnica neutra para sua loja faturar diretamente.",
                      },
                      {
                        title: "Tabela Exclusiva para Lojista",
                        copy: "Preços de atacado para serviços de bancada, laminação de telas e fornecimento de peças sob demanda.",
                      },
                      {
                        title: "Suporte Técnico Direto",
                        copy: "Canal direto no WhatsApp com Felipe, Iago e Jefferson para tirar dúvidas técnicas sobre viabilidade em tempo real.",
                      },
                      {
                        title: "Garantia CDC Estendida",
                        copy: "Garantia de 90 dias coberta pela nossa bancada. Se houver retorno, a prioridade de bancada é imediata.",
                      },
                    ].map((item) => (
                      <div key={item.title} className="bg-black/40 border border-white/5 p-4 rounded">
                        <h3 className="font-bold text-white text-sm mb-1">{item.title}</h3>
                        <p className="text-zinc-400 leading-relaxed">{item.copy}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SEÇÃO 5 — LOCALIZAÇÃO & ENDEREÇO FÍSICO                                   */}
        {/* ========================================================================= */}
        <section className="section bg-[#111114]">
          <div className="container-narrow text-center">
            <Reveal>
              <span className="kicker">Atendimento Presencial</span>
              <h2 className="display mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
                Infraestrutura no Centro de <span className="gradient-text">Bragança Paulista</span>.
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto mb-8 leading-relaxed">
                Venha conhecer nossa loja física e nosso laboratório. Bancada aberta, estoque com cabos e componentes a pronta-entrega e atendimento por quem realmente entende de hardware.
              </p>

              <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-[#18181b] border border-white/10 p-4 sm:p-6 rounded-lg font-mono text-xs sm:text-sm text-zinc-300 mb-8">
                <div>
                  <strong className="text-white">Endereço:</strong> {brand.address.street}, {brand.address.number} — Centro, Bragança Paulista/SP
                </div>
                <div className="hidden sm:block text-zinc-600">•</div>
                <div>
                  <strong className="text-white">Horário:</strong> {brand.openingHours}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <TrackedWhatsAppLink
                  phone={brand.whatsapp}
                  message="Olá! Gostaria de saber como chegar até a loja física da Cyber Informática."
                  source="localizacao_cta"
                  className="btn-primary w-full sm:w-auto px-7 py-3.5 text-sm font-bold inline-flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} />
                  Chamar no WhatsApp
                </TrackedWhatsAppLink>

                <Link
                  href="/status"
                  className="btn-ghost w-full sm:w-auto px-7 py-3.5 text-sm font-semibold inline-flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={18} />
                  Rastrear Equipamento
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        <Footer />
        <WhatsAppButton />
      </main>
    </>
  );
}