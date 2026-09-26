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
          {/* Coluna Principal (7 cols) — Promessa Comercial + CTAs Acima da Dobra */}
          <div className="lg:col-span-7 py-10 sm:py-16 lg:py-20 lg:pr-12">
            {/* Eyebrow Localização */}
            <div className="flex items-center gap-3 font-mono text-[11px] sm:text-xs uppercase tracking-widest text-zinc-400 mb-5">
              <span className="text-white font-bold">BRAGANÇA PAULISTA</span>
              <span className="text-zinc-700">/</span>
              <span>RUA CORONEL TEÓFILO LEME, 967 — CENTRO</span>
            </div>

            {/* H1 Editorial Forte */}
            <h1 className="text-3xl sm:text-5xl lg:text-[56px] font-extrabold text-white tracking-tight leading-[1.04] mb-5">
              Computadores à Pronta-Entrega, Bancada Rápida e Laboratório Próprio.
            </h1>

            {/* Subtítulo Direto */}
            <p className="text-sm sm:text-lg text-zinc-400 leading-relaxed mb-7 max-w-2xl font-normal">
              Há 10 anos no Centro de Bragança Paulista. Trabalhamos com{" "}
              <strong className="text-white font-semibold">
                computadores montados à pronta-entrega e sob medida
              </strong>
              , manutenção e upgrades rápidos no térreo e laboratório próprio no 2º andar para placas de vídeo (GPUs), celulares e{" "}
              <strong className="text-white font-semibold">
                troca só do vidro mantendo sua tela original
              </strong>
              .
            </p>

            {/* CTAs Comerciais Acima da Dobra Mobile */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 mb-8">
              <a
                href="#showroom"
                className="bg-white hover:bg-zinc-200 text-black font-mono font-bold uppercase tracking-wider py-4 px-6 text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>Ver Showroom Pronta-Entrega</span>
                <ArrowDown className="w-4 h-4" />
              </a>

              <a
                href="#pc-builder"
                className="border border-white bg-zinc-900 hover:bg-zinc-800 text-white font-mono font-bold uppercase tracking-wider py-4 px-6 text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>Montar Meu PC (Orçamento)</span>
                <ArrowDown className="w-4 h-4 text-zinc-300" />
              </a>

              <a
                href={`https://wa.me/55${brand.whatsapp}?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20Cyber%20Inform%C3%A1tica%20e%20gostaria%20de%20falar%20sobre%20um%20computador%20%C3%A0%20pronta-entrega%20ou%20or%C3%A7amento%20t%C3%A9cnico.`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleWhatsAppClick}
                className="border border-zinc-700 bg-transparent hover:bg-zinc-900 text-zinc-200 font-mono font-bold uppercase tracking-wider py-4 px-6 text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>WhatsApp</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>

            {/* Rastreio de OS Compacto (Para quem já é cliente) */}
            <HeroOSTrack />
          </div>

          {/* Coluna Direita (5 cols) — Índices Esculturais Suíços */}
          <div className="lg:col-span-5 py-10 sm:py-16 lg:py-20 lg:pl-10 flex flex-col justify-between border-t lg:border-t-0 border-zinc-800">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-2">
                <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">
                  ESTRUTURA FÍSICA · 2 ANDARES
                </span>
                <span className="font-mono text-xs font-bold text-white uppercase">
                  10 ANOS DE LOJA
                </span>
              </div>

              <div className="divide-y divide-zinc-800 border-b border-zinc-800">
                {/* Item 01 */}
                <a href="#showroom" className="py-5 flex gap-4 group block hover:bg-zinc-900/40 transition-colors">
                  <span className="font-display text-3xl sm:text-4xl font-black text-zinc-600 group-hover:text-white leading-none select-none transition-colors">
                    01
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[11px] font-bold text-zinc-400 uppercase">
                        SHOWROOM TÉRREO
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 bg-white text-black font-bold">
                        Pronta-Entrega
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-white mb-1">
                      Computadores Gamer, Workstations & Office
                    </h2>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Máquinas montadas e testadas na loja, prontas para testar na hora e levar no mesmo dia — ou configurar sob medida no PC Builder.
                    </p>
                  </div>
                </a>

                {/* Item 02 */}
                <a href="#servicos" className="py-5 flex gap-4 group block hover:bg-zinc-900/40 transition-colors">
                  <span className="font-display text-3xl sm:text-4xl font-black text-zinc-600 group-hover:text-white leading-none select-none transition-colors">
                    02
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[11px] font-bold text-zinc-400 uppercase">
                        1º ANDAR (TÉRREO)
                      </span>
                      <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-300">
                        Felipe · Iago · Eduardo
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-white mb-1">
                      Manutenção Rápida, Upgrades & Periféricos
                    </h2>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Check-in no balcão em 60 segundos com etiqueta térmica de identificação, upgrade de SSD NVMe/RAM, formatação e venda de cabos, fontes e peças.
                    </p>
                  </div>
                </a>

                {/* Item 03 */}
                <a
                  href="https://telas.cyberinformatica.tech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-5 flex gap-4 group block hover:bg-zinc-900/40 transition-colors"
                >
                  <span className="font-display text-3xl sm:text-4xl font-black text-zinc-600 group-hover:text-white leading-none select-none transition-colors">
                    03
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[11px] font-bold text-zinc-400 uppercase">
                        2º ANDAR (MEZANINO)
                      </span>
                      <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-300">
                        Jefferson
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-white mb-1">
                      Placas de Vídeo, Celulares & Troca só do Vidro
                    </h2>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Recuperação eletrônica de placas de vídeo (RTX / Radeon) e troca apenas do vidro trincado do celular — mantendo sua tela original de fábrica.
                    </p>
                  </div>
                </a>
              </div>
            </div>

            {/* Rodapé da Coluna */}
            <div className="pt-6 flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-zinc-400">
              <span>GARANTIA LEGAL CDC 90 DIAS</span>
              <span className="text-white font-bold">{brand.phone}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
