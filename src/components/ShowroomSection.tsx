"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { brand } from "@/lib/brand";
import { trackWhatsAppClick } from "@/lib/gtag";
import type { ShowroomPC } from "@/app/api/showroom/route";

function ChassisBlueprint({ tier }: { tier: "gamer" | "workstation" | "office" }) {
  if (tier === "office") {
    return (
      <svg viewBox="0 0 120 88" className="w-18 sm:w-20 h-14 sm:h-16 text-zinc-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="28" y="8" width="44" height="72" stroke="white" />
        <line x1="36" y1="18" x2="64" y2="18" />
        <line x1="36" y1="24" x2="54" y2="24" />
        <circle cx="62" cy="68" r="3" stroke="white" />
        <rect x="36" y="36" width="28" height="22" strokeDasharray="2 2" />
      </svg>
    );
  }
  if (tier === "workstation") {
    return (
      <svg viewBox="0 0 120 88" className="w-18 sm:w-20 h-14 sm:h-16 text-zinc-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="18" y="6" width="62" height="76" stroke="white" />
        <rect x="24" y="12" width="38" height="10" />
        <rect x="24" y="28" width="24" height="22" />
        <rect x="24" y="54" width="42" height="12" stroke="white" />
        <circle cx="92" cy="22" r="8" />
        <circle cx="92" cy="44" r="8" />
        <circle cx="92" cy="66" r="8" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 88" className="w-18 sm:w-20 h-14 sm:h-16 text-zinc-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="16" y="6" width="64" height="76" stroke="white" />
      <rect x="22" y="12" width="52" height="50" />
      <circle cx="38" cy="28" r="8" stroke="white" />
      <rect x="26" y="44" width="40" height="12" stroke="white" />
      <rect x="22" y="66" width="52" height="10" />
      <circle cx="92" cy="22" r="7" stroke="white" />
      <circle cx="92" cy="44" r="7" stroke="white" />
      <circle cx="92" cy="66" r="7" stroke="white" />
    </svg>
  );
}

export default function ShowroomSection() {
  const [pcs, setPcs] = useState<ShowroomPC[]>([]);
  const [filter, setFilter] = useState<"all" | "gamer" | "workstation" | "office">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/showroom")
      .then((r) => r.json())
      .then((data) => {
        if (active && Array.isArray(data.pcs)) {
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

  const filtered = filter === "all" ? pcs : pcs.filter((p) => p.tier === filter);

  const fmtBRL = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <section id="showroom" className="py-12 sm:py-20 bg-white border-b border-zinc-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho Enxuto */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 sm:pb-8 border-b-2 border-zinc-950">
          <div>
            <div className="font-mono text-[11px] sm:text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5 sm:mb-2">
              01 // SHOWROOM TÉRREO · PRONTA-ENTREGA
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
              Computadores Montados na Loja.
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] sm:text-xs font-mono text-zinc-700">
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-zinc-950 shrink-0" />
              <strong>Aceitamos seu usado na troca</strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-zinc-950 shrink-0" />
              <strong>Upgrade na hora</strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-zinc-950 shrink-0" />
              <strong>PIX ou até 12x</strong>
            </span>
          </div>
        </div>

        {/* Filtros de Linha (Matriz 2x2 no Mobile / Flex no Desktop) */}
        {pcs.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-zinc-300">
            <div className="grid grid-cols-2 sm:flex gap-1.5 w-full sm:w-auto">
              {[
                { id: "all", label: "TODAS" },
                { id: "gamer", label: "PC GAMER" },
                { id: "workstation", label: "WORKSTATION" },
                { id: "office", label: "OFFICE" },
              ].map((tab) => {
                const isActive = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilter(tab.id as typeof filter)}
                    className={`px-3.5 py-2 sm:py-1.5 font-mono text-xs font-bold uppercase tracking-wider border transition-colors cursor-pointer text-center ${
                      isActive
                        ? "bg-zinc-950 text-white border-zinc-950"
                        : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <a
              href="#pc-builder"
              className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 underline underline-offset-4 hover:text-zinc-600 text-center sm:text-right"
            >
              Ou monte sob medida abaixo ↓
            </a>
          </div>
        )}

        {/* Grade Compacta */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-zinc-300 border-x border-b border-zinc-300">
            {[1, 2, 3].map((n) => (
              <div key={n} className="p-5 sm:p-6 space-y-3 animate-pulse">
                <div className="h-24 w-full bg-zinc-200" />
                <div className="h-6 w-48 bg-zinc-200" />
                <div className="h-20 w-full bg-zinc-100" />
                <div className="h-10 w-full bg-zinc-200" />
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-zinc-300 border-x border-b border-zinc-300">
            {filtered.map((pc) => {
              const waText = encodeURIComponent(
                `Olá! Vi o computador *${pc.name}* (${pc.sku}) no Showroom do site:\n• CPU: ${pc.cpu}\n• GPU: ${pc.gpu}\n• RAM: ${pc.ram}\n• SSD: ${pc.storage}\n\nAinda está disponível na loja?`
              );

              return (
                <article
                  key={pc.id}
                  className="flex flex-col justify-between bg-white hover:bg-zinc-50/70 transition-colors"
                >
                  <div>
                    {pc.imageUrl ? (
                      <div className="relative aspect-[16/9] w-full bg-zinc-950 border-b border-zinc-300 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={pc.imageUrl} alt={pc.name} className="w-full h-full object-cover" />
                        <div className="absolute top-2.5 left-2.5 bg-black/90 text-white px-2 py-0.5 font-mono text-[10px] font-bold uppercase border border-zinc-700">
                          {pc.badge} · {pc.inStockQty} UN.
                        </div>
                      </div>
                    ) : (
                      <div className="bg-zinc-950 text-white p-4 border-b border-zinc-300 flex items-center justify-between gap-3">
                        <div>
                          <span className="inline-block font-mono text-[10px] font-bold uppercase px-2 py-0.5 bg-white text-black mb-1.5">
                            {pc.badge} · {pc.inStockQty} UN.
                          </span>
                          <div className="font-mono text-xs font-bold text-zinc-200 uppercase">
                            {pc.tierLabel}
                          </div>
                        </div>
                        <ChassisBlueprint tier={pc.tier} />
                      </div>
                    )}

                    <div className="p-4 sm:p-6 pb-0">
                      <h3 className="text-lg sm:text-xl font-extrabold text-zinc-950 tracking-tight mb-1">
                        {pc.name}
                      </h3>
                      <p className="text-xs text-zinc-600 line-clamp-2 mb-3.5">
                        {pc.subtitle}
                      </p>

                      {/* Grid Técnico com gap-px (Sem cortar CPU/GPU no Mobile!) */}
                      <div className="grid grid-cols-2 gap-px bg-zinc-300 border border-zinc-300 text-xs mb-3.5">
                        <div className="col-span-2 sm:col-span-1 bg-zinc-50 p-2.5 min-w-0">
                          <span className="font-mono text-[10px] uppercase text-zinc-500 block">
                            PROCESSADOR (CPU)
                          </span>
                          <strong className="font-bold text-zinc-950 block leading-snug sm:truncate" title={pc.cpu}>
                            {pc.cpu}
                          </strong>
                        </div>
                        <div className="col-span-2 sm:col-span-1 bg-zinc-50 p-2.5 min-w-0">
                          <span className="font-mono text-[10px] uppercase text-zinc-500 block">
                            PLACA DE VÍDEO (GPU)
                          </span>
                          <strong className="font-bold text-zinc-950 block leading-snug sm:truncate" title={pc.gpu}>
                            {pc.gpu}
                          </strong>
                        </div>
                        <div className="col-span-1 bg-zinc-50 p-2.5 min-w-0">
                          <span className="font-mono text-[10px] uppercase text-zinc-500 block">
                            MEMÓRIA RAM
                          </span>
                          <strong className="font-bold text-zinc-900 block leading-snug sm:truncate" title={pc.ram}>
                            {pc.ram}
                          </strong>
                        </div>
                        <div className="col-span-1 bg-zinc-50 p-2.5 min-w-0">
                          <span className="font-mono text-[10px] uppercase text-zinc-500 block">
                            SSD NVME
                          </span>
                          <strong className="font-bold text-zinc-900 block leading-snug sm:truncate" title={pc.storage}>
                            {pc.storage}
                          </strong>
                        </div>
                      </div>

                      {pc.runsTags && pc.runsTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {pc.runsTags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-zinc-100 border border-zinc-300 font-mono text-[10px] font-bold text-zinc-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 pt-0">
                    <div className="mb-3 pt-3 border-t border-zinc-200">
                      {pc.priceCash ? (
                        <div className="flex items-baseline justify-between gap-2">
                          <div>
                            <span className="font-mono text-[10px] uppercase text-zinc-500 block">
                              À Vista no PIX
                            </span>
                            <span className="text-xl font-black text-zinc-950">
                              {fmtBRL(pc.priceCash)}
                            </span>
                          </div>
                          {pc.priceInstallment && (
                            <span className="text-[11px] text-zinc-600 text-right max-w-[160px]">
                              {pc.priceInstallment}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs font-bold text-zinc-900">{pc.priceInstallment}</p>
                      )}
                    </div>

                    <a
                      href={`https://wa.me/55${brand.whatsapp}?text=${waText}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackWhatsAppClick(`showroom_${pc.sku}`)}
                      className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-mono font-bold uppercase tracking-wider py-3.5 px-4 text-xs flex items-center justify-center gap-2 transition-colors min-h-[46px]"
                    >
                      <span>Reservar / Ver Fotos no WhatsApp</span>
                      <ArrowUpRight className="w-4 h-4 shrink-0" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* Vitrine Limpa das 3 Linhas quando não há PC cadastrado no ERP */
          <div className="border-x border-b border-zinc-300 bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-zinc-300">
              {[
                {
                  index: "01",
                  tier: "office" as const,
                  tag: "ESCRITÓRIO · COMÉRCIO · ESTUDOS",
                  title: "Linha Office & Estudo NVMe",
                  spec: "Ryzen 5 / Core i5 · 16GB RAM · SSD NVMe · 2 Telas",
                  runs: ["ERP / PDV", "Office", "Contabilidade"],
                },
                {
                  index: "02",
                  tier: "gamer" as const,
                  tag: "FULL HD · COMPETITIVO · ALTO FPS",
                  title: "Linha PC Gamer (RTX / Radeon)",
                  spec: "Ryzen 5/7 · RTX 4060 / RX 7600 · 16/32GB · 1TB NVMe",
                  runs: ["CS2", "Warzone", "GTA V / RP", "Fortnite"],
                },
                {
                  index: "03",
                  tier: "workstation" as const,
                  tag: "ARQUITETURA · ENGENHARIA · 3D",
                  title: "Linha Workstation & Render",
                  spec: "Ryzen 7 / Core i7 · RTX 4070 · 32/64GB · Gen4 NVMe",
                  runs: ["AutoCAD", "Revit", "SketchUp", "Lumion"],
                },
              ].map((line) => (
                <div key={line.index} className="p-4 sm:p-6 flex flex-col justify-between">
                  <div>
                    <div className="bg-zinc-950 text-white p-4 mb-4 flex items-center justify-between gap-3">
                      <div>
                        <span className="font-display text-2xl font-black text-white block leading-none mb-1">
                          {line.index}
                        </span>
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-300 block">
                          {line.tag}
                        </span>
                      </div>
                      <ChassisBlueprint tier={line.tier} />
                    </div>

                    <h3 className="text-lg font-extrabold text-zinc-950 mb-1">
                      {line.title}
                    </h3>
                    <p className="font-mono text-xs font-bold text-zinc-700 mb-3 leading-snug">
                      {line.spec}
                    </p>

                    <div className="flex flex-wrap gap-1 mb-4 sm:mb-5">
                      {line.runs.map((r) => (
                        <span
                          key={r}
                          className="px-2 py-0.5 bg-zinc-100 border border-zinc-300 font-mono text-[10px] font-bold text-zinc-700"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/55${brand.whatsapp}?text=${encodeURIComponent(
                      `Olá! Quero ver as máquinas da *${line.title}* disponíveis hoje no Showroom da Cyber Informática.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackWhatsAppClick(`showroom_line_${line.tier}`)}
                    className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-mono font-bold uppercase tracking-wider py-3.5 px-4 text-xs flex items-center justify-center gap-2 transition-colors min-h-[46px]"
                  >
                    <span>Ver Disponíveis Hoje no WhatsApp</span>
                    <ArrowUpRight className="w-4 h-4 shrink-0" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
