import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck,
  Zap,
  MonitorCheck,
  Wifi,
  HardDrive,
  Wrench,
  Building2,
  Stethoscope,
  Scale,
  Store,
  Cpu,
  Laptop,
  CheckCircle2,
  MessageCircle,
  ArrowRight,
  Clock,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import { brand } from '@/lib/brand';

function getWhatsAppUrl(phone: string, text: string): string {
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}

export const metadata: Metadata = {
  title: `Suporte em TI para Empresas, Clínicas e Home Office | ${brand.name}`,
  description:
    'Suporte Técnico em TI Remoto e Presencial em Bragança Paulista e região. Atendimento rápido para clínicas, escritórios, comércios, empresas e Home Office: computadores, notebooks, redes Wi-Fi, backup e manutenção preventiva.',
  alternates: {
    canonical: `${brand.url}/suporte-ti`,
  },
  openGraph: {
    title: `Suporte em TI para Empresas e Home Office — ${brand.name}`,
    description:
      'Sua operação não pode parar. Suporte remoto imediato, visita técnica presencial, manutenção preventiva, redes e laboratório próprio em Bragança Paulista.',
    url: `${brand.url}/suporte-ti`,
    type: 'website',
  },
};

const SECTORS = [
  {
    icon: Stethoscope,
    title: 'Clínicas, Consultórios & Laboratórios',
    description:
      'Recepção, prontuário eletrônico, sistemas de agenda, impressoras de receitas/laudos e Wi-Fi estável para equipe e pacientes sem travamentos.',
  },
  {
    icon: Scale,
    title: 'Escritórios, Advocacia, Contabilidade & Imobiliárias',
    description:
      'Computadores rápidos para multitarefa, configuração de certificados digitais, compartilhamento seguro de documentos em rede e rotinas de backup.',
  },
  {
    icon: Store,
    title: 'Comércios, Lojas, Farmácias & Gastronomia',
    description:
      'Estabilidade para computadores de caixa/PDV, sistemas de pedidos e delivery, impressoras térmicas e infraestrutura de rede para não travar suas vendas.',
  },
  {
    icon: Cpu,
    title: 'Agências, Gráficas, Engenharia & Arquitetura',
    description:
      'Workstations de alta performance, upgrades de SSD NVMe, memória RAM e placas de vídeo, limpeza térmica profissional e rede local de alta velocidade.',
  },
  {
    icon: Building2,
    title: 'Escolas, Academias, Condomínios & Hotelaria',
    description:
      'Manutenção preventiva de computadores de secretaria/recepção, cobertura Wi-Fi de alta capacidade e suporte ágil para a operação diária.',
  },
  {
    icon: Laptop,
    title: 'Home Office & Profissionais Autônomos',
    description:
      'Suporte remoto imediato para resolver problemas sem sair de casa e prioridade na bancada quando seu notebook ou PC precisar de revisão física.',
  },
];

const PILLARS = [
  {
    icon: Zap,
    title: 'Suporte Remoto Imediato',
    description:
      'Acesso remoto seguro em minutos para destravar sistemas, configurar impressoras, corrigir lentidão do Windows, e-mails e softwares do dia a dia.',
  },
  {
    icon: Wrench,
    title: 'Atendimento Presencial & Laboratório Próprio',
    description:
      'Visita técnica em Bragança Paulista e região quando o chamado exige intervenção física, além de laboratório próprio completo no Centro com peças a pronta entrega.',
  },
  {
    icon: MonitorCheck,
    title: 'Manutenção Preventiva Programada',
    description:
      'Limpeza interna, troca de pasta térmica de alta condutividade, verificação de saúde de SSDs/fontes e otimização de sistema antes que o computador pare.',
  },
  {
    icon: Wifi,
    title: 'Redes Corporativas & Wi-Fi Estável',
    description:
      'Estruturação e organização de roteadores, switches, Access Points, cabeamento de rede e compartilhamento de pastas e impressoras entre setores.',
  },
  {
    icon: HardDrive,
    title: 'Upgrades Estratégicos (SSD & RAM)',
    description:
      'Multiplicamos a velocidade dos computadores atuais da sua empresa com upgrades certeiros de SSD NVMe e memória RAM, evitando a troca precoce de máquinas.',
  },
  {
    icon: ShieldCheck,
    title: 'Backup & Segurança Operacional',
    description:
      'Configuração de rotinas de backup local/nuvem, remoção de ameaças, padronização de estações de trabalho e recuperação de arquivos críticos.',
  },
];

