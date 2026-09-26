"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { brand } from "@/lib/brand";
import TrackedWhatsAppLink from "./TrackedWhatsAppLink";
import type { ShowroomPC } from "@/app/api/showroom/route";

export default function ShowroomSection() {
  const [pcs, setPcs] = useState<ShowroomPC[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "gamer" | "workstation" | "office">("all");

  useEffect(() => {
    let active = true;
    fetch("/api/showroom")
      .then((res) => res.json())
      .then((data) => {
        if (active && Array.isArray(data?.pcs)) {
          setPcs(data.pcs);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredPcs = filter === "all" ? pcs : pcs.filter((pc) => pc.tier === filter);

  return (
    <section id="showroom" className="py-16 sm:py-24 bg-white border-b border-zinc-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho Editorial Suíço */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10 border-b-2 border-zinc-950 items-end">
          <div className="lg:col-span-8">
            <div className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
              01 // SHOWROOM DIGITAL · MÁQUINAS PRONTAS NA LOJA
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-zinc-950 tracking-tight leading-[1.05]">
              Computadores à Pronta-Entrega no Showroom.
            </h2>
          </div>
          <div className="lg:col-span-4">
            <p className="text-sm text-zinc-600 leading-relaxed">
              Assim que finalizamos a montagem e a bateria de testes, as máquinas vão para exposição na loja. Você pode{" "}
              <strong className="text-zinc-950">testar pessoalmente na hora</strong> e levar no mesmo dia — ou pedir para alterarmos memória RAM, SSD ou placa de vídeo no balcão.
            </p>
          </div>
        </div>

        {/* Barra de Filtro por Perfil */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-5 border-b border-zinc-300">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "TODAS AS LINHAS" },
              { id: "gamer", label: "PC GAMER" },
              { id: "workstation", label: "WORKSTATION / PROJETOS" },
              { id: "office", label: "OFFICE / ESCRITÓRIO" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id as typeof filter)}
                className={`px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                  filter === tab.id
                    ? "bg-zinc-950 text-white border-zinc-950"
                    : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <a
            href="#pc-builder"
            className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 underline underline-offset-4 hover:text-zinc-600"
          >
            Quer uma configuração personalizada? Use o PC Builder abaixo &darr;
          </a>
        </div>

        {/* Grade de Computadores Expostos no Showroom */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-zinc-300 border-x border-b border-zinc-300">
            {[1, 2, 3].map((n) => (
              <div key={n} className="p-8 space-y-4 animate-pulse">
                <div className="h-4 w-32 bg-zinc-200" />
                <div className="h-7 w-56 bg-zinc-200" />
                <div className="h-24 w-full bg-zinc-100" />
                <div className="h-10 w-full bg-zinc-200" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-zinc-300 border-x border-b border-zinc-300">
            {filteredPcs.map((pc) => {
              const whatsappMsg = `Olá! Vi no Showroom do site a máquina *${pc.name}* (${pc.sku}) e gostaria de saber o valor atualizado / ver fotos reais dela na bancada.`;

              return (
                <article
                  key={pc.id}
                  className="p-6 sm:p-8 flex flex-col justify-between bg-white hover:bg-zinc-50/70 transition-colors"
                >
                  <div>
                    {/* Topo do Card: SKU + Status */}
                    <div className="flex items-center justify-between gap-2 pb-4 mb-5 border-b border-zinc-200 font-mono text-[11px]">
                      <span className="text-zinc-500 font-bold uppercase">{pc.tierLabel}</span>
                      <span className="bg-zinc-950 text-white px-2.5 py-0.5 font-bold uppercase tracking-wider">
                        {pc.badge}
                      </span>
                    </div>

                    {/* Título & Subtítulo */}
                    <div className="mb-6">
                      <div className="font-mono text-[11px] text-zinc-400 mb-1">
                        CÓDIGO: {pc.sku}
                      </div>
                      <h3 className="text-2xl font-extrabold text-zinc-950 tracking-tight mb-2">
                        {pc.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                        {pc.subtitle}
                      </p>
                    </div>

                    {/* Ficha Técnica Estruturada */}
                    <dl className="divide-y divide-zinc-200 border-y border-zinc-200 text-xs mb-6">
                      <div className="py-2.5 grid grid-cols-12 gap-2">
                        <dt className="col-span-4 font-mono uppercase text-zinc-500 font-bold">
                          Processador
                        </dt>
                        <dd className="col-span-8 text-zinc-950 font-semibold">{pc.cpu}</dd>
                      </div>
                      <div className="py-2.5 grid grid-cols-12 gap-2">
                        <dt className="col-span-4 font-mono uppercase text-zinc-500 font-bold">
                          Vídeo (GPU)
                        </dt>
                        <dd className="col-span-8 text-zinc-950 font-semibold">{pc.gpu}</dd>
                      </div>
                      <div className="py-2.5 grid grid-cols-12 gap-2">
                        <dt className="col-span-4 font-mono uppercase text-zinc-500 font-bold">
                          Memória RAM
                        </dt>
                        <dd className="col-span-8 text-zinc-950 font-semibold">{pc.ram}</dd>
                      </div>
                      <div className="py-2.5 grid grid-cols-12 gap-2">
                        <dt className="col-span-4 font-mono uppercase text-zinc-500 font-bold">
                          Armazenamento
                        </dt>
                        <dd className="col-span-8 text-zinc-950 font-semibold">{pc.storage}</dd>
                      </div>
                      <div className="py-2.5 grid grid-cols-12 gap-2">
                        <dt className="col-span-4 font-mono uppercase text-zinc-500 font-bold">
                          Fonte / Gab.
                        </dt>
                        <dd className="col-span-8 text-zinc-800">{pc.psuCase}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Preço e CTA */}
                  <div>
                    <div className="bg-zinc-100 border border-zinc-300 p-4 mb-4">
                      {pc.priceCash ? (
                        <div>
                          <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 block">
                            VALOR À VISTA / PIX NA LOJA
                          </span>
                          <strong className="text-2xl font-black text-zinc-950 font-mono">
                            {pc.priceCash.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </strong>
                          <span className="block text-[11px] text-zinc-600 mt-0.5">
                            {pc.priceInstallment}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 block">
                            DISPONIBILIDADE IMEDIATA
                          </span>
                          <strong className="text-sm font-bold text-zinc-950 block mt-0.5">
                            {pc.priceInstallment}
                          </strong>
                        </div>
                      )}
                    </div>

                    <TrackedWhatsAppLink
                      phone={brand.whatsapp}
                      message={whatsappMsg}
                      source={`showroom_${pc.sku}`}
                      className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-mono font-bold uppercase tracking-wider py-3.5 px-5 text-xs flex items-center justify-center gap-2 transition-colors"
                    >
                      <span>Consultar / Ver Fotos Reais no WhatsApp</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </TrackedWhatsAppLink>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
