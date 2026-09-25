import { Monitor, Smartphone, Laptop, Sparkles, Wrench, MessageCircle, ArrowRight, Building2 } from "lucide-react";
import Link from "next/link";

import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import TrackedWhatsAppLink from "@/components/TrackedWhatsAppLink";
import { Reveal, RevealGroup } from "@/components/Reveal";
import { brand } from "@/lib/brand";

export default async function Home({ searchParams }: { searchParams: Promise<{ service?: string; persona?: string; utm_source?: string; utm_campaign?: string }> }) {
  const params = await searchParams;
  const serviceParam = params?.service ?? null;
  // persona=lojista (via URL) OU utm_campaign contendo 'b2b' OU utm_source=google + utm_campaign=lojistas
  const isB2BFromUtm = params?.utm_campaign?.toLowerCase().includes('b2b') || params?.utm_campaign?.toLowerCase().includes('lojista') || params?.utm_campaign?.toLowerCase().includes('parceiro');
  const personaParam = (params?.persona === 'lojista' || isB2BFromUtm) ? 'lojista' : null;

  const whatsappCuradoriaMessage = "Olá! Vim pelo site da Cyber e gostaria de falar com a curadoria técnica.";
  const whatsappB2BMessage = "Olá! Sou lojista/assistência técnica. Vim pelo site da Cyber e gostaria de falar sobre parceria (indicação técnica, suporte ao parceiro e pós-venda estendido).";

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
        {/* Hero agora renderiza direto (sem Suspense) pra evitar tela preta vazia */}
        <Hero serviceParam={serviceParam} personaParam={personaParam} />

        {/* Seção 2 — Categorias de produto com cards visuais */}
        <section id="catalogo" className="section bg-[var(--bg-secondary)]">
          <div className="container-narrow">
            <Reveal>
              <div className="text-center mb-12">
                <span className="kicker">Catálogo</span>
                <h2 className="display mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-text-on-dark)]">
                  PC, notebook e celular — com a <span className="gradient-text">mesma curadoria técnica</span>.
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
                  href: whatsappCuradoriaMessage,
                  source: "page_card_pc",
                  accent: "rgba(0,102,255,.4)",
                  emoji: "🖥️",
                },
                {
                  icon: Laptop,
                  title: "Notebook",
                  copy: "Notebook pra estudo, trabalho ou jogo. Orientamos na escolha e entregamos pronto pra usar.",
                  cta: "Ver notebooks",
                  href: whatsappCuradoriaMessage,
                  source: "page_card_notebook",
                  accent: "rgba(0,255,136,.3)",
                  emoji: "💻",
                },
                {
                  icon: Smartphone,
                  title: "Celular",
                  copy: "Celular novo, com indicação técnica de acessórios e pós-venda estendido.",
                  cta: "Ver celulares",
                  href: whatsappCuradoriaMessage,
                  source: "page_card_celular",
                  accent: "rgba(0,102,255,.5)",
                  emoji: "📱",
                },
              ].map((card) => (
                <Reveal as="article" key={card.title}>
                  <article className="relative card overflow-hidden p-0 group">
                    {/* Imagem placeholder com gradient — substituir por foto real depois */}
                    <div
                      className="aspect-[16/10] flex items-center justify-center text-6xl relative overflow-hidden"
                      style={{
                        background: `radial-gradient(circle at 30% 30%, ${card.accent}, transparent 60%), linear-gradient(135deg, var(--bg-elevated), #0a1929)`,
                      }}
                    >
                      <div className="absolute inset-0 opacity-20" style={{
                        backgroundImage: "linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)",
                        backgroundSize: "20px 20px",
                      }} />
                      <span className="relative z-10 transition-transform group-hover:scale-110 duration-500">{card.emoji}</span>
                    </div>
                    <div className="p-6">
                      <card.icon size={28} className="text-[var(--color-cyber-blue)] mb-4" />
                      <h3 className="display text-xl font-bold mb-2 text-[var(--color-text-on-dark)]">
                        {card.title}
                      </h3>
                      <p className="text-sm text-[var(--color-text-on-dark-muted)] mb-6 leading-relaxed">
                        {card.copy}
                      </p>
                      <TrackedWhatsAppLink
                        phone={brand.whatsapp}
                        message={card.href}
                        source={card.source}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-circuit-green)] hover:gap-2 transition-all group/link"
                        ariaLabel={card.cta}
                      >
                        {card.cta}
                        <ArrowRight size={14} className="transition-transform group-hover/link:translate-x-1" />
                      </TrackedWhatsAppLink>
                    </div>
                  </article>
                </Reveal>
              ))}
            </RevealGroup>

            {/* Sub-CTA B2B */}
            <Reveal delay={0.2}>
              <div className="mt-10 text-center">
                <p className="text-sm text-[var(--color-text-on-dark-muted)] mb-3">
                  É lojista ou assistência? A gente atende parceiro com indicação técnica e suporte direto.
                </p>
                <Link
                  href="#parceiros"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-circuit-green)] hover:opacity-80 transition-opacity"
                >
                  <Building2 size={14} />
                  Ver como funciona a parceria
                  <ArrowRight size={14} />
                </Link>
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
                  Curadoria técnica: a gente te ajuda a escolher — <span className="gradient-text">sem empurrar</span>.
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
                <div className="card relative overflow-hidden" style={{ padding: "2rem" }}>
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-circuit-green)] to-transparent" />
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-cyber-blue)] to-[var(--color-circuit-green)] flex items-center justify-center flex-shrink-0">
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
                Monte seu PC com a gente — ou peça um <span className="gradient-text">projeto sob medida</span>.
              </h2>
              <p className="text-base sm:text-lg text-[var(--color-text-on-dark-muted)] max-w-2xl mx-auto mb-10 leading-relaxed">
                Use nosso builder online pra simular a configuração. Quer assessoria técnica? A gente monta pra você, com peças curadas e teste de stress antes da entrega.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <TrackedWhatsAppLink
                  phone={brand.whatsapp}
                  message="Olá! Quero montar um PC sob medida com a curadoria técnica da Cyber."
                  source="page_pc_builder_primary"
                  className="btn-primary w-full sm:w-auto text-base px-7 py-4"
                  ariaLabel="Simular montagem de PC com especialista"
                >
                  <Wrench size={18} />
                  Montar PC com especialista
                </TrackedWhatsAppLink>
                <TrackedWhatsAppLink
                  phone={brand.whatsapp}
                  message={whatsappCuradoriaMessage}
                  source="page_pc_builder"
                  className="btn-ghost w-full sm:w-auto text-base px-7 py-4"
                  ariaLabel="Pedir projeto sob medida"
                >
                  <MessageCircle size={18} />
                  Pedir projeto sob medida
                </TrackedWhatsAppLink>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Seção 5 — Para lojistas e assistências parceiras (B2B) */}
        <section id="parceiros" className="section">
          <div className="container-narrow">
            <Reveal>
              <div className="card card-b2b relative overflow-hidden" style={{ padding: "2rem" }}>
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[var(--color-circuit-green)] to-transparent" />
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  <div className="flex-1">
                    <span className="badge badge-b2b mb-4">Atende lojistas</span>
                    <h2 className="display mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-text-on-dark)] mb-4">
                      Pra lojista e assistência que quer <span className="gradient-text">indicação técnica</span> no WhatsApp.
                    </h2>
                    <p className="text-base sm:text-lg text-[var(--color-text-on-dark-muted)] leading-relaxed mb-6">
                      Cliente te perguntou qual peça comprar e você não tem certeza? Manda mensagem. A gente orienta a peça certa pro caso — e você vende sem dor de cabeça. Suporte direto, sem espera, sem atravessador.
                    </p>
                    <TrackedWhatsAppLink
                      phone={brand.whatsapp}
                      message={whatsappB2BMessage}
                      source="page_parceiros"
                      className="btn-b2b text-base px-7 py-4"
                      ariaLabel="Falar com o time de parcerias"
                    >
                      <Building2 size={18} />
                      Falar com o time de parcerias
                    </TrackedWhatsAppLink>
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
                      <div key={benefit.title} className="card relative overflow-hidden" style={{ padding: "1.25rem" }}>
                        <div className="absolute top-0 left-0 w-[2px] h-full bg-[var(--color-circuit-green)]" />
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

        {/* Seção 6 — Contato */}
        <section className="section bg-[var(--bg-secondary)]">
          <div className="container-narrow text-center">
            <Reveal>
              <span className="kicker">Venha nos visitar</span>
              <h2 className="display mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-text-on-dark)] mb-6">
                Loja física em <span className="gradient-text">Bragança Paulista</span>.
              </h2>
              <p className="text-base sm:text-lg text-[var(--color-text-on-dark-muted)] max-w-2xl mx-auto mb-10 leading-relaxed">
                Estamos na loja, prontos pra te atender com café e peça na mão. Sem agendamento, sem fila de call center. Quer orçamento ou dúvida técnica? Manda mensagem.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10">
                <Link href="/contato" className="btn-primary w-full sm:w-auto text-base px-7 py-4">
                  <Wrench size={18} />
                  Mandar mensagem
                </Link>
                <TrackedWhatsAppLink
                  phone={brand.whatsapp}
                  message={whatsappCuradoriaMessage}
                  source="page_contato_cta"
                  className="btn-ghost w-full sm:w-auto text-base px-7 py-4"
                  ariaLabel="Prefere WhatsApp"
                >
                  <MessageCircle size={18} />
                  Prefere WhatsApp
                </TrackedWhatsAppLink>
              </div>
              <div className="inline-flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 card text-sm relative overflow-hidden" style={{ padding: "1.25rem 1.5rem", textAlign: "left" }}>
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-cyber-blue)] to-transparent" />
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