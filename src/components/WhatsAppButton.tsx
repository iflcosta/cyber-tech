"use client";
import { MessageCircle } from "lucide-react";
import { brand } from "@/lib/brand";

/**
 * WhatsAppButton — FAB fixo (canto inferior direito)
 * Mensagem pré-formatada com link wa.me/
 */
export default function WhatsAppButton() {
  const message = encodeURIComponent("Olá! Vim pelo site da Cyber e gostaria de falar com a curadoria técnica.");
  const url = `https://wa.me/${brand.whatsapp}?text=${message}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-fab"
      aria-label="Abrir WhatsApp da Cyber Informática"
    >
      <MessageCircle size={26} />
    </a>
  );
}