const PLANS = [
  {
    badge: 'Sob Demanda',
    title: 'Chamado Avulso (Emergencial)',
    subtitle: 'Para resolver um problema pontual hoje, sem mensalidade.',
    features: [
      'Acesso remoto rápido ou visita técnica presencial',
      'Diagnóstico e solução de travamentos, rede ou impressora',
      'Reparo e upgrade em laboratório com prioridade',
      'Emissão de Nota/Recibo detalhado por atendimento',
    ],
    ctaLabel: 'Acionar Chamado Avulso',
    whatsappText:
      'Olá! Vim pela página de Suporte em TI da Cyber Informática e preciso de um atendimento avulso.',
    highlighted: false,
  },
  {
    badge: 'Mais Procurado por Empresas',
    title: 'Plano Mensal PME (Suporte Contínuo)',
    subtitle:
      'Ideal para clínicas, escritórios e comércios de 2 a 15 computadores.',
    features: [
      'Suporte remoto prioritário para toda a equipe',
      'Visitas técnicas presenciais inclusas conforme necessidade',
      'Manutenção preventiva periódica das máquinas',
      'Prioridade máxima na bancada e descontos em peças/upgrades',
      'Atendimento direto pelo WhatsApp com técnico dedicado',
    ],
    ctaLabel: 'Cotar Plano Mensal para Minha Empresa',
    whatsappText:
      'Olá! Vim pela página de Suporte em TI e gostaria de entender como funciona o Plano Mensal para minha empresa.',
    highlighted: true,
  },
  {
    badge: 'Projeto Fechado',
    title: 'Revitalização de Parque de Máquinas',
    subtitle:
      'Para deixar todos os computadores e a rede da empresa rápidos de uma só vez.',
    features: [
      'Levantamento completo de todos os PCs e notebooks do local',
      'Pacote de upgrade (SSD NVMe + Memória RAM + Limpeza Térmica)',
      'Padronização de sistema, rede Wi-Fi e impressoras',
      'Condição comercial diferenciada para múltiplas máquinas',
    ],
    ctaLabel: 'Agendar Diagnóstico do Parque',
    whatsappText:
      'Olá! Vim pela página de Suporte em TI e quero fazer um levantamento para revisar/atualizar os computadores da minha empresa.',
    highlighted: false,
  },
];

