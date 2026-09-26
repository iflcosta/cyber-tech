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
          {/* Coluna Esquerda (7 cols) — Direta, Limpa e Escaneável em 3s */}
          <div className="lg:col-span-7 py-10 sm:py-14 lg:py-16 lg:pr-12 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 font-mono text-[11px] sm:text-xs uppercase tracking-widest text-zinc-400 mb-4">
                <span className="text-white font-bold">BRAGANÇA PAULISTA</span>
                <span className="text-zinc-700">/</span>
                <span>RUA CORONEL TEÓFILO LEME, 967 — CENTRO</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-extrabold text-white tracking-tight leading-[1.04] mb-4">
                Computadores Prontos, Bancada Rápida e Laboratório Próprio.
              </h1>

              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed mb-7 max-w-xl">
                Há 10 anos no Centro de Bragança. Máquinas montadas para testar e levar hoje, upgrades na hora no térreo e laboratório de placas de vídeo e{" "}
                <strong className="text-white font-semibold">
                  troca só do vidro (tela original)
                </strong>{" "}
                no 2º andar.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
              <a
                href="#showroom"
                className="bg-white hover:bg-zinc-200 text-black font-mono font-bold uppercase tracking-wider py-3.5 px-6 text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>Ver Showroom PC</span>
                <ArrowDown className="w-4 h-4" />
              </a>

              <a
                href="#pc-builder"
                className="border border-white bg-zinc-900 hover:bg-zinc-800 text-white font-mono font-bold uppercase tracking-wider py-3.5 px-6 text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>Montar Meu PC</span>
                <ArrowDown className="w-4 h-4 text-zinc-300" />
              </a>

              <a
                href={`https://wa.me/55${brand.whatsapp}?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20Cyber%20Inform%C3%A1tica%20e%20gostaria%20de%20um%20or%C3%A7amento.`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleWhatsAppClick}
                className="border border-zinc-700 bg-transparent hover:bg-zinc-900 text-zinc-200 font-mono font-bold uppercase tracking-wider py-3.5 px-5 text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>WhatsApp</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Coluna Direita (5 cols) — Consulta de OS + Índice Compacto de 3 Linhas */}
          <div className="lg:col-span-5 py-8 sm:py-14 lg:py-16 lg:pl-10 flex flex-col justify-between border-t lg:border-t-0 border-zinc-800 gap-6">
            <HeroOSTrack />

            <div className="divide-y divide-zinc-800 border-y border-zinc-800">
              <a
                href="#showroom"
                className="py-3.5 flex items-center justify-between gap-3 group hover:bg-zinc-900/50 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <span className="font-display text-2xl font-black text-zinc-500 group-hover:text-white leading-none">
                    01
                  </span>
                  <div>
                    <strong className="text-sm font-bold text-white block">
                      Showroom Pronta-Entrega & PC Builder
                    </strong>
                    <span className="text-xs text-zinc-400">
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
                className="py-3.5 flex items-center justify-between gap-3 group hover:bg-zinc-900/50 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <span className="font-display text-2xl font-black text-zinc-500 group-hover:text-white leading-none">
                    02
                  </span>
                  <div>
                    <strong className="text-sm font-bold text-white block">
                      Manutenção Rápida, SSD/RAM & Cabos
                    </strong>
                    <span className="text-xs text-zinc-400">
                      Upgrades na hora e peças no balcão · Felipe, Iago e Eduardo
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
                className="py-3.5 flex items-center justify-between gap-3 group hover:bg-zinc-900/50 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <span className="font-display text-2xl font-black text-zinc-500 group-hover:text-white leading-none">
                    03
                  </span>
                  <div>
                    <strong className="text-sm font-bold text-white block">
                      Placas de Vídeo & Troca só do Vidro
                    </strong>
                    <span className="text-xs text-zinc-400">
                      Recuperação de GPUs e tela original · Jefferson
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
