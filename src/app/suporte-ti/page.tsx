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
      <main className="min-h-screen bg-[#09090b] text-zinc-100 pt-28 pb-20 font-sans antialiased">
        {/* Hero */}
        <section className="container-narrow py-10 md:py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-700 bg-zinc-900 text-emerald-400 font-mono text-xs font-bold uppercase tracking-widest mb-6">
              <Clock className="w-3.5 h-3.5" />
              Suporte em TI · Empresas, Clínicas, Comércios & Home Office
            </div>

            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight mb-6">
              Sua operação não pode parar por{' '}
              <span className="text-zinc-400">
                computador lento, rede instável ou falhas de sistema.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-400 leading-relaxed mb-8">
              A <strong className="text-white">{brand.name}</strong> oferece{' '}
              <strong className="text-white">
                Suporte Técnico em TI Remoto e Presencial
              </strong>{' '}
              em Bragança Paulista e região. Cuidamos dos computadores,
              notebooks, rede Wi-Fi e backups da sua empresa ou Home Office com
              atendimento humano, resposta rápida e laboratório próprio completo.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
              <a
                href={heroWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white hover:bg-zinc-200 text-black font-mono font-bold uppercase tracking-wider py-3.5 px-6 text-xs flex items-center justify-center gap-2 transition-colors min-h-[48px]"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>Falar com Especialista em TI Agora</span>
              </a>
              <a
                href="#modalidades"
                className="border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white font-mono font-bold uppercase tracking-wider py-3.5 px-5 text-xs flex items-center justify-center gap-2 transition-colors min-h-[48px]"
              >
                <span>Ver Modalidades (Avulso e Mensal)</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </a>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-zinc-800 font-mono text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Acesso Remoto Imediato</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Visita Presencial em Bragança</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Laboratório Próprio & Peças</span>
              </div>
            </div>
          </div>
        </section>

        {/* Para quem é */}
        <section className="container-narrow py-12 border-t border-zinc-800">
          <div className="max-w-2xl mb-10">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">
              01 // ATENDIMENTO ESPECIALIZADO POR SETOR
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white">
              Soluções pensadas para a rotina do seu negócio
            </h2>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
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
                  className="border border-zinc-800 bg-zinc-900/60 p-6 hover:border-zinc-600 transition-colors"
                >
                  <div className="w-10 h-10 border border-zinc-700 bg-zinc-800 flex items-center justify-center mb-4 text-white">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">
                    {sector.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {sector.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* O que está incluso / Pilares */}
        <section className="container-narrow py-12 border-t border-zinc-800">
          <div className="max-w-2xl mb-10">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">
              02 // ESCOPO TÉCNICO COMPLETO
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white">
              O que fazemos pela TI da sua empresa
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="border border-zinc-800 bg-zinc-900/40 p-6"
                >
                  <div className="w-10 h-10 border border-zinc-700 bg-zinc-800 flex items-center justify-center mb-4 text-emerald-400">
                    <Icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
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
          className="container-narrow py-12 border-t border-zinc-800 scroll-mt-24"
        >
          <div className="max-w-2xl mb-10">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">
              03 // FLEXIBILIDADE TOTAL
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white">
              Como você prefere ser atendido?
            </h2>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
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
                  className={`p-6 sm:p-7 flex flex-col justify-between ${
                    plan.highlighted
                      ? 'border-2 border-white bg-zinc-900'
                      : 'border border-zinc-800 bg-zinc-900/50'
                  }`}
                >
                  <div>
                    <span
                      className={`inline-block font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border mb-4 ${
                        plan.highlighted
                          ? 'border-white bg-white text-black'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {plan.badge}
                    </span>
                    <h3 className="text-lg font-bold uppercase tracking-tight text-white mb-1.5">
                      {plan.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                      {plan.subtitle}
                    </p>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <a
                    href={planUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-3.5 px-4 font-mono text-xs font-bold uppercase tracking-wider text-center inline-flex items-center justify-center gap-2 transition-colors min-h-[48px] ${
                      plan.highlighted
                        ? 'bg-white hover:bg-zinc-200 text-black'
                        : 'border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{plan.ctaLabel}</span>
                  </a>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Final */}
        <section className="container-narrow pt-8">
          <div className="border-2 border-zinc-800 bg-zinc-900 p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-tight text-white mb-2">
                Quer conversar direto com nossa equipe técnica?
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
                Conte quantos computadores ou notebooks vocês utilizam hoje e
                montamos a melhor proposta para sua clínica, escritório,
                comércio ou Home Office em Bragança Paulista.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
              <a
                href={heroWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white hover:bg-zinc-200 text-black font-mono font-bold uppercase tracking-wider px-6 py-3.5 text-xs flex items-center justify-center gap-2 min-h-[48px]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chamar no WhatsApp</span>
              </a>
              <Link
                href="/contato"
                className="border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white font-mono font-bold uppercase tracking-wider px-5 py-3.5 text-xs flex items-center justify-center min-h-[48px]"
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