export default function SuporteTIPage() {
  const heroWaUrl = getWhatsAppUrl(
    brand.whatsapp,
    'Olá! Vim pela página de Suporte em TI da Cyber Informática e gostaria de conversar sobre suporte para meus computadores.',
  );

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--color-cyber-navy)] text-[var(--color-text-on-dark)] pt-28 pb-20">
        {/* Hero */}
        <section className="container-narrow py-10 md:py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-cyber-blue)]/15 border border-[var(--color-cyber-blue)]/30 text-[var(--color-circuit-green)] text-xs font-semibold uppercase tracking-widest mb-6">
              <Clock className="w-3.5 h-3.5" />
              Suporte em TI · Empresas, Clínicas, Comércios & Home Office
            </div>

            <h1
              className="text-3xl sm:text-5xl font-bold leading-tight mb-6"
              style={{ fontFamily: 'var(--font-space)' }}
            >
              Sua operação não pode parar por causa de{' '}
              <span className="text-[var(--color-circuit-green)]">
                computador lento, rede caindo ou impressora travada.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[var(--color-text-on-dark-muted)] leading-relaxed mb-8">
              A <strong className="text-white">{brand.name}</strong> oferece{' '}
              <strong className="text-white">
                Suporte Técnico em TI Remoto e Presencial
              </strong>{' '}
              em Bragança Paulista e região. Cuidamos dos computadores,
              notebooks, rede Wi-Fi e backups da sua empresa ou Home Office com
              atendimento humano, resposta rápida e laboratório próprio completo.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href={heroWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-2.5 px-6 py-3.5 text-base font-semibold"
              >
                <MessageCircle className="w-5 h-5" />
                Falar com Especialista em TI Agora
              </a>
              <a
                href="#modalidades"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-sm font-semibold text-white transition-colors"
              >
                Ver Modalidades (Avulso e Mensal)
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-4 pt-8 border-t border-white/10 text-xs text-[var(--color-text-on-dark-muted)]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--color-circuit-green)] shrink-0" />
                <span>Acesso Remoto Imediato</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--color-circuit-green)] shrink-0" />
                <span>Visita Presencial em Bragança e Região</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--color-circuit-green)] shrink-0" />
                <span>Laboratório Próprio & Peças em Estoque</span>
              </div>
            </div>
          </div>
        </section>

        {/* Para quem é */}
        <section className="container-narrow py-12 border-t border-white/[0.08]">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-cyber-blue)] mb-2">
              Atendimento Especializado por Setor
            </p>
            <h2
              className="text-2xl sm:text-3xl font-bold"
              style={{ fontFamily: 'var(--font-space)' }}
            >
              Soluções pensadas para a rotina do seu negócio
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-on-dark-muted)]">
              Entendemos que cada segmento tem equipamentos e urgências
              diferentes. Atendemos desde consultórios e escritórios até lojas,
              oficinas e profissionais em Home Office.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {SECTORS.map((sector) => {
              const Icon = sector.icon;
              return (
                <div
                  key={sector.title}
                  className="rounded-xl bg-[var(--color-cyber-navy-mid)] border border-[var(--color-border-on-dark)] p-6 hover:border-[var(--color-cyber-blue)]/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-cyber-blue)]/15 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[var(--color-cyber-blue)]" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {sector.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-on-dark-muted)] leading-relaxed">
                    {sector.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* O que está incluso / Pilares */}
        <section className="container-narrow py-12 border-t border-white/[0.08]">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-circuit-green)] mb-2">
              Escopo Técnico Completo
            </p>
            <h2
              className="text-2xl sm:text-3xl font-bold"
              style={{ fontFamily: 'var(--font-space)' }}
            >
              O que fazemos pela TI da sua empresa
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-6"
                >
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-circuit-green)]/15 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[var(--color-circuit-green)]" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-on-dark-muted)] leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Modalidades de contratação */}
        <section
          id="modalidades"
          className="container-narrow py-12 border-t border-white/[0.08] scroll-mt-24"
        >
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-cyber-blue)] mb-2">
              Flexibilidade Total
            </p>
            <h2
              className="text-2xl sm:text-3xl font-bold"
              style={{ fontFamily: 'var(--font-space)' }}
            >
              Como você prefere ser atendido?
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-on-dark-muted)]">
              Trabalhamos tanto com chamados pontuais quanto com planos mensais
              preventivos para empresas que buscam tranquilidade contínua.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const planUrl = getWhatsAppUrl(brand.whatsapp, plan.whatsappText);
              return (
                <div
                  key={plan.title}
                  className={`rounded-2xl p-6 sm:p-7 flex flex-col justify-between border ${
                    plan.highlighted
                      ? 'bg-[var(--color-cyber-navy-mid)] border-[var(--color-circuit-green)] shadow-[0_0_32px_rgba(0,255,136,0.12)]'
                      : 'bg-[var(--color-cyber-navy-mid)]/70 border-[var(--color-border-on-dark)]'
                  }`}
                >
                  <div>
                    <span
                      className={`inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-4 ${
                        plan.highlighted
                          ? 'bg-[var(--color-circuit-green)] text-black'
                          : 'bg-white/10 text-white/80'
                      }`}
                    >
                      {plan.badge}
                    </span>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {plan.title}
                    </h3>
                    <p className="text-sm text-[var(--color-text-on-dark-muted)] mb-6">
                      {plan.subtitle}
                    </p>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-2.5 text-sm text-white/90"
                        >
                          <CheckCircle2 className="w-4 h-4 text-[var(--color-circuit-green)] shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <a
                    href={planUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-3 px-4 rounded-lg text-sm font-semibold text-center inline-flex items-center justify-center gap-2 transition-colors ${
                      plan.highlighted
                        ? 'btn-primary'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    {plan.ctaLabel}
                  </a>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Final */}
        <section className="container-narrow pt-8">
          <div className="rounded-2xl bg-gradient-to-r from-[var(--color-cyber-navy-mid)] to-[#0d274c] border border-[var(--color-cyber-blue)]/40 p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2
                className="text-2xl font-bold text-white mb-2"
                style={{ fontFamily: 'var(--font-space)' }}
              >
                Quer conversar direto com nossa equipe técnica?
              </h2>
              <p className="text-sm text-[var(--color-text-on-dark-muted)] max-w-xl">
                Conte quantos computadores ou notebooks vocês utilizam hoje e
                montamos a melhor proposta para sua clínica, escritório,
                comércio ou Home Office em Bragança Paulista.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <a
                href={heroWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold"
              >
                <MessageCircle className="w-4 h-4" />
                Chamar no WhatsApp
              </a>
              <Link
                href="/contato"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-sm font-medium text-white"
              >
                Ver Endereço da Loja
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
