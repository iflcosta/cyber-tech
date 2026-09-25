"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, MessageCircle } from "lucide-react";

import { brand } from "@/lib/brand";
import TrackedWhatsAppLink from "./TrackedWhatsAppLink";
import CyberLogo from "./CyberLogo";

const TELAS_URL = "https://telas.cyberinformatica.tech";

// Fora do componente porque é estático (não depende de props/state) — se
// ficasse dentro, seria um array NOVO a cada render, e o scrollspy abaixo
// teria que recriar o IntersectionObserver toda vez que activeSection
// mudasse (que é toda vez que ele dispara), virando um loop.
const NAV_ITEMS = [
  { href: "/#catalogo", label: "Catálogo", sectionId: "catalogo" },
  { href: "/#curadoria", label: "Curadoria", sectionId: "curadoria" },
  { href: "/#monte-seu-pc", label: "Monte seu PC", sectionId: "monte-seu-pc" },
  { href: "/#parceiros", label: "Parceiros", sectionId: "parceiros" },
  { href: "/contato", label: "Contato", sectionId: "contato" },
];

/**
 * Header — Cyber Informática
 */
export default function Header() {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const nav = NAV_ITEMS;

  const headerMessage = "Olá! Vim pelo site da Cyber.";

  // Scrollspy: detecta qual seção está visível e marca o nav correspondente
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof IntersectionObserver === "undefined") return;

    const sections = nav
      .filter((item) => item.href.includes("#"))
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
      { rootMargin: "-30% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [nav]);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[var(--color-cyber-navy-mid)]/95 backdrop-blur-md border-b border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      <div className="container-narrow">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
            <CyberLogo height={36} className="transition-transform group-hover:scale-[1.02]" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((item) => {
              const isActive = activeSection === item.sectionId;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-3 py-2 text-sm font-medium transition-colors rounded-md group ${
                    isActive
                      ? "text-[var(--color-circuit-green)]"
                      : "text-[var(--color-text-on-dark-muted)] hover:text-[var(--color-text-on-dark)]"
                  }`}
                  aria-current={isActive ? "true" : undefined}
                >
                  {item.label}
                  <span
                    className={`absolute bottom-0.5 left-3 right-3 h-0.5 bg-[var(--color-circuit-green)] rounded-full transition-transform origin-left ${
                      isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              );
            })}
            {/* Cross-link para unidade de laminação OCA */}
            <a
              href={TELAS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 text-sm font-medium text-[var(--color-circuit-green)]/80 hover:text-[var(--color-circuit-green)] transition-colors rounded-md inline-flex items-center gap-1.5 ml-1 border-l border-white/[0.08] pl-4"
              aria-label="Centro de Laminação OCA — site dedicado"
            >
              <span className="w-1.5 h-1.5 bg-[var(--color-circuit-green)] rounded-full animate-pulse" />
              Laminação OCA
              <span aria-hidden className="text-[10px]">↗</span>
            </a>
          </nav>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            <TrackedWhatsAppLink
              phone={brand.whatsapp}
              message={headerMessage}
              source="header"
              className="btn-primary inline-flex items-center gap-2"
              ariaLabel="Chamar no WhatsApp da Cyber Informática"
            >
              <MessageCircle size={18} />
              <span>Chamar no WhatsApp</span>
            </TrackedWhatsAppLink>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 text-[var(--color-text-on-dark)] hover:bg-white/5 rounded-md transition-colors"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile nav */}
        {open && (
          <nav className="md:hidden py-4 border-t border-white/[0.06] bg-[var(--color-cyber-navy-mid)]">
            <div className="flex flex-col gap-1">
              {nav.map((item) => {
                const isActive = activeSection === item.sectionId;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? "text-[var(--color-circuit-green)] bg-[var(--color-circuit-green)]/10"
                        : "text-[var(--color-text-on-dark-muted)] hover:text-[var(--color-text-on-dark)] hover:bg-white/5"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              {/* Cross-link mobile */}
              <a
                href={TELAS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2.5 text-sm font-medium text-[var(--color-circuit-green)] hover:bg-[var(--color-circuit-green)]/10 rounded-md inline-flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 bg-[var(--color-circuit-green)] rounded-full animate-pulse" />
                Laminação OCA
                <span aria-hidden className="text-[10px]">↗</span>
              </a>
              <TrackedWhatsAppLink
                phone={brand.whatsapp}
                message={headerMessage}
                source="header_mobile"
                className="btn-primary mt-3 w-full inline-flex items-center justify-center gap-2"
                ariaLabel="Abrir WhatsApp da Cyber Informática"
              >
                <MessageCircle size={18} />
                WhatsApp
              </TrackedWhatsAppLink>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}