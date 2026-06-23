"use client";
import { MessageCircle, Building2 } from "lucide-react";

import { brand } from "@/lib/brand";

/**
 * Hero - Cyber Informatica
 * 2 CTAs (B2C + B2B) desde jun/2026 - Google Ads B2B friendly.
 * Suporta ?persona=lojista na URL pra renderizar copy focada em B2B
 * (mensagem pre-pronta pro WhatsApp, headline mais agressiva).
 *
 * Google Ads B2B-safe: NAO usa 'manutencao', 'conserto', 'reparo',
 * 'diagnostico' - termos barrados pelo Google Ads.
 */
export default function Hero({ serviceParam, personaParam }: {
  serviceParam?: string | null;
  personaParam?: string | null;
} = {}) {
  const formattedService = serviceParam
    ? serviceParam.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : null;

  // B2B-safe: bloqueia servicos consumer-facing (manutencao, conserto, etc) que o
  // Google Ads barra. Mantem apenas termos comerciais permitidos.
  const blockedTerms = ['conserto', 'reparo', 'manutencao', 'manutenção', 'assistencia', 'assistência', 'diagnostico', 'diagnóstico', 'formatacao', 'formatação'];
  const serviceIsSafe = formattedService && !blockedTerms.some(k => formattedService.toLowerCase().includes(k));

  const isB2B = personaParam === 'lojista' || personaParam === 'parceiro';

  // 2 mensagens de WhatsApp pre-prontas (Ads mede qual converte melhor)
  const whatsappCuradoriaMessage = serviceIsSafe
    ? `Olá! Vim pelo site da Cyber e gostaria de falar com a curadoria técnica sobre ${formattedService}.`
    : "Olá! Vim pelo site da Cyber e gostaria de falar com a curadoria técnica.";
  const whatsappCuradoriaUrl = `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(whatsappCuradoriaMessage)}`;

  // WhatsApp B2B com mensagem especifica pra lojista (CTA com context)
  const whatsappB2BMessage = isB2B
    ? `Olá! Sou lojista/assistência em Bragança e região. Vim pelo Google Ads e gostaria de falar sobre parceria com a Cyber (indicação técnica, suporte ao parceiro e pós-venda estendido).`
    : `Olá! Sou lojista/assistência técnica. Gostaria de falar sobre parceria com a Cyber.`;
  const whatsappB2BUrl = `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(whatsappB2BMessage)}`;

  // Headline: 2 variantes (B2C padrao ou B2B focada)
  const headline = isB2B
    ? "Atendemos lojistas e assistências parceiras com indicação técnica especializada."
    : "Tecnologia, montagem e curadoria técnica em Bragança Paulista.";

  // Sub-headline: copy especifica por persona
  const subheadline = isB2B ? (
    <>
      Indicação técnica, suporte ao parceiro e pós-venda estendido pra quem revende ou atende PC, notebook e celular na região de Bragança Paulista.
    </>
  ) : serviceIsSafe ? (
    <>
      Soluções em <span className="font-semibold text-[var(--color-cyber-blue)]">{formattedService}</span>.{" "}
      Loja técnica de PC, notebook e celular — curadoria, montagem e atendimento humano.
    </>
  ) : (
    <>
      Loja técnica de PC, notebook e celular. Atendemos o cliente final com curadoria e montagem — e lojistas e assistências parceiras com indicação técnica e pós-venda estendido.
    </>
  );

  return (
    <section className="relative overflow-hidden bg-[var(--bg-primary)] pt-32 pb-20 md:pt-40 md:pb-28">
      {/* Gradiente sutil de fundo */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: isB2B
            ? "radial-gradient(circle at 50% 0%, rgba(0,255,136,0.15) 0%, transparent 60%)"
            : "radial-gradient(circle at 50% 0%, rgba(0,102,255,0.15) 0%, transparent 60%)",
        }}
      />

      <div className="container-narrow relative">
        {/* Badge / kicker - muda por persona */}
        <div className="mb-8 flex justify-center gap-2 flex-wrap">
          <span className="badge badge-outline">
            LOJA TÉCNICA · BRAGANÇA PAULISTA · ATENDIMENTO PRESENCIAL
          </span>
          {isB2B && (
            <span className="badge badge-b2b">
              <Building2 size={12} className="mr-1 inline" />
              ATENDE LOJISTAS
            </span>
          )}
        </div>

        {/* H1 */}
        <h1 className="display text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6 text-[var(--color-text-on-dark)]">
          {headline}
        </h1>

        {/* Sub */}
        <p className="text-center text-base sm:text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed text-[var(--color-text-on-dark-muted)]">
          {subheadline}
        </p>

        {/* CTAs - sempre 2 (B2C primario + B2B secundario) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
          <a
            href={whatsappCuradoriaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary w-full sm:w-auto"
          >
            <MessageCircle size={18} />
            {isB2B ? "Falar com a curadoria" : "Falar com a curadoria"}
          </a>
          <a
            href={whatsappB2BUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-b2b w-full sm:w-auto"
          >
            <Building2 size={18} />
            Sou lojista
          </a>
        </div>

        {/* Stats - 4 numeros reais confirmados por Felipe (23/06/2026) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-10 border-t border-[var(--color-border-on-dark)]">
          {[
            { value: '10+', label: 'Anos de loja' },
            { value: '200+', label: 'Peças em estoque' },
            { value: '50+', label: 'Workstations entregues' },
            { value: 'Mesmo dia', label: 'Resposta no WhatsApp' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-text-on-dark)]">
                {stat.value}
              </div>
              <div className="mt-2 text-xs uppercase tracking-[0.12em] text-[var(--color-text-on-dark-muted)] font-semibold">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
