import Link from "next/link";
import { Instagram, Facebook, MessageCircle, MapPin, Clock, Phone, ShieldCheck } from "lucide-react";

import { brand } from "@/lib/brand";
import TrackedWhatsAppLink from "./TrackedWhatsAppLink";
import CyberLogo from "./CyberLogo";

const TELAS_URL = "https://telas.cyberinformatica.tech";

/**
 * Footer — Cyber Informática V2 (Stealth Industrial & Google Ads Compliant)
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#09090b] border-t border-white/[0.08] py-16 mt-auto text-zinc-400 font-sans">
      <div className="container-narrow">
        <div className="grid gap-10 md:grid-cols-4 mb-12">
          {/* Brand + Manifesto */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <CyberLogo height={32} />
            </Link>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Laboratório de Engenharia e Tecnologia de Alta Precisão e Varejo de Alta Performance no Centro de Bragança Paulista. Setup pericial, montagem sob medida e microeletrônica avançada.
            </p>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded">
              <ShieldCheck size={14} />
              Garantia Legal CDC 90 Dias
            </div>
          </div>

          {/* Contato e Localização */}
          <div>
            <h3 className="display text-xs font-mono font-bold uppercase tracking-wider text-white mb-4">
              Bancada Física
            </h3>
            <ul className="space-y-2.5 text-xs text-zinc-400 font-mono">
              <li className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 flex-shrink-0 text-white" />
                <span>
                  {brand.address.street}, {brand.address.number}<br />
                  Centro, {brand.address.city} / SP
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Clock size={15} className="flex-shrink-0 text-white" />
                <span>{brand.openingHours}</span>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle size={15} className="flex-shrink-0 text-emerald-400" />
                <TrackedWhatsAppLink
                  phone={brand.whatsapp}
                  message="Olá! Vim pelo site da Cyber Informática."
                  source="footer"
                  className="hover:text-white transition-colors"
                  ariaLabel="Abrir WhatsApp da Cyber Informática"
                >
                  WhatsApp: ({brand.phone})
                </TrackedWhatsAppLink>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={15} className="flex-shrink-0 text-white" />
                <a href={`tel:+${brand.phone}`} className="hover:text-white transition-colors">
                  (11) 95436-9269
                </a>
              </li>
            </ul>
          </div>

          {/* Links e Rastreio */}
          <div>
            <h3 className="display text-xs font-mono font-bold uppercase tracking-wider text-white mb-4">
              Navegação
            </h3>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <Link href="#catalogo" className="text-zinc-400 hover:text-white transition-colors">
                  Varejo & Workstations
                </Link>
              </li>
              <li>
                <Link href="#laboratorio" className="text-zinc-400 hover:text-white transition-colors">
                  Bancada & Engenharia
                </Link>
              </li>
              <li>
                <Link href="#mezanino" className="text-zinc-400 hover:text-white transition-colors">
                  Mezanino OCA & GPU
                </Link>
              </li>
              <li>
                <Link href="#parceiros" className="text-zinc-400 hover:text-white transition-colors">
                  Canal B2B para Lojistas
                </Link>
              </li>
              <li>
                <Link href="/status" className="text-emerald-400 font-bold hover:underline transition-colors">
                  Rastrear Ordem de Serviço &rarr;
                </Link>
              </li>
              <li>
                <Link href="/politica-privacidade" className="text-zinc-500 hover:text-zinc-300 transition-colors">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="/termos-de-uso" className="text-zinc-500 hover:text-zinc-300 transition-colors">
                  Termos de Uso
                </Link>
              </li>
            </ul>
          </div>

          {/* Unidade Industrial de Laminação OCA */}
          <div>
            <h3 className="display text-xs font-mono font-bold uppercase tracking-wider text-white mb-4">
              Unidade Industrial
            </h3>
            <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
              Centro de Remanufatura e Laminação Óptica OCA Industrial em câmara a vácuo e autoclave para lojistas e clientes.
            </p>
            <a
              href={TELAS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-white hover:text-emerald-400 transition-colors bg-white/5 border border-white/10 px-3 py-2 rounded"
            >
              <span>telas.cyberinformatica.tech</span>
              <span aria-hidden className="text-xs">↗</span>
            </a>
          </div>
        </div>

        {/* Disclaimer Google Ads & Jurídico */}
        <div className="pt-8 border-t border-white/[0.08] text-[11px] font-mono text-zinc-400 leading-relaxed space-y-4">
          <p>
            <strong>Aviso de Conformidade Legal & Marcas Registradas:</strong> A Cyber Informática é um laboratório de microeletrônica e comércio varejista independente. Todas as marcas, modelos e logotipos citados (incluindo marcas de processadores, placas e dispositivos) pertencem aos seus respectivos titulares de propriedade industrial e são mencionados exclusivamente para fins de compatibilidade técnica e identificação pericial de equipamentos. Nossos serviços são executados sob rigorosos padrões de engenharia própria e regidos pela garantia legal de 90 dias prevista no Artigo 26 do Código de Defesa do Consumidor (Lei Federal nº 8.078/1990).
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5">
            <p className="text-zinc-400">
              © {year} {brand.name} — CNPJ registrado em Bragança Paulista / SP. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4 text-zinc-400">
              <a
                href={brand.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hover:text-white transition-colors"
              >
                <Instagram size={18} />
              </a>
              <a
                href={brand.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="hover:text-white transition-colors"
              >
                <Facebook size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}