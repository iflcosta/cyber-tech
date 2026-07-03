"use client";
import { MessageCircle } from "lucide-react";

import TrackedWhatsAppLink from "./TrackedWhatsAppLink";
import { brand } from "@/lib/brand";

/**
 * WhatsAppButton — FAB fixo (canto inferior direito)
 * Mensagem pré-formatada com link wa.me/
 * Tracking: dispara evento gtag `click_whatsapp` ao clicar.
 */
export default function WhatsAppButton() {
  const message = "Olá! Vim pelo site da Cyber e gostaria de falar com a curadoria técnica.";

  return (
    <TrackedWhatsAppLink
      phone={brand.whatsapp}
      message={message}
      source="fab"
      className="whatsapp-fab"
      ariaLabel="Abrir WhatsApp da Cyber Informática"
    >
      <MessageCircle size={26} />
    </TrackedWhatsAppLink>
  );
}