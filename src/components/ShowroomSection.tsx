"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDown, Check } from "lucide-react";
import { brand } from "@/lib/brand";
import { trackWhatsAppClick } from "@/lib/tracking";
import type { ShowroomPC } from "@/app/api/showroom/route";

function ChassisBlueprint({ tier }: { tier: "gamer" | "workstation" | "office" }) {
  if (tier === "office") {
    return (
      <svg viewBox="0 0 120 88" className="w-24 h-20 text-zinc-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
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
      <svg viewBox="0 0 120 88" className="w-24 h-20 text-zinc-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
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
    <svg viewBox="0 0 120 88" className="w-24 h-20 text-zinc-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
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
              Assim que finalizamos a montagem e os testes de estresse, as máquinas vão para exposição no térreo. Você pode{" "}
              <strong className="text-zinc-950">testar pessoalmente na hora</strong>, dar seu equipamento usado como parte do pagamento ou alterar peças no balcão.
            </p>
          </div>
        </div>

        {/* Faixa de Diferenciais de Compra no Balcão */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-300 border-x border-b border-zinc-300 bg-zinc-50">
          <div className="px-5 py-3.5 flex items-center gap-2.5 text-xs text-zinc-800">
            <Check className="w-4 h-4 text-zinc-950 shrink-0" />
            <span>
              <strong className="text-zinc-950">Seu Usado na Troca:</strong> Avaliamos seu PC ou notebook usado como parte do pagamento.
            </span>
          </div>
          <div className="px-5 py-3.5 flex items-center gap-2.5 text-xs text-zinc-800">
            <Check className="w-4 h-4 text-zinc-950 shrink-0" />
            <span>
              <strong className="text-zinc-950">Upgrade na Hora:</strong> Quer mais RAM ou SSD maior? Alteramos na bancada antes de você levar.
            </span>
          </div>
          <div className="px-5 py-3.5 flex items-center gap-2.5 text-xs text-zinc-800">
            <Check className="w-4 h-4 text-zinc-950 shrink-0" />
            <span>
              <strong className="text-zinc-950">Parcelamento & Garantia:</strong> Desconto à vista no PIX ou em até 12x no cartão com Garantia na loja.
            </span>
          </div>
        </div>

        {/* Filtros de Linha (exibidos quando há máquinas publicadas no ERP) */}
        {pcs.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 py-5 border-b border-zinc-300">
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "TODAS AS LINHAS" },
                { id: "gamer", label: "PC GAMER" },
                { id: "workstation", label: "WORKSTATION / PROJETOS" },
                { id: "office", label: "OFFICE / ESCRITÓRIO" },
              ].map((tab) => {
                const isActive = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilter(tab.id as typeof filter)}
                    className={`px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
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
              className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 underline underline-offset-4 hover:text-zinc-600"
            >
              Quer uma configuração personalizada? Use o PC Builder abaixo ↓
            </a>
          </div>
        )}

        {/* Grade de Computadores do Showroom (100% Dados Reais do ERP) */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-zinc-300 border-x border-b border-zinc-300">
            {[1, 2, 3].map((n) => (
              <div key={n} className="p-8 space-y-4 animate-pulse">
                <div className="h-36 w-full bg-zinc-200" />
                <div className="h-6 w-56 bg-zinc-200" />
                <div className="h-24 w-full bg-zinc-100" />
                <div className="h-12 w-full bg-zinc-200" />
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-zinc-300 border-x border-b border-zinc-300">
            {filtered.map((pc) => {
              const waText = encodeURIComponent(
                `Olá! Vi o computador *${pc.name}* (${pc.sku}) no Showroom do site da Cyber Informática:\n• Processador: ${pc.cpu}\n• Placa de Vídeo: ${pc.gpu}\n• Memória: ${pc.ram}\n• SSD: ${pc.storage}\n\nAinda está disponível à pronta-entrega na loja?`
              );

              return (
                <article
                  key={pc.id}
                  className="flex flex-col justify-between bg-white hover:bg-zinc-50/70 transition-colors"
                >
                  <div>
                    {/* Visor Superior: Foto Real da Bancada ou Blueprint CAD */}
                    {pc.imageUrl ? (
                      <div className="relative aspect-[16/10] w-full bg-zinc-950 border-b border-zinc-300 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={pc.imageUrl}
                          alt={pc.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 bg-black/90 text-white px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider border border-zinc-700">
                          {pc.badge} · {pc.inStockQty} UN.
                        </div>
                        <div className="absolute bottom-3 right-3 bg-white text-zinc-950 px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
                          SKU: {pc.sku}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-zinc-950 text-white p-5 border-b border-zinc-300 flex items-center justify-between gap-4">
                        <div>
                          <span className="inline-block font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-white text-black mb-2">
                            {pc.badge} · {pc.inStockQty} UN.
                          </span>
                          <div className="font-mono text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                            {pc.tierLabel}
                          </div>
                          <div className="font-mono text-[10px] text-zinc-500 mt-1">
                            CÓD. {pc.sku} · PRONTO NO TÉRREO
                          </div>
                        </div>
                        <ChassisBlueprint tier={pc.tier} />
                      </div>
                    )}

                    <div className="p-6 sm:p-8 pb-0">
                      {/* Nome e Resumo */}
                      <h3 className="text-2xl font-extrabold text-zinc-950 tracking-tight mb-2">
                        {pc.name}
                      </h3>
                      <p className="text-xs text-zinc-600 leading-relaxed mb-5">
                        {pc.subtitle}
                      </p>

                      {/* Hero Specs: CPU + GPU em Destaque */}
                      <div className="grid grid-cols-1 gap-2.5 mb-4">
                        <div className="p-3 bg-zinc-100 border border-zinc-900">
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                            PROCESSADOR (CPU)
                          </span>
                          <strong className="text-xs sm:text-sm font-extrabold text-zinc-950 block mt-0.5">
                            {pc.cpu}
                          </strong>
                        </div>
                        <div className="p-3 bg-zinc-100 border border-zinc-900">
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                            PLACA DE VÍDEO (GPU)
                          </span>
                          <strong className="text-xs sm:text-sm font-extrabold text-zinc-950 block mt-0.5">
                            {pc.gpu}
                          </strong>
                        </div>
                      </div>

                      {/* Demais Especificações */}
                      <dl className="divide-y divide-zinc-200 border-t border-b border-zinc-300 text-xs mb-5">
                        <div className="py-2.5 flex justify-between gap-3">
                          <dt className="font-mono uppercase text-zinc-500 shrink-0">Memória RAM</dt>
                          <dd className="font-bold text-zinc-900 text-right">{pc.ram}</dd>
                        </div>
                        <div className="py-2.5 flex justify-between gap-3">
                          <dt className="font-mono uppercase text-zinc-500 shrink-0">Armazenamento</dt>
                          <dd className="font-bold text-zinc-900 text-right">{pc.storage}</dd>
                        </div>
                        <div className="py-2.5 flex justify-between gap-3">
                          <dt className="font-mono uppercase text-zinc-500 shrink-0">Fonte / Gab.</dt>
                          <dd className="font-medium text-zinc-800 text-right">{pc.psuCase}</dd>
                        </div>
                      </dl>

                      {/* O Que Roda */}
                      {pc.runsTags && pc.runsTags.length > 0 && (
                        <div className="mb-6">
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-2">
                            IDEAL PARA RODAR:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {pc.runsTags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-zinc-100 border border-zinc-300 font-mono text-[10px] font-bold text-zinc-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preço e CTA */}
                  <div className="p-6 sm:p-8 pt-0">
                    <div className="mb-4 pt-4 border-t border-zinc-200">
                      {pc.priceCash ? (
                        <div>
                          <span className="font-mono text-[10px] uppercase text-zinc-500 block">
                            Valor à Vista (PIX / Dinheiro)
                          </span>
                          <span className="text-2xl font-black text-zinc-950 tracking-tight">
                            {fmtBRL(pc.priceCash)}
                          </span>
                          {pc.priceInstallment && (
                            <span className="block text-[11px] font-medium text-zinc-600 mt-0.5">
                              {pc.priceInstallment}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs font-bold text-zinc-900">
                          {pc.priceInstallment}
                        </p>
                      )}
                    </div>

                    <a
                      href={`https://wa.me/55${brand.whatsapp}?text=${waText}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackWhatsAppClick(`showroom_${pc.sku}`)}
                      className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-mono font-bold uppercase tracking-wider py-3.5 px-4 text-xs flex items-center justify-center gap-2 transition-colors"
                    >
                      <span>Reservar / Ver Fotos Reais no WhatsApp</span>
                      <ArrowUpRight className="w-4 h-4 shrink-0" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* Estado Limpo (Zero Mocks) — Vitrine das 3 Linhas Montadas na Bancada */
          <div className="border-x border-b border-zinc-300 bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-zinc-300">
              {[
                {
                  index: "01",
                  tier: "office" as const,
                  tag: "ESCRITÓRIO · COMÉRCIO · ESTUDOS",
                  title: "Linha Cyber Office & Estudo NVMe",
                  desc: "Computadores silenciosos e rápidos com inicialização em 8 segundos, SSD NVMe M.2, 16GB RAM e suporte a 2 monitores para clínicas, contabilidades e comércio.",
                  runs: ["Sistemas ERP / PDV", "Pacote Office", "2 Monitores", "Multitarefa"],
                },
                {
                  index: "02",
                  tier: "gamer" as const,
                  tag: "FULL HD · COMPETITIVO · ALTO FPS",
                  title: "Linha Cyber Gamer (Ryzen / Core + RTX)",
                  desc: "Máquinas montadas em gabinete aquário ou mesh com fluxo de ar otimizado, placas GeForce RTX ou Radeon RX, cabos organizados e BIOS configurada.",
                  runs: ["CS2", "Valorant", "Call of Duty Warzone", "GTA V / FiveM", "Fortnite"],
                },
                {
                  index: "03",
                  tier: "workstation" as const,
                  tag: "ENGENHARIA · ARQUITETURA · EDIÇÃO",
                  title: "Linha Workstation & Render 3D",
                  desc: "Alta capacidade de processamento multi-core, 32GB a 64GB de RAM e SSD NVMe Gen4 para projetos pesados em CAD, modelagem e edição de vídeo.",
                  runs: ["AutoCAD", "Revit", "SketchUp", "Lumion", "Premiere Pro"],
                },
              ].map((line) => (
                <div key={line.index} className="p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    <div className="bg-zinc-950 text-white p-5 mb-6 flex items-center justify-between gap-4">
                      <div>
                        <span className="font-display text-3xl font-black text-white block leading-none mb-1.5">
                          {line.index}
                        </span>
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-300 block">
                          {line.tag}
                        </span>
                      </div>
                      <ChassisBlueprint tier={line.tier} />
                    </div>

                    <h3 className="text-xl font-extrabold text-zinc-950 mb-2">
                      {line.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-5">
                      {line.desc}
                    </p>

                    <div className="mb-6">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-2">
                        PERFIL DE USO:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {line.runs.map((r) => (
                          <span
                            key={r}
                            className="px-2 py-0.5 bg-zinc-100 border border-zinc-300 font-mono text-[10px] font-bold text-zinc-800"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/55${brand.whatsapp}?text=${encodeURIComponent(
                      `Olá! Gostaria de ver as opções e fotos dos computadores da *${line.title}* disponíveis hoje no Showroom da Cyber Informática.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackWhatsAppClick(`showroom_line_${line.tier}`)}
                    className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-mono font-bold uppercase tracking-wider py-3.5 px-4 text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Ver Máquinas Prontas Hoje no WhatsApp</span>
                    <ArrowUpRight className="w-4 h-4 shrink-0" />
                  </a>
                </div>
              ))}
            </div>

            <div className="p-5 sm:px-8 bg-zinc-100 border-t border-zinc-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-xs text-zinc-700 font-mono">
                <strong className="text-zinc-950 uppercase">ATUALIZAÇÃO EM TEMPO REAL:</strong> Assim que um computador termina os testes na bancada, ele é publicado automaticamente nesta vitrine.
              </p>
              <a
                href="#pc-builder"
                className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:text-zinc-600 underline underline-offset-4 shrink-0"
              >
                <span>Ou monte peça por peça no PC Builder abaixo</span>
                <ArrowDown className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
