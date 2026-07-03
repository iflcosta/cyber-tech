"use client";

import { useEffect, useRef } from "react";

interface Props {
  /** Telefone no formato wa.me (apenas dígitos, com DDI) */
  phone: string;
  /** Mensagem pré-pronta que aparece no WhatsApp do cliente */
  message: string;
  /** Onde no site o link foi clicado — usado pra UTM interno */
  source: string;
  /** Classe do link — mesma que <a> normal */
  className?: string;
  /** target=_blank etc */
  target?: string;
  rel?: string;
  /** aria-label para acessibilidade */
  ariaLabel?: string;
  /** Children visuais dentro do <a> */
  children: React.ReactNode;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * TrackedWhatsAppLink — <a> pra wa.me que dispara evento gtag `click_whatsapp`
 * ao ser clicado, e enriquece a URL com UTMs externos detectados pelo UTMTracker.
 *
 * Use em qualquer lugar onde antes era um link wa.me direto. A mensagem pré-pronta
 * continua sendo enviada normalmente.
 */
export default function TrackedWhatsAppLink({
  phone,
  message,
  source,
  className,
  target = "_blank",
  rel = "noopener noreferrer",
  ariaLabel,
  children,
}: Props) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    // Lê UTMs externos do sessionStorage (definido por UTMTracker)
    let utm: Record<string, string> = {};
    try {
      const raw = sessionStorage.getItem("cyber_utm");
      if (raw) utm = JSON.parse(raw);
    } catch {
      // ignore
    }

    const originTag = utm.utm_source
      ? `\n\nOrigem: ${utm.utm_source}${utm.utm_medium ? `/${utm.utm_medium}` : ""}${utm.utm_campaign ? ` (${utm.utm_campaign})` : ""}`
      : "";
    const finalMessage = `${message}${originTag}`;

    const queryParams = new URLSearchParams();
    queryParams.set("text", finalMessage);
    queryParams.set("utm_source", utm.utm_source || "site");
    queryParams.set("utm_medium", source);
    queryParams.set("utm_campaign", utm.utm_campaign || "organico");

    const href = `https://wa.me/${phone}?${queryParams.toString()}`;
    if (ref.current) {
      ref.current.href = href;
    }
  }, [phone, message, source]);

  const handleClick = () => {
    // Dispara evento de conversão no Google Ads / GA4
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "click_whatsapp", {
        event_category: "engagement",
        event_label: source,
        transport_type: "beacon",
      });
    }
  };

  return (
    <a
      ref={ref}
      href={`https://wa.me/${phone}?text=${encodeURIComponent(message)}`}
      target={target}
      rel={rel}
      className={className}
      aria-label={ariaLabel}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}