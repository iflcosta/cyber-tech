"use client";

import { useEffect } from "react";

/**
 * UTMTracker — Detecta parâmetros UTM na URL e salva em sessionStorage + cookie.
 *
 * Por quê?
 *   - Quando o usuário chega via campanha (Meta Ads, Google Ads, link de bio),
 *     a URL tem ?utm_source=instagram&utm_medium=bio&utm_campaign=verao2026.
 *   - Esses UTMs precisam ser "lembrados" enquanto ele navega no site, para
 *     serem anexados ao link do WhatsApp quando ele clicar no CTA.
 *   - sessionStorage dura a sessão (aba aberta) — suficiente pro nosso caso.
 *
 * Renderiza nada visualmente — só efeito colateral de salvar UTMs.
 */
export default function UTMTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((key) => {
      const value = params.get(key);
      if (value) utm[key] = value;
    });

    if (Object.keys(utm).length > 0) {
      try {
        sessionStorage.setItem("cyber_utm", JSON.stringify(utm));
      } catch {
        // sessionStorage indisponível (modo privado, etc) — segue sem tracking
      }
    }
  }, []);

  return null;
}