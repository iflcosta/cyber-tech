"use client";
import { MessageCircle, Building2, Sparkles, Cpu, Zap, Shield } from "lucide-react";

import { brand } from "@/lib/brand";
import TrackedWhatsAppLink from "./TrackedWhatsAppLink";

/**
 * Hero — Cyber Informática
 *
 * Melhorias aplicadas:
 *  - Layout em 2 colunas (texto à esquerda + visual à direita) em vez de centralizado
 *  - Visual principal: mockup SVG de uma bancada de PC (sem dependência de imagem externa)
 *  - Gradient mesh de fundo mais rico (cyan + green + purple hints)
 *  - Stats com cards de borda gradient (não texto plano)
 *  - Badge com dot pulsante "Atendimento ativo"
 *  - Headline com highlight em gradient (palavra-chave em destaque)
 *  - CTAs com sombras coloridas + ícones grandes
 *  - Suporte a ?persona=lojista (mantido do original)
 *  - B2B-safe: sem palavras barradas pelo Google Ads
 */
export default function Hero({ serviceParam, personaParam }: {
  serviceParam?: string | null;
  personaParam?: string | null;
} = {}) {
  const formattedService = serviceParam
    ? serviceParam.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : null;

  // B2B-safe: bloqueia servicos consumer-facing que o Google Ads barra
  const blockedTerms = ['conserto', 'reparo', 'manutencao', 'manutenção', 'assistencia', 'assistência', 'diagnostico', 'diagnóstico', 'formatacao', 'formatação'];
  const serviceIsSafe = formattedService && !blockedTerms.some(k => formattedService.toLowerCase().includes(k));

  const isB2B = personaParam === 'lojista' || personaParam === 'parceiro';

  const whatsappCuradoriaMessage = serviceIsSafe
    ? `Olá! Vim pelo site da Cyber e gostaria de falar com a curadoria técnica sobre ${formattedService}.`
    : "Olá! Vim pelo site da Cyber e gostaria de falar com a curadoria técnica.";

  const whatsappB2BMessage = isB2B
    ? `Olá! Sou lojista/assistência em Bragança e região. Vim pelo Google Ads e gostaria de falar sobre parceria com a Cyber (indicação técnica, suporte ao parceiro e pós-venda estendido).`
    : `Olá! Sou lojista/assistência técnica. Gostaria de falar sobre parceria com a Cyber.`;

  const headline = isB2B
    ? (
      <>
        Atendemos lojistas e assistências parceiras com <span className="gradient-text">indicação técnica</span> especializada.
      </>
    )
    : (
      <>
        Curadoria técnica que <span className="gradient-text">não empurra</span> o que você não precisa.
      </>
    );

  const subheadline = isB2B ? (
    "Indicação técnica, suporte ao parceiro e pós-venda estendido pra quem revende ou atende PC, notebook e celular na região de Bragança Paulista."
  ) : serviceIsSafe ? (
    <>
      Soluções em <span className="font-semibold text-[var(--color-cyber-blue)]">{formattedService}</span>. Loja técnica de PC, notebook e celular — curadoria, montagem e atendimento humano.
    </>
  ) : (
    "Loja técnica de PC, notebook e celular. Atendemos o cliente final com curadoria e montagem — e lojistas e assistências parceiras com indicação técnica e pós-venda estendido."
  );

  return (
    <section className="relative overflow-hidden bg-[var(--bg-primary)] pt-28 pb-20 md:pt-32 md:pb-24">
      {/* Gradient mesh de fundo — mais rico que o radial simples */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isB2B
            ? "radial-gradient(ellipse 700px 500px at 80% 50%, rgba(0,255,136,0.18) 0%, transparent 60%), radial-gradient(ellipse 500px 400px at 10% 80%, rgba(0,255,136,0.06) 0%, transparent 50%)"
            : "radial-gradient(ellipse 700px 500px at 80% 50%, rgba(0,102,255,0.22) 0%, transparent 60%), radial-gradient(ellipse 500px 400px at 10% 80%, rgba(0,255,136,0.08) 0%, transparent 50%)",
        }}
      />
      {/* Pattern sutil de grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse 800px 500px at center, black 0%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse 800px 500px at center, black 0%, transparent 70%)",
        }}
      />

      <div className="container-narrow relative">
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-12 items-center mb-16">
          {/* Coluna texto */}
          <div>
            {/* Badge com dot pulsante */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-[var(--color-cyber-blue)]/10 border border-[var(--color-cyber-blue)]/30 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-cyber-blue)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-circuit-green)] opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-circuit-green)]" />
              </span>
              Loja técnica · Bragança · Atendimento ativo
            </div>

            {/* H1 com gradient text */}
            <h1 className="display text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-extrabold tracking-tight leading-[1.02] mb-6 text-[var(--color-text-on-dark)]">
              {headline}
            </h1>

            {/* Sub */}
            <p className="text-base sm:text-lg md:text-xl max-w-2xl mb-10 leading-relaxed text-[var(--color-text-on-dark-muted)]">
              {subheadline}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
              <TrackedWhatsAppLink
                phone={brand.whatsapp}
                message={whatsappCuradoriaMessage}
                source="hero_curadoria"
                className="btn-primary inline-flex items-center justify-center gap-2 text-base px-7 py-4"
                ariaLabel="Falar com a curadoria técnica"
              >
                <MessageCircle size={20} />
                Falar no WhatsApp
              </TrackedWhatsAppLink>
              <TrackedWhatsAppLink
                phone={brand.whatsapp}
                message={whatsappB2BMessage}
                source="hero_b2b"
                className="btn-b2b inline-flex items-center justify-center gap-2 text-base px-7 py-4"
                ariaLabel="Sou lojista - falar sobre parceria"
              >
                <Building2 size={20} />
                Sou lojista
              </TrackedWhatsAppLink>
            </div>

            {/* Micro-trust badges (não substitui o atendimento humano) */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--color-text-on-dark-muted)]">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles size={14} className="text-[var(--color-circuit-green)]" />
                Atendimento humano, sem chatbot
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Shield size={14} className="text-[var(--color-cyber-blue)]" />
                10+ anos de loja
              </span>
            </div>
          </div>

          {/* Coluna visual — mockup SVG de workstation */}
          <div className="relative">
            <BancadaMockup isB2B={isB2B} />
          </div>
        </div>

        {/* Stats com cards de borda gradient */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 border-t border-white/[0.06]">
          {[
            { value: '10+', label: 'Anos de loja', icon: Sparkles, color: 'var(--color-circuit-green)' },
            { value: '200+', label: 'Peças em estoque', icon: Cpu, color: 'var(--color-cyber-blue)' },
            { value: '50+', label: 'Workstations entregues', icon: Zap, color: 'var(--color-circuit-green)' },
            { value: '24h', label: 'Resposta no WhatsApp', icon: MessageCircle, color: 'var(--color-cyber-blue)' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="relative p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden group hover:bg-white/[0.04] hover:border-white/[0.12] transition-all"
              >
                {/* Borda gradient top */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ background: `linear-gradient(90deg, transparent, ${stat.color}, transparent)` }}
                />
                <div className="flex items-start justify-between mb-3">
                  <Icon size={18} style={{ color: stat.color }} />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold tracking-tight gradient-text mb-1">
                  {stat.value}
                </div>
                <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-on-dark-muted)] font-semibold">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * BancadaMockup — SVG puro de uma workstation em bancada, sem dependência de imagem externa.
 * Mostra: monitor com tela, gabinete com RGB, teclado+mouse, peças em segundo plano.
 */
function BancadaMockup({ isB2B }: { isB2B: boolean }) {
  const accent = isB2B ? "#00ff88" : "#0066ff";
  const accent2 = isB2B ? "#00cc6e" : "#0052cc";

  return (
    <div className="relative aspect-[4/3] w-full">
      {/* Glow atrás do mockup */}
      <div
        className="absolute inset-0 rounded-3xl blur-3xl opacity-60"
        style={{ background: `radial-gradient(ellipse at center, ${accent}40 0%, transparent 60%)` }}
        aria-hidden
      />

      {/* Card do mockup */}
      <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-[#112240] to-[#0a1929] border border-white/[0.08] overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
        {/* Grid pattern interno */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
          aria-hidden
        />

        {/* Mockup SVG */}
        <svg
          viewBox="0 0 400 300"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full p-6"
          aria-hidden
        >
          <defs>
            <linearGradient id="monitor-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0a1929" />
              <stop offset="100%" stopColor="#112240" />
            </linearGradient>
            <linearGradient id="screen-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0066ff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#00ff88" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="case-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1a2f4a" />
              <stop offset="100%" stopColor="#0a1929" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Monitor (fundo, esquerda) */}
          <g transform="translate(40, 50)">
            {/* Base */}
            <rect x="60" y="170" width="80" height="6" rx="2" fill="#1a2f4a" />
            <rect x="90" y="155" width="20" height="15" fill="#1a2f4a" />
            {/* Moldura */}
            <rect x="0" y="0" width="200" height="140" rx="8" fill="url(#monitor-grad)" stroke="#1a2f4a" strokeWidth="2" />
            {/* Tela */}
            <rect x="8" y="8" width="184" height="124" rx="4" fill="url(#screen-grad)" />
            {/* UI na tela — dashboard fake */}
            <rect x="20" y="22" width="60" height="8" rx="2" fill="#ffffff" opacity="0.7" />
            <rect x="20" y="36" width="100" height="4" rx="2" fill="#ffffff" opacity="0.3" />
            <rect x="20" y="44" width="80" height="4" rx="2" fill="#ffffff" opacity="0.3" />
            {/* Gráfico de linha */}
            <polyline
              points="20,90 40,75 60,82 80,60 100,68 120,50 140,55 160,42 180,48"
              fill="none"
              stroke={accent}
              strokeWidth="2"
              filter="url(#glow)"
            />
            <circle cx="160" cy="42" r="3" fill={accent} filter="url(#glow)" />
            {/* Stats boxes */}
            <rect x="20" y="100" width="50" height="22" rx="3" fill="#ffffff" opacity="0.08" />
            <rect x="78" y="100" width="50" height="22" rx="3" fill="#ffffff" opacity="0.08" />
            <rect x="136" y="100" width="50" height="22" rx="3" fill="#ffffff" opacity="0.08" />
          </g>

          {/* Gabinete (direita, em pé) */}
          <g transform="translate(260, 30)">
            {/* Glow RGB */}
            <rect x="-2" y="-2" width="100" height="220" rx="3" fill={accent} opacity="0.3" filter="url(#glow)" />
            {/* Case */}
            <rect x="0" y="0" width="96" height="216" rx="6" fill="url(#case-grad)" stroke="#1a2f4a" strokeWidth="2" />
            {/* Janela lateral com RGB */}
            <rect x="10" y="14" width="50" height="180" rx="3" fill="#000" opacity="0.4" />
            {/* Fans RGB */}
            <circle cx="35" cy="60" r="22" fill="none" stroke={accent} strokeWidth="2" opacity="0.8" filter="url(#glow)" />
            <circle cx="35" cy="60" r="6" fill={accent} filter="url(#glow)" />
            <line x1="35" y1="38" x2="35" y2="82" stroke={accent} strokeWidth="1" opacity="0.4" />
            <line x1="13" y1="60" x2="57" y2="60" stroke={accent} strokeWidth="1" opacity="0.4" />
            <circle cx="35" cy="130" r="22" fill="none" stroke={accent2} strokeWidth="2" opacity="0.8" filter="url(#glow)" />
            <circle cx="35" cy="130" r="6" fill={accent2} filter="url(#glow)" />
            <line x1="35" y1="108" x2="35" y2="152" stroke={accent2} strokeWidth="1" opacity="0.4" />
            {/* Botão power */}
            <circle cx="78" cy="20" r="3" fill={accent} filter="url(#glow)" />
            <rect x="68" y="190" width="20" height="3" rx="1" fill="#1a2f4a" />
          </g>

          {/* Teclado (em baixo, centro) */}
          <g transform="translate(140, 230)">
            <rect x="0" y="0" width="120" height="20" rx="3" fill="#1a2f4a" />
            <rect x="2" y="2" width="116" height="16" rx="2" fill="#0a1929" />
            {/* Teclas */}
            {Array.from({ length: 12 }).map((_, i) => (
              <rect key={i} x={4 + i * 9.5} y="6" width="8" height="8" rx="1" fill="#1a2f4a" />
            ))}
            {/* Mouse */}
            <ellipse cx="140" cy="10" rx="14" ry="8" fill="#1a2f4a" />
            <line x1="140" y1="3" x2="140" y2="10" stroke="#0a1929" strokeWidth="1" />
          </g>

          {/* Partículas/circuit decorativo */}
          <g opacity="0.5">
            <circle cx="80" cy="280" r="2" fill={accent} filter="url(#glow)">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="320" cy="270" r="2" fill={accent2} filter="url(#glow)">
              <animate attributeName="opacity" values="1;0.3;1" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="380" cy="50" r="1.5" fill={accent} filter="url(#glow)">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="4s" repeatCount="indefinite" />
            </circle>
          </g>
        </svg>

        {/* Tags flutuantes */}
        <div className="absolute bottom-3 left-3 right-3 flex gap-2 text-[10px] font-mono">
          <span className="px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded text-white/90">
            ⚡ Curadoria técnica
          </span>
          <span className="px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded text-white/90">
            🔧 Montagem sob medida
          </span>
          <span className="px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded text-white/90 hidden sm:inline">
            ✅ Teste de stress
          </span>
        </div>

        {/* Badge "10+ anos" no canto */}
        <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-[var(--color-circuit-green)]/30 text-xs font-bold text-[var(--color-circuit-green)]">
          ⚡ 10+ anos
        </div>
      </div>
    </div>
  );
}