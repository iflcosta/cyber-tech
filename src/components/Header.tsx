"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, ArrowUpRight, Search } from "lucide-react";
import { brand } from "@/lib/brand";
import CyberLogo from "./CyberLogo";
import TrackedWhatsAppLink from "./TrackedWhatsAppLink";

const TELAS_URL = "https://telas.cyberinformatica.tech";

const NAV_ITEMS = [
  { href: "/#showroom", label: "Showroom Pronta-Entrega", sectionId: "showroom" },
  { href: "/#pc-builder", label: "PC Builder", sectionId: "pc-builder" },
  { href: "/#servicos", label: "Manutenção & Laboratório", sectionId: "servicos" },
  { href: "/#estrutura", label: "Nossa Loja", sectionId: "estrutura" },
  { href: "/#localizacao", label: "Endereço", sectionId: "localizacao" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");

  const headerWhatsappMessage =
    "Olá! Vim pelo site da Cyber Informática e gostaria de falar com a equipe.";

  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") return;

    const sections = NAV_ITEMS.map((item) => document.getElementById(item.sectionId)).filter(
      (el): el is HTMLElement => el !== null
    );

    if (sections.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-25% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-[#09090b]/95 backdrop-blur-md border-b border-zinc-800 text-white">
      {/* Faixa Superior Monocromática (Preto / Cinza / Branco) */}
      <div className="bg-black border-b border-zinc-900 py-1.5 px-4 sm:px-6 lg:px-8 text-[11px] font-mono text-zinc-400">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 truncate">
            <span className="text-white font-bold uppercase tracking-wider">
              CYBER INFORMÁTICA — 10 ANOS
            </span>
            <span className="hidden md:inline text-zinc-700">/</span>
            <span className="hidden md:inline text-zinc-400">
              Rua Coronel Teófilo Leme, 967 — Centro, Bragança Paulista
            </span>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <span className="hidden sm:inline text-zinc-400">
              SEG–SEX 09H–18H · SÁB 09H–13H
            </span>
            <span className="hidden lg:inline text-zinc-700">/</span>
            <span className="hidden lg:inline text-zinc-200 font-semibold">
              GARANTIA LEGAL CDC 90 DIAS
            </span>
          </div>
        </div>
      </div>

      {/* Barra Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-18">
          <Link href="/" className="flex items-center focus:outline-none">
            <CyberLogo height={34} variant="dark" />
          </Link>

          {/* Navegação Editorial Desktop */}
          <nav className="hidden xl:flex items-center gap-1 text-xs font-medium">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.sectionId;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 transition-colors ${
                    isActive
                      ? "text-white font-bold underline underline-offset-8 decoration-2 decoration-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <a
              href={TELAS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-zinc-300 hover:text-white border-l border-zinc-800 pl-3 ml-2 py-1 font-medium transition-colors"
            >
              <span>Troca só do Vidro (Tela Original)</span>
              <ArrowUpRight size={13} className="text-zinc-500" />
            </a>
          </nav>

          {/* Ações à Direita */}
          <div className="flex items-center gap-2">
            <Link
              href="/status"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs font-mono font-bold uppercase tracking-wider transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Consultar OS</span>
              <span className="sm:hidden">OS</span>
            </Link>

            <TrackedWhatsAppLink
              phone={brand.whatsapp}
              message={headerWhatsappMessage}
              source="header_btn"
              className="inline-flex items-center gap-1.5 bg-white hover:bg-zinc-200 text-black font-mono font-bold uppercase tracking-wider py-2 px-4 text-xs transition-colors"
              ariaLabel="Falar com a Loja no WhatsApp"
            >
              <span>WhatsApp</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </TrackedWhatsAppLink>

            <button
              onClick={() => setOpen(!open)}
              className="xl:hidden w-9 h-9 flex items-center justify-center text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 focus:outline-none transition-colors cursor-pointer shrink-0"
              aria-label={open ? "Fechar Menu" : "Abrir Menu"}
              aria-expanded={open}
            >
              {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile */}
      {open && (
        <div className="xl:hidden bg-[#09090b] border-t border-zinc-800 px-5 py-6 text-xs">
          <div className="flex flex-col divide-y divide-zinc-800 border-y border-zinc-800 mb-5">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between font-bold text-zinc-200 hover:text-white py-3.5 transition-colors"
              >
                <span>{item.label}</span>
                <span className="font-mono text-zinc-500">&rarr;</span>
              </Link>
            ))}
            <a
              href={TELAS_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between font-bold text-zinc-300 hover:text-white py-3.5 transition-colors"
            >
              <span>Troca só do Vidro — Salve sua Tela Original (2º Andar)</span>
              <ArrowUpRight className="w-4 h-4 text-zinc-500" />
            </a>
          </div>

          <div className="flex flex-col gap-2.5">
            <Link
              href="/status"
              onClick={() => setOpen(false)}
              className="w-full border border-zinc-700 bg-zinc-900 py-3 px-4 text-center font-mono font-bold uppercase tracking-wider text-white"
            >
              Consultar Ordem de Serviço
            </Link>
            <TrackedWhatsAppLink
              phone={brand.whatsapp}
              message={headerWhatsappMessage}
              source="header_drawer"
              className="w-full bg-white text-black py-3 px-4 text-center font-mono font-bold uppercase tracking-wider"
            >
              Chamar no WhatsApp
            </TrackedWhatsAppLink>
          </div>
        </div>
      )}
    </header>
  );
}
