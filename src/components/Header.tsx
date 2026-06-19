"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, MessageCircle } from "lucide-react";

import { brand } from "@/lib/brand";

/**
 * Header — Cyber Informática
 * Nav: Catálogo, Monte seu PC, Curadoria, Parceiros, Contato
 * B2B-friendly badge visível (Circuit Green)
 */
export default function Header() {
  const [open, setOpen] = useState(false);

  const nav = [
    { href: "#catalogo", label: "Catálogo" },
    { href: "#monte-seu-pc", label: "Monte seu PC" },
    { href: "#curadoria", label: "Curadoria" },
    { href: "#parceiros", label: "Parceiros" },
    { href: "/contato", label: "Contato" },
  ];

  const whatsappUrl = `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent("Olá! Vim pelo site da Cyber.")}`;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--color-border-on-dark)]">
      <div className="container-narrow">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-cyber-blue)] flex items-center justify-center">
              <span className="display text-white text-lg font-bold">C</span>
            </div>
            <span className="hidden sm:inline display text-base font-bold text-[var(--color-text-on-dark)]">
              Cyber <span className="text-[var(--color-cyber-blue)]">Informática</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-[var(--color-text-on-dark-muted)] hover:text-[var(--color-text-on-dark)] transition-colors rounded-md"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-3">
            <span className="badge badge-b2b">Atende lojistas</span>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ minHeight: "auto", padding: "0.5rem 1rem", fontSize: "0.8125rem" }}
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 text-[var(--color-text-on-dark)]"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile nav */}
        {open && (
          <nav className="md:hidden py-4 border-t border-[var(--color-border-on-dark)]">
            <div className="flex flex-col gap-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-[var(--color-text-on-dark-muted)] hover:text-[var(--color-text-on-dark)] hover:bg-white/5 rounded-md"
                >
                  {item.label}
                </Link>
              ))}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary mt-3 w-full"
              >
                <MessageCircle size={18} />
                WhatsApp
              </a>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}