import Link from "next/link";
import { Instagram, Facebook, ArrowUpRight } from "lucide-react";

import { brand } from "@/lib/brand";
import TrackedWhatsAppLink from "./TrackedWhatsAppLink";
import CyberLogo from "./CyberLogo";

const TELAS_URL = "https://telas.cyberinformatica.tech";

/**
 * Footer — Cyber Informática (Monocromático Preto, Cinza e Branco & Google Ads Safe)
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#09090b] border-t border-zinc-800 py-16 mt-auto text-zinc-400 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4 pb-12 border-b border-zinc-800">
          {/* Brand + Resumo */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <CyberLogo height={32} variant="dark" />
            </Link>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Há 10 anos no Centro de Bragança Paulista. Computadores montados à pronta-entrega, manutenção e upgrades no térreo e laboratório próprio de placas de vídeo e troca só do vidro mantendo sua tela original no 2º andar.
            </p>
            <div className="inline-block font-mono text-[11px] font-bold uppercase tracking-wider text-white border border-zinc-700 bg-zinc-900 px-3 py-1">
              GARANTIA LEGAL CDC 90 DIAS
            </div>
          </div>

          {/* Contato e Localização */}
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white mb-4">
              ENDEREÇO & HORÁRIO
            </h3>
            <ul className="space-y-2.5 text-xs text-zinc-300 font-mono">
              <li>
                {brand.address.street}, {brand.address.number} — Centro
                <br />
                {brand.address.city} / SP
              </li>
              <li className="text-zinc-400">{brand.openingHours}</li>
              <li>
                <TrackedWhatsAppLink
                  phone={brand.whatsapp}
                  message="Olá! Vim pelo site da Cyber Informática."
                  source="footer"
                  className="text-white hover:text-zinc-300 underline underline-offset-4 font-bold transition-colors"
                  ariaLabel="Abrir WhatsApp da Cyber Informática"
                >
                  WhatsApp: (11) 95436-9269
                </TrackedWhatsAppLink>
              </li>
            </ul>
          </div>

          {/* Links Rápidos */}
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white mb-4">
              NAVEGAÇÃO
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/#showroom" className="text-zinc-300 hover:text-white transition-colors">
                  Showroom de PCs à Pronta-Entrega
                </Link>
              </li>
              <li>
                <Link href="/#pc-builder" className="text-zinc-300 hover:text-white transition-colors">
                  PC Builder (Montar Sob Medida)
                </Link>
              </li>
              <li>
                <Link href="/#servicos" className="text-zinc-300 hover:text-white transition-colors">
                  Bancada Técnica & Serviços
                </Link>
              </li>
              <li>
                <Link href="/#estrutura" className="text-zinc-300 hover:text-white transition-colors">
                  Estrutura Física (2 Andares)
                </Link>
              </li>
              <li>
                <Link href="/status" className="text-white font-mono font-bold uppercase hover:underline transition-colors">
                  Consultar Ordem de Serviço &rarr;
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

          {/* Laboratório 2º Andar & B2B */}
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white mb-4">
              2º ANDAR // TROCA DE VIDRO & GPUS
            </h3>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Trincou só o vidro do celular mas a imagem e o toque funcionam? Trocamos apenas o vidro externo preservando sua tela original de fábrica, além de reparo eletrônico de Placas de Vídeo (GPUs).
            </p>
            <a
              href={TELAS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-black bg-white hover:bg-zinc-200 transition-colors px-4 py-2.5 uppercase tracking-wider"
            >
              <span>Ver Troca de Vidro (Tela Original)</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Disclaimer Legal & Google Ads Compliance */}
        <div className="pt-8 text-[11px] text-zinc-500 leading-relaxed space-y-4">
          <p>
            <strong className="text-zinc-400">Conformidade Legal & Marcas Registradas:</strong> A Cyber Informática é um comércio varejista de equipamentos de informática e laboratório técnico independente com sede física em Bragança Paulista/SP. Todas as marcas e modelos citados pertencem aos seus respectivos fabricantes e são mencionados exclusivamente para referência de compatibilidade. Nossos serviços contam com garantia legal de 90 dias nos termos do Artigo 26 do Código de Defesa do Consumidor (Lei Federal nº 8.078/1990).
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-900 font-mono">
            <p className="text-zinc-500">
              © {year} {brand.name} — RUA CORONEL TEÓFILO LEME, 967, CENTRO, BRAGANÇA PAULISTA - SP.
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