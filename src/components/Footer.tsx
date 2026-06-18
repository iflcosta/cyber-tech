import Link from "next/link";
import { Instagram, Facebook, MessageCircle, MapPin, Clock } from "lucide-react";

import { brand } from "@/lib/brand";

/**
 * Footer — Cyber Informática
 * Copy B2B-friendly do reboot/01-plano-estruturante.md (seção 6.7)
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[var(--bg-secondary)] border-t border-[var(--color-border-on-dark)] py-16 mt-auto">
      <div className="container-narrow">
        <div className="grid gap-8 md:grid-cols-3 mb-10">
          {/* Brand + tagline */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-cyber-blue)] flex items-center justify-center">
                <span className="display text-white text-lg font-bold">C</span>
              </div>
              <span className="display text-base font-bold text-[var(--color-text-on-dark)]">
                Cyber <span className="text-[var(--color-cyber-blue)]">Informática</span>
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-on-dark-muted)] leading-relaxed">
              Loja técnica de PC, notebook e celular. Atendemos cliente final com curadoria e montagem — e lojistas e assistências parceiras com indicação técnica e pós-venda estendido.
            </p>
          </div>

          {/* Contato */}
          <div>
            <h3 className="display text-sm font-bold mb-3 text-[var(--color-text-on-dark)]">
              Contato
            </h3>
            <ul className="space-y-2 text-sm text-[var(--color-text-on-dark-muted)]">
              <li className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 flex-shrink-0 text-[var(--color-cyber-blue)]" />
                <span>{brand.address.street}, {brand.address.number}<br />{brand.address.city} / SP</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock size={16} className="flex-shrink-0 text-[var(--color-cyber-blue)]" />
                <span>{brand.openingHours}</span>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle size={16} className="flex-shrink-0 text-[var(--color-cyber-blue)]" />
                <a
                  href={`https://wa.me/${brand.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--color-text-on-dark)] transition-colors"
                >
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>

          {/* Links úteis */}
          <div>
            <h3 className="display text-sm font-bold mb-3 text-[var(--color-text-on-dark)]">
              Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="#catalogo" className="text-[var(--color-text-on-dark-muted)] hover:text-[var(--color-text-on-dark)] transition-colors">Catálogo</Link></li>
              <li><Link href="#monte-seu-pc" className="text-[var(--color-text-on-dark-muted)] hover:text-[var(--color-text-on-dark)] transition-colors">Monte seu PC</Link></li>
              <li><Link href="#curadoria" className="text-[var(--color-text-on-dark-muted)] hover:text-[var(--color-text-on-dark)] transition-colors">Curadoria</Link></li>
              <li><Link href="#parceiros" className="text-[var(--color-text-on-dark-muted)] hover:text-[var(--color-text-on-dark)] transition-colors">Para parceiros</Link></li>
              <li><Link href="/admin/crm" className="text-[var(--color-text-on-dark-muted)] hover:text-[var(--color-text-on-dark)] transition-colors">CRM interno</Link></li>
            </ul>
          </div>
        </div>

        {/* Linha final */}
        <div className="pt-8 border-t border-[var(--color-border-on-dark)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--color-text-on-dark-muted)]">
            © {year} {brand.name} — Bragança Paulista
          </p>
          <div className="flex items-center gap-3 text-[var(--color-text-on-dark-muted)]">
            <a
              href={brand.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="hover:text-[var(--color-text-on-dark)] transition-colors"
            >
              <Instagram size={20} />
            </a>
            <a
              href={brand.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="hover:text-[var(--color-text-on-dark)] transition-colors"
            >
              <Facebook size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}