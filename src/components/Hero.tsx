"use client";

import HeroOSTrack from "@/components/HeroOSTrack";
import { brand } from "@/lib/brand";
import { trackWhatsAppClick } from "@/lib/gtag";
import { ArrowDown, ArrowUpRight } from "lucide-react";

export default function Hero() {
  const handleWhatsAppClick = () => {
    trackWhatsAppClick("hero_cta");
  };

  return (
    <section className="relative bg-[#09090b] text-white border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:divide-x lg:divide-zinc-800">
          {/* Coluna Esquerda (7 cols) — Otimizada para Primeira Dobra Mobile */}
          <div className="lg:col-span-7 py-7 sm:py-14 lg:py-16 lg:pr-12 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[10px] sm:text-xs uppercase tracking-widest text-zinc-400 mb-3 sm:mb-4">
                <span className="text-white font-bold">BRAGANÇA PAULISTA</span>
                <span className="text-zinc-700">/</span>
                <span>RUA CORONEL TEÓFILO LEME, 967 — CENTRO</span>
              </div>

              <h1 className="text-[28px] sm:text-5xl lg:text-[52px] font-extrabold text-white tracking-tight leading-[1.06] mb-3.5 sm:mb-4">
                Computadores Prontos, Bancada Rápida e Laboratório Próprio.
              </h1>

              <p className="text-xs sm:text-base text-zinc-300 leading-relaxed mb-5 sm:mb-7 max-w-xl">
                Há 10 anos no Centro de Bragança. Máquinas montadas para testar e levar hoje, upgrades na hora no térreo e laboratório de placas de vídeo e{" "}
                <strong className="text-white font-semibold underline underline-offset-4">
                  troca só do vidro (tela original)
                </strong>{" "}
                no 2º andar.
              </p>
            </div>

            {/* CTAs Mobile-First: WhatsApp PRIMÁRIO full-width + 2 Secundários Lado a Lado */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
              {/* PRIMÁRIO: WhatsApp -- resolve o cliente urgente */}
              <a
                href={`https://wa.me/55${brand.whatsapp}?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20Cyber%20Inform%C3%A1tica%20e%20gostaria%20de%20um%20or%C3%A7amento.`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleWhatsAppClick}
                className="w-full sm:w-auto bg-white hover:bg-zinc-200 text-black font-mono font-bold uppercase tracking-wider py-3.5 px-6 text-xs flex items-center justify-center gap-2 transition-colors min-h-[52px]"
              >
                <span>Solicitar Orçamento no WhatsApp</span>
                <ArrowUpRight className="w-4 h-4 shrink-0" />
              </a>

              {/* SECUNDÁRIOS: Showroom + Montar PC lado a lado no mobile */}
              <div className="grid grid-cols-2 sm:flex gap-2.5 sm:gap-3">
                <a
                  href="#showroom"
                  className="border border-white bg-zinc-900 hover:bg-zinc-800 text-white font-mono font-bold uppercase tracking-wider py-3.5 px-3 sm:px-6 text-xs flex items-center justify-center gap-1.5 sm:gap-2 transition-colors min-h-[46px]"
                >
                  <span>Ver Showroom</span>
                  <ArrowDown className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                </a>
                <a
                  href="#pc-builder"
                  className="border border-zinc-700 bg-zinc-950 hover:bg-zinc-900 text-zinc-200 font-mono font-bold uppercase tracking-wider py-3.5 px-3 sm:px-5 text-xs flex items-center justify-center gap-1.5 sm:gap-2 transition-colors min-h-[46px]"
                >
                  <span>Montar PC</span>
                  <ArrowDown className="w-3.5 h-3.5 shrink-0" />
                </a>
              </div>
            </div>
          </div>

          {/* Coluna Direita (5 cols) — Consulta de OS Visível na Primeira Dobra Mobile + Índice */}
          <div className="lg:col-span-5 py-6 sm:py-14 lg:py-16 lg:pl-10 flex flex-col justify-between border-t lg:border-t-0 border-zinc-800 gap-5">
            <HeroOSTrack />

            <div className="divide-y divide-zinc-800 border-y border-zinc-800">
              <a
                href="#showroom"
                className="py-3 flex items-center justify-between gap-3 group hover:bg-zinc-900/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-display text-xl sm:text-2xl font-black text-zinc-500 group-hover:text-white leading-none shrink-0">
                    01
                  </span>
                  <div className="min-w-0">
                    <strong className="text-xs sm:text-sm font-bold text-white block truncate">
                      Showroom Pronta-Entrega & PC Builder
                    </strong>
                    <span className="text-[11px] sm:text-xs text-zinc-400 block truncate">
                      PC Gamer, Workstation e Office prontos ou sob medida
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 bg-white text-black shrink-0">
                  Térreo
                </span>
              </a>

              <a
                href="#servicos"
                className="py-3 flex items-center justify-between gap-3 group hover:bg-zinc-900/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-display text-xl sm:text-2xl font-black text-zinc-500 group-hover:text-white leading-none shrink-0">
                    02
                  </span>
                  <div className="min-w-0">
                    <strong className="text-xs sm:text-sm font-bold text-white block truncate">
                      Manutenção Rápida, SSD/RAM & Cabos
                    </strong>
                    <span className="text-[11px] sm:text-xs text-zinc-400 block truncate">
                      Upgrades na hora e peças · Felipe, Iago e Eduardo
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 border border-zinc-700 text-zinc-300 shrink-0">
                  1º Andar
                </span>
              </a>

              <a
                href="https://telas.cyberinformatica.tech"
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 flex items-center justify-between gap-3 group hover:bg-zinc-900/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-display text-xl sm:text-2xl font-black text-zinc-500 group-hover:text-white leading-none shrink-0">
                    03
                  </span>
                  <div className="min-w-0">
                    <strong className="text-xs sm:text-sm font-bold text-white block truncate">
                      Celulares, Telas & Placas de Vídeo
                    </strong>
                    <span className="text-[11px] sm:text-xs text-zinc-400 block truncate">
                      Manutenção de celulares, troca de vidro e GPUs · Jefferson
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 border border-zinc-700 text-zinc-300 shrink-0">
                  2º Andar ↗
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
