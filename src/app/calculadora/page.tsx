import type { Metadata } from "next";
import Header from "@/components/Header";
import CyberIA from "@/components/CyberIA";
import CalculadoraWizard from "./CalculadoraWizard";

export const metadata: Metadata = {
  title: "Calculadora: Consertar ou Comprar? | Cyber Informática",
  description:
    "Use nossa calculadora interativa para descobrir se vale a pena consertar ou atualizar seu notebook/PC. Diagnóstico técnico gratuito em Bragança Paulista.",
  keywords: [
    "consertar notebook Bragança Paulista",
    "vale a pena consertar PC",
    "upgrade ou PC novo",
    "calculadora upgrade notebook",
    "assistência técnica barata Bragança Paulista",
  ],
  openGraph: {
    title: "Calculadora: Consertar ou Comprar? | Cyber Informática",
    description: "Use nossa calculadora interativa para descobrir se vale a pena consertar ou atualizar seu notebook/PC.",
    url: "https://cyberinformatica.tech/calculadora",
  },
  twitter: {
    title: "Calculadora: Consertar ou Comprar? | Cyber Informática",
    description: "Use nossa calculadora interativa para descobrir se vale a pena consertar ou atualizar seu notebook/PC.",
  }
};

export default function CalculadoraPage() {
  return (
    <main className="min-h-screen bg-[#121216]">
      <Header />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-16 overflow-hidden">
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,255,255,.4) 40px), repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,.4) 40px)",
          }}
        />
        {/* Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-white/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 text-center relative z-10 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/10 bg-white/5 text-[10px] font-mono text-slate-400 uppercase tracking-[0.3em] rounded-full mb-6">
            <div className="w-1.5 h-1.5 bg-[var(--accent-success)] rounded-full animate-pulse" />
            FERRAMENTA GRATUITA
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-bold text-white uppercase tracking-tighter leading-[0.85] mb-5">
            Consertar ou{" "}
            <span className="italic chrome-text !from-white !via-slate-200 !to-slate-400">
              Comprar?
            </span>
          </h1>
          <p className="text-base text-slate-400 font-mono max-w-xl mx-auto leading-relaxed">
            Responda 3 perguntas rápidas e descubra qual caminho é o mais
            vantajoso para o seu equipamento.{" "}
            <span className="text-white font-bold">100% gratuito.</span>
          </p>
        </div>

        {/* ── Wizard ────────────────────────────────────────────────── */}
        <CalculadoraWizard />
      </section>

      {/* ── Trust Footer ─────────────────────────────────────────────── */}
      <section className="py-16 border-t border-white/5">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-6">
            Por que confiar no nosso diagnóstico?
          </p>
          <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
            <div>
              <div className="text-2xl font-display font-bold text-white">2500+</div>
              <div className="text-[9px] font-mono text-slate-600 uppercase tracking-wider mt-1">Reparos</div>
            </div>
            <div>
              <div className="text-2xl font-display font-bold text-[var(--accent-success)]">100%</div>
              <div className="text-[9px] font-mono text-slate-600 uppercase tracking-wider mt-1">Garantia</div>
            </div>
            <div>
              <div className="text-2xl font-display font-bold text-white">4.9★</div>
              <div className="text-[9px] font-mono text-slate-600 uppercase tracking-wider mt-1">Google</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 border-t border-white/5 text-center">
        <p className="text-[10px] font-mono font-bold text-slate-700 uppercase tracking-widest">
          Cyber Informática &copy; {new Date().getFullYear()} — Bragança Paulista/SP
        </p>
      </footer>

      <CyberIA />
    </main>
  );
}
