import { Monitor, Smartphone, Laptop, Sparkles, Wrench, MessageCircle, ArrowRight, Building2 } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Reveal, RevealGroup } from "@/components/Reveal";
import { brand } from "@/lib/brand";

export default async function Home({ searchParams }: { searchParams: Promise<{ service?: string; persona?: string; utm_source?: string; utm_campaign?: string }> }) {
  const params = await searchParams;
  const serviceParam = params?.service ?? null;
  // persona=lojista (via URL) OU utm_campaign contendo 'b2b' OU utm_source=google + utm_campaign=lojistas
  const isB2BFromUtm = params?.utm_campaign?.toLowerCase().includes('b2b') || params?.utm_campaign?.toLowerCase().includes('lojista') || params?.utm_campaign?.toLowerCase().includes('parceiro');
  const personaParam = (params?.persona === 'lojista' || isB2BFromUtm) ? 'lojista' : null;

  const whatsappCuradoria = `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent("Olá! Vim pelo site da Cyber e gostaria de falar com a curadoria técnica.")}`;
  const whatsappB2B = `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent("Olá! Sou lojista/assistência técnica. Vim pelo site da Cyber e gostaria de falar sobre parceria (indicação técnica, suporte ao parceiro e pós-venda estendido).")}`;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
        <Suspense fallback={<div className="h-screen bg-[var(--bg-primary)]" />}>
          <Hero serviceParam={serviceParam} personaParam={personaParam} />
        </Suspense>

        {/* Seção 2 — Categorias de produto */}
        <section id="catalogo" className="section bg-[var(--bg-secondary)]">
          <div className="container-narrow">
            <Reveal>
              <div className="text-center mb-12">
                <span className="kicker">Catálogo</span>
                <h2 className="display mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-text-on-dark)]">
                  PC, notebook e celular — com a mesma curadoria técnica.
                </h2>
              </div>
            </Reveal>
            <RevealGroup as="div" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.12}>
              {[
                {
                  icon: Monitor,
                  title: "PC sob medida",
                  copy: "Montamos seu PC com curadoria técnica — peças escolhidas pra durar, sem fanatismo por marca.",
                  cta: "Montar meu PC",
                },
                {
                  icon: Laptop,
                  title: "Notebook",
                  copy: "Notebook pra estudo, trabalho ou jogo. Orientamos na escolha e entregamos pronto pra usar.",
                  cta: "Ver notebooks",
                },
                {
                  icon: Smartphone,
                  title: "Celular",
                  copy: "Celular novo, com indicação técnica de acessórios e pós-venda estendido.",
                  cta: "Ver celulares",
                },
              ].map((card) => (
                <Reveal as="article" key={card.title}>
                  <article className="card">
                    <card.icon size={28} className="text-[var(--color-cyber-blue)] mb-4" />
                    <h3 className="display text-xl font-bold mb-2 text-[var(--color-text-on-dark)]">
                      {card.title}
                    </h3>
                    <p className="text-sm text-[var(--color-text-on-dark-muted)] mb-6 leading-relaxed">
                      {card.copy}
                    </p>
                    <button className="text-sm font-semibold text-[var(--color-cyber-blue)] hover:text-[var(--color-cyber-blue-hover)] transition-colors inline-flex items-center gap-1">
                      {card.cta}
                      <ArrowRight size={14} />
                    </button>
                  </article>
                </Reveal>
              ))}
            </RevealGroup>

            {/* Sub-CTA B2B - lojista que chegou aqui pulou pro produto */}
            <Reveal delay={0.2}>
              <div className="mt-10 text-center">
                <p className="text-sm text-[var(--color-text-on-dark-muted)] mb-3">
                  É lojista ou assistência? A gente atende parceiro com indicação técnica e suporte direto.
                </p>
                <a
                  href="#parceiros"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-circuit-green)] hover:opacity-80 transition-opacity"
                >
                  <Building2 size={14} />
                  Ver como funciona a parceria
                  <ArrowRight size={14} />
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Seção 3 — Curadoria técnica */}
        <section id="curadoria" className="section">
          <div className="container-narrow">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <Reveal>
                <span className="kicker">Diferencial</span>
                <h2 className="display mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-text-on-dark)] mb-6">
                  Curadoria técnica: a gente te ajuda a escolher — sem empurrar.
                </h2>
                <p className="text-base sm:text-lg text-[var(--color-text-on-dark-muted)] leading-relaxed mb-6">
                  Antes de vender, a gente pergunta. Pra quê vai usar, qual orçamento, o que não pode faltar. Aí indicamos a peça certa — não a peça mais cara. Se a gente acha que o que você quer não faz sentido, a gente fala.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-circuit-green)]/10 text-[var(--color-circuit-green)] text-xs font-semibold uppercase tracking-wider">
                  <Sparkles size={14} />
                  Atendimento humano, sem chatbot.
                </div>
              </Reveal>
              <Reveal delay={0.15}>
                <div className="card" style={{ padding: "2rem" }}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-cyber-blue)] flex items-center justify-center flex-shrink-0">
                      <MessageCircle size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text-on-dark)] mb-1">
                        Felipe, Iago ou Jefferson vão te atender
                      </p>
                      <p className="text-sm text-[var(--color-text-on-dark-muted)] leading-relaxed">
                        Time técnico real, na loja. Fala direto com quem entende — sem intermediário, sem script.
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Seção 4 — Monte seu PC */}
        <section id="monte-seu-pc" className="section bg-[var(--bg-secondary)]">
          <div className="container-narrow text-center">
            <Reveal>
              <span className="kicker">PC Builder</span>
              <h2 className="display mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-text-on-dark)] mb-6 max-w-3xl mx-auto">
                Monte seu PC com a gente — ou peça um projeto sob medida.
              </h2>
              <p className="text-base sm:text-lg text-[var(--color-text-on-dark-muted)] max-w-2xl mx-auto mb-10 leading-relaxed">
                Use nosso builder online pra simular a configuração. Quer assessoria técnica? A gente monta pra você, com peças curadas e teste de stress antes da entrega.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <button className="btn-primary w-full sm:w-auto">
                  <Wrench size={18} />
                  Abrir o builder
                </button>
                <a
                  href={whatsappCuradoria}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost w-full sm:w-auto"
                >
                  <MessageCircle size={18} />
                  Pedir projeto sob medida
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Seção 5 — Para lojistas e assistências parceiras (B2B) */}
        <section id="parceiros" className="section">
          <div className="container-narrow">
            <Reveal>
              <div className="card card-b2b" style={{ padding: "2rem" }}>
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  <div className="flex-1">
                    <span className="badge badge-b2b mb-4">Atende lojistas</span>
                    <h2 className="display mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-text-on-dark)] mb-4">
                      Pra lojista e assistência que quer indicação técnica no WhatsApp.
                    </h2>
                    <p className="text-base sm:text-lg text-[var(--color-text-on-dark-muted)] leading-relaxed mb-6">
                      Cliente te perguntou qual peça comprar e você não tem certeza? Manda mensagem. A gente orienta a peça certa pro caso — e você vende sem dor de cabeça. Suporte direto, sem espera, sem atravessador.
                    </p>
                    <a
                      href={whatsappB2B}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-b2b"
                    >
                      <Building2 size={18} />
                      Falar com o time de parcerias
                    </a>
                    <p className="text-xs text-[var(--color-text-on-dark-muted)] mt-3">
                      Bragança Paulista · Atibaia · Socorro · Amparo · região
                    </p>
                  </div>
                  <RevealGroup as="div" className="flex-1 grid gap-4 sm:grid-cols-2" stagger={0.1} delayChildren={0.2}>
                    {[
                      {
                        title: "Indicação técnica no WhatsApp",
                        copy: "Manda o caso do seu cliente. A gente indica a peça certa, com justificativa técnica — em minutos."
                      },
                      {
                        title: "Suporte ao parceiro",
                        copy: "Atendimento direto com Felipe, Iago ou Jefferson. Sem fila, sem chatbot, sem call center."
                      },
                      {
                        title: "Pós-venda estendido",
                        copy: "Garantia ampliada pra quem revende. Cliente volta pra você, não pra assistência da marca."
                      },
                      {
                        title: "Atendimento regional",
                        copy: "Bragança Paulista, Atibaia, Socorro, Amparo, Jundiaí, Extrema e região."
                      },
                    ].map((benefit) => (
                      <div key={benefit.title} className="card" style={{ padding: "1.25rem" }}>
                        <h3 className="text-sm font-bold mb-1 text-[var(--color-text-on-dark)]">
                          {benefit.title}
                        </h3>
                        <p className="text-xs text-[var(--color-text-on-dark-muted)] leading-relaxed">
                          {benefit.copy}
                        </p>
                      </div>
                    ))}
                  </RevealGroup>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Seção 6 — Contato (resumo + CTA pra /contato) */}
        <section className="section bg-[var(--bg-secondary)]">
          <div className="container-narrow text-center">
            <Reveal>
              <span className="kicker">Venha nos visitar</span>
              <h2 className="display mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-text-on-dark)] mb-6">
                Loja física em Bragança Paulista.
              </h2>
              <p className="text-base sm:text-lg text-[var(--color-text-on-dark-muted)] max-w-2xl mx-auto mb-10 leading-relaxed">
                Estamos na loja, prontos pra te atender com café e peça na mão. Sem agendamento, sem fila de call center. Quer orçamento ou dúvida técnica? Manda mensagem.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10">
                <Link href="/contato" className="btn-primary w-full sm:w-auto">
                  <Wrench size={18} />
                  Mandar mensagem
                </Link>
                <a
                  href={whatsappCuradoria}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost w-full sm:w-auto"
                >
                  <MessageCircle size={18} />
                  Prefere WhatsApp
                </a>
              </div>
              <div className="inline-flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 card text-sm" style={{ padding: "1.25rem 1.5rem", textAlign: "left" }}>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--color-text-on-dark)]">Endereço:</span>
                  <span className="text-[var(--color-text-on-dark-muted)]">
                    {brand.address.street}, {brand.address.number}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--color-text-on-dark)]">Horário:</span>
                  <span className="text-[var(--color-text-on-dark-muted)]">{brand.openingHours}</span>
                </div>
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