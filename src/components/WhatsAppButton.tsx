"use client";

import { brand } from "@/lib/brand";
import { trackWhatsAppClick } from "@/lib/tracking";
import { ArrowUpRight, Cpu } from "lucide-react";

export default function WhatsAppButton() {
  const handleClick = () => {
    trackWhatsAppClick("floating_button");
  };

  const whatsappUrl = `https://wa.me/55${brand.whatsapp}?text=${encodeURIComponent(
    "Olá! Vim pelo site da Cyber Informática e gostaria de um orçamento ou informação sobre computadores/manutenção."
  )}`;

  return (
    <>
      {/* Desktop Sharp Monochrome Floating Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="hidden md:inline-flex fixed bottom-6 right-6 z-40 items-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white border-2 border-white px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_#000000] transition-colors no-print"
        aria-label="Falar com a loja pelo WhatsApp"
      >
        <span>WhatsApp Balcão</span>
        <ArrowUpRight className="w-4 h-4" />
      </a>

      {/* Mobile Sticky Bottom Conversion Bar (0px radius, Preto/Cinza/Branco) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#09090b]/95 backdrop-blur-md border-t border-zinc-800 p-2.5 grid grid-cols-2 gap-2 no-print">
        <a
          href="/#showroom"
          className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-100 font-mono text-[11px] font-bold uppercase tracking-wider py-3 px-3 flex items-center justify-center gap-1.5"
        >
          <Cpu className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span>Showroom PC</span>
        </a>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="bg-white hover:bg-zinc-200 text-black font-mono text-[11px] font-bold uppercase tracking-wider py-3 px-3 flex items-center justify-center gap-1"
        >
          <span>WhatsApp Loja</span>
          <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
        </a>
      </div>
    </>
  );
}