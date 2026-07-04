import Link from "next/link";
import { Instagram, Facebook, MessageCircle, MapPin, Clock, Phone } from "lucide-react";

import { brand } from "@/lib/brand";
import TrackedWhatsAppLink from "./TrackedWhatsAppLink";

const TELAS_URL = "https://telas.cyberinformatica.tech";

/**
 * Footer — Cyber Informática
 * Copy B2B-friendly do reboot/01-plano-estruturante.md (seção 6.7)
 *
 * Mudanças aplicadas:
 *   - Removido link "/admin/crm" do público (vazava CRM interno)
 *   - WhatsApp agora passa por TrackedWhatsAppLink (UTM tracking + gtag event)
 *   - Adicionado cross-link para o site telas.cyberinformatica.tech
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[var(--bg-secondary)] border-t border-[var(--color-border-on-dark)] py-16 mt-auto">
      <div className="container-narrow">
        <div className="grid gap-8 md:grid-cols-4 mb-10">
          {/* Brand + tagline */}
          <div className="md:col-span-1">
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
                <TrackedWhatsAppLink
                  phone={brand.whatsapp}
                  message="Olá! Vim pelo site da Cyber."
                  source="footer"
                  className="hover:text-[var(--color-text-on-dark)] transition-colors"
                  ariaLabel="Abrir WhatsApp da Cyber Informática"
                >
                  WhatsApp
                </TrackedWhatsAppLink>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="flex-shrink-0 text-[var(--color-cyber-blue)]" />
                <a
                  href={`tel:+${brand.phone}`}
                  className="hover:text-[var(--color-text-on-dark)] transition-colors"
                  aria-label="Ligar para a Cyber Informática"
                >
                  (11) 95436-9269
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
              <li><Link href="#curadoria" className="text-[var(--color-text-on-dark-muted)] hover:text-[var(--color-text-on-dark)] transition-colors">Curadoria</Link></li>
              <li><Link href="#monte-seu-pc" className="text-[var(--color-text-on-dark-muted)] hover:text-[var(--color-text-on-dark)] transition-colors">Monte seu PC</Link></li>
              <li><Link href="#parceiros" className="text-[var(--color-text-on-dark-muted)] hover:text-[var(--color-text-on-dark)] transition-colors">Para parceiros</Link></li>
              <li>
                <Link href="/politica-privacidade" className="text-[var(--color-text-on-dark-muted)] hover:text-[var(--color-text-on-dark)] transition-colors">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="/termos-de-uso" className="text-[var(--color-text-on-dark-muted)] hover:text-[var(--color-text-on-dark)] transition-colors">
                  Termos de Uso
                </Link>
              </li>
            </ul>
          </div>

          {/* Unidade de laminação OCA (cross-link) */}
          <div>
            <h3 className="display text-sm font-bold mb-3 text-[var(--color-text-on-dark)]">
              Unidade Industrial
            </h3>
            <p className="text-xs text-[var(--color-text-on-dark-muted)] mb-3 leading-relaxed">
              Centro de Remanufatura e Laminação OCA Industrial de Displays — B2B e pessoa física.
            </p>
            <a
              href={TELAS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-cyber-blue)] hover:text-[var(--color-cyber-blue-hover)] transition-colors"
            >
              telas.cyberinformatica.tech
              <span aria-hidden className="text-xs">↗</span>
            </a>
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