"use client";
import Link from "next/link";
import { MessageCircle, ArrowRight } from "lucide-react";

import { brand } from "@/lib/brand";

/**
 * Hero — Cyber Informática
 * Copy do reboot/01-plano-estruturante.md (seção 5)
 * Design tokens: globals.css (.btn-primary, .btn-ghost, .badge)
 */
export default function Hero({ serviceParam }: { serviceParam?: string | null } = {}) {
  const formattedService = serviceParam
    ? serviceParam.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : null;

  // B2B-safe: bloqueia servicos consumer-facing (manutencao, conserto, etc) que o
  // Google Ads barra. Mantem apenas termos comerciais permitidos.
  const blockedTerms = ['conserto', 'reparo', 'manutencao', 'manutenção', 'assistencia', 'assistência', 'diagnostico', 'diagnóstico', 'formatacao', 'formatação'];
  const serviceIsSafe = formattedService && !blockedTerms.some(k => formattedService.toLowerCase().includes(k));

  const whatsappMessage = serviceIsSafe
    ? `Olá! Vim pelo site da Cyber e gostaria de falar com a curadoria técnica sobre ${formattedService}.`
    : "Olá! Vim pelo site da Cyber e gostaria de falar com a curadoria técnica.";
  const whatsappUrl = `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <section className="relative overflow-hidden bg-[var(--bg-primary)] pt-32 pb-20 md:pt-40 md:pb-28">
      {/* Gradiente sutil de fundo */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 0%, rgba(0,102,255,0.15) 0%, transparent 60%)",
        }}
      />

      <div className="container-narrow relative">
        {/* Badge / kicker */}
        <div className="mb-8 flex justify-center">
          <span className="badge badge-outline">
            LOJA TÉCNICA · BRAGANÇA PAULISTA · ATENDIMENTO PRESENCIAL
          </span>
        </div>

        {/* H1 */}
        <h1 className="display text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6 text-[var(--color-text-on-dark)]">
          Tecnologia, montagem e curadoria técnica em Bragança Paulista.
        </h1>

        {/* Sub */}
        <p className="text-center text-base sm:text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed text-[var(--color-text-on-dark-muted)]">
          {serviceIsSafe ? (
            <>
              Soluções em <span className="font-semibold text-[var(--color-cyber-blue)]">{formattedService}</span>.{" "}
              Loja técnica de PC, notebook e celular — curadoria, montagem e atendimento humano.
            </>
          ) : (
            <>
              Loja técnica de PC, notebook e celular. Atendemos o cliente final com curadoria e montagem — e lojistas e assistências parceiras com indicação técnica e pós-venda estendido.
            </>
          )}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-16">
          <Link href="/produtos" className="btn-primary w-full sm:w-auto">
            VER CATÁLOGO
            <ArrowRight size={18} />
          </Link>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost w-full sm:w-auto"
          >
            <MessageCircle size={18} />
            FALAR COM A CURADORIA
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-10 border-t border-[var(--color-border-on-dark)]">
          {[
            { value: '2500+', label: 'Peças em estoque' },
            { value: '800+', label: 'Workstations entregues' },
            { value: '4.9/5', label: 'Google Reviews' },
            { value: '100%', label: 'Garantia' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="display text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-text-on-dark)] tracking-tight">
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