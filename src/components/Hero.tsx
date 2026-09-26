"use client";

import { ArrowUpRight, ArrowDown } from "lucide-react";
import { brand } from "@/lib/brand";
import TrackedWhatsAppLink from "./TrackedWhatsAppLink";
import HeroOSTrack from "./HeroOSTrack";

export default function Hero({
  personaParam,
}: {
  serviceParam?: string | null;
  personaParam?: string | null;
} = {}) {
  const isB2B = personaParam === "lojista" || personaParam === "parceiro";

  const whatsappHeroMessage = isB2B
    ? "Olá! Sou lojista/assistência técnica na região de Bragança. Vim pelo site da Cyber e gostaria de falar sobre parceria B2B."
    : "Olá! Vim pelo site da Cyber Informática e gostaria de falar sobre um computador à pronta-entrega ou orçamento técnico.";

  return (
    <section className="relative bg-[#09090b] text-white border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Grid Editorial Assimétrico com Divisória Estrutural */}
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:divide-x lg:divide-zinc-800">
          {/* Coluna Esquerda (7 colunas) */}
          <div className="lg:col-span-7 py-12 sm:py-16 lg:py-20 lg:pr-12">
            <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-zinc-400 mb-6">
              <span className="text-white font-bold">BRAGANÇA PAULISTA</span>
              <span className="text-zinc-700">/</span>
              <span>RUA CORONEL TEÓFILO LEME, 967 — CENTRO</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-white tracking-tight leading-[1.04] mb-6">
              Computadores à Pronta-Entrega, Bancada Rápida e Laboratório Próprio.
            </h1>

            <p className="text-base sm:text-lg text-zinc-400 leading-relaxed mb-8 max-w-2xl font-normal">
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

            {/* Rastreio de OS em Tempo Real */}
            <HeroOSTrack className="mb-8" />

            {/* Botões de Ação Direta — Preto & Branco Puro */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
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

              <TrackedWhatsAppLink
                phone={brand.whatsapp}
                message={whatsappHeroMessage}
                source="hero_primary_cta"
                className="border border-zinc-700 bg-transparent hover:bg-zinc-900 text-zinc-200 font-mono font-bold uppercase tracking-wider py-4 px-6 text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>WhatsApp</span>
                <ArrowUpRight className="w-4 h-4" />
              </TrackedWhatsAppLink>
            </div>
          </div>

          {/* Coluna Direita: Índice Arquitetônico da Loja Física (5 colunas) */}
          <div className="lg:col-span-5 py-10 sm:py-16 lg:py-20 lg:pl-10 flex flex-col justify-between border-t lg:border-t-0 border-zinc-800">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
                <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">
                  ESTRUTURA FÍSICA · 2 ANDARES
                </span>
                <span className="font-mono text-xs font-bold text-white uppercase">
                  10 ANOS DE LOJA
                </span>
              </div>

              <div className="divide-y divide-zinc-800 border-b border-zinc-800">
                {/* Bloco 01 — Computadores à Venda */}
                <div className="py-5">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-zinc-500">
                      01 / SHOWROOM TÉRREO
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-wider px-2 py-0.5 bg-white text-black font-bold">
                      Pronta-Entrega
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white mb-1.5">
                    Computadores Gamer, Workstations & Office
                  </h2>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Máquinas novas e revisadas expostas na loja, prontas para você testar na hora e levar no mesmo dia, ou configurar sob medida no nosso PC Builder.
                  </p>
                </div>

                {/* Bloco 02 — Bancada Técnica & Varejo no Térreo */}
                <div className="py-5">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-zinc-500">
                      02 / 1º ANDAR (TÉRREO)
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-300">
                      Felipe · Iago · Eduardo
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white mb-1.5">
                    Manutenção Rápida, Upgrades & Periféricos
                  </h2>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Check-in no balcão em 60 segundos com etiqueta térmica de rastreio, upgrade de SSD NVMe/memória RAM, formatação profissional e venda imediata de cabos, fontes e peças.
                  </p>
                </div>

                {/* Bloco 03 — 2º Andar Mezanino */}
                <div className="py-5">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-zinc-500">
                      03 / 2º ANDAR (MEZANINO)
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-300">
                      Jefferson
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white mb-1.5">
                    Placas de Vídeo, Celulares & Troca só do Vidro
                  </h2>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Recuperação eletrônica de placas de vídeo (RTX / Radeon) e troca apenas do vidro trincado do celular — mantendo sua tela original de fábrica por muito menos que uma tela nova.
                  </p>
                </div>
              </div>
            </div>

            {/* Rodapé Técnico da Coluna */}
            <div className="pt-6 flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-zinc-400">
              <span>GARANTIA LEGAL CDC 90 DIAS</span>
              <span className="text-white font-bold">(11) 95436-9269</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
