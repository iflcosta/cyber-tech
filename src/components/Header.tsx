"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, MessageSquare, Search, ChevronRight, ExternalLink, Activity } from "lucide-react";
import { brand } from "@/lib/brand";
import CyberLogo from "./CyberLogo";
import TrackedWhatsAppLink from "./TrackedWhatsAppLink";

const TELAS_URL = "https://telas.cyberinformatica.tech";

const NAV_ITEMS = [
  { href: "#facility", label: "01 // Instalações (2 Pisos)", sectionId: "facility" },
  { href: "#solucoes", label: "02 // Spec-Sheets Modulares", sectionId: "solucoes" },
  { href: "#triagem", label: "03 // Seletor de Demanda", sectionId: "triagem" },
  { href: "#laudo", label: "04 // Laudo Pericial", sectionId: "laudo" },
  { href: "#localizacao", label: "05 // Sede Física 10 Anos", sectionId: "localizacao" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");

  const headerWhatsappMessage = "Olá! Vim pelo site da Cyber Informática e gostaria de atendimento técnico especializado.";

  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") return;

    const sections = NAV_ITEMS
      .map((item) => document.getElementById(item.sectionId))
      .filter((el): el is HTMLElement => el !== null);

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
    <header className="sticky top-0 z-50 bg-[#09090c]/95 backdrop-blur-md border-b border-[#242429]">
      {/* Régua Técnica de Metrologia Superior (Top Ribbon) */}
      <div className="hidden md:block bg-[#060608] border-b border-[#1c1c21] py-1 px-4 sm:px-6 lg:px-8 font-mono text-[10px] text-zinc-400">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-zinc-300 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              CYBER INSTRUMENTATION // LAB CODE: 967-BRG
            </span>
            <span className="text-zinc-700">|</span>
            <span>22°57&apos;07&quot;S 46°32&apos;28&quot;W • CENTRO HISTÓRICO BRAGANÇA PAULISTA</span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" />
              BANCADA ESD: OPERACIONAL
            </span>
            <span className="text-zinc-700">|</span>
            <span>MEZANINO: AUTOCLAVE 6.0 BAR / VÁCUO 0.08 MPa</span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-300 font-bold">10 ANOS DE BANCADA</span>
          </div>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-18">
          
          {/* Logo Arquitetônica */}
          <Link href="/" className="flex items-center gap-3 group focus:outline-none">
            <CyberLogo height={34} className="transition-transform duration-200 group-hover:scale-[1.02]" />
          </Link>

          {/* Navegação Desktop Metrológica */}
          <nav className="hidden xl:flex items-center gap-5 font-mono text-[11px] uppercase tracking-wider">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.sectionId;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    isActive
                      ? "text-white bg-zinc-900 border border-zinc-700 font-bold"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
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
              className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white border-l border-zinc-800 pl-4 py-0.5 font-bold transition-colors"
            >
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              <span>Portal Telas OCA</span>
              <ExternalLink size={11} className="text-zinc-500" />
            </a>
          </nav>

          {/* Ações Tácteis à Direita */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Botão Rastrear OS Táctil com Indicador de Serial */}
            <Link
              href="/status"
              className="inline-flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2 bg-[#121216] border border-[#27272a] hover:border-zinc-500 text-zinc-300 hover:text-white font-mono text-[11px] font-bold uppercase tracking-wider rounded-sm transition-all"
            >
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">RASTREIO</span>
              <span className="text-white font-mono bg-zinc-800/80 px-1 py-0.5 rounded text-[10px]">OS</span>
            </Link>

            {/* CTA WhatsApp Responsivo */}
            <TrackedWhatsAppLink
              phone={brand.whatsapp}
              message={headerWhatsappMessage}
              source="header_btn"
              className="btn-tactile-primary !py-2 !px-3 sm:!px-4 text-[10px] sm:text-[11px]"
              ariaLabel="Falar com Especialista"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CONSULTAR BANCADA</span>
              <span className="sm:hidden">ORÇAR</span>
            </TrackedWhatsAppLink>

            {/* Botão Menu Mobile */}
            <button
              onClick={() => setOpen(!open)}
              className="xl:hidden w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-white bg-[#121216] border border-[#27272a] hover:border-zinc-400 rounded-sm focus:outline-none transition-colors cursor-pointer shrink-0"
              aria-label={open ? "Fechar Menu" : "Abrir Menu"}
              aria-expanded={open}
            >
              {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Régua milimétrica sutil na borda inferior do header */}
      <div className="metrology-scale opacity-20 w-full" />

      {/* Menu Mobile Retrátil */}
      {open && (
        <div className="xl:hidden bg-[#0d0d10] border-t border-[#242429] px-5 py-6 font-mono text-xs shadow-2xl">
          <div className="flex flex-col space-y-2 mb-6">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between font-bold uppercase text-zinc-300 hover:text-white p-3 rounded bg-zinc-900/50 border border-zinc-800/80 transition-colors"
              >
                <span>{item.label}</span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
              </Link>
            ))}
            <a
              href={TELAS_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between font-bold uppercase text-emerald-400 p-3 rounded bg-emerald-950/20 border border-emerald-900/40 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Portal Remanufatura Telas OCA
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </a>
          </div>

          <div className="pt-4 border-t border-[#242429] flex flex-col gap-3">
            <Link
              href="/status"
              onClick={() => setOpen(false)}
              className="w-full btn-tactile-secondary text-center justify-center text-xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span>CONSULTAR ORDEM DE SERVIÇO (OS)</span>
            </Link>
            <TrackedWhatsAppLink
              phone={brand.whatsapp}
              message={headerWhatsappMessage}
              source="header_drawer"
              className="w-full btn-tactile-primary text-center justify-center text-xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>ATENDIMENTO TÉCNICO DIRETO</span>
            </TrackedWhatsAppLink>
          </div>
        </div>
      )}
    </header>
  );
}
