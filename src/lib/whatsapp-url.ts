/**
 * whatsapp-url.ts — Helper para construir links wa.me com UTM tracking.
 *
 * Estratégia de tracking do WhatsApp:
 *   1. UTMs da URL de entrada (utm_source, utm_medium, utm_campaign) são capturados
 *      pelo componente <UTMTracker /> e salvos em sessionStorage + cookie.
 *   2. Este helper lê esses UTMs (se houver) e anexa no link wa.me + na mensagem
 *      pré-pronta, para que o time de vendas veja a origem no inbox.
 *   3. O onClick em <TrackedWhatsAppLink /> dispara um evento gtag `click_whatsapp`
 *      para o Google Ads registrar como conversão.
 *
 * Por que anexar UTMs no link wa.me se o WhatsApp descarta?
 *   Para auditoria e logs do navegador — quando o usuário abre wa.me no WhatsApp
 *   Web, a URL aparece com os parâmetros. É um fingerprint útil.
 */

export interface BuildWhatsAppUrlParams {
  phone: string;
  message: string;
  /** Onde no site o link foi clicado: fab | header | footer | hero | contato | parceiros */
  source: string;
  /** utm_source externo (instagram, facebook, google, etc) — detectado pelo UTMTracker */
  externalSource?: string;
  /** utm_medium externo (bio, stories, cpc, etc) */
  externalMedium?: string;
  /** utm_campaign externo */
  externalCampaign?: string;
}

/**
 * Constrói URL wa.me com UTMs anexados.
 * Funciona tanto server-side (sem UTMs externos) quanto client-side (com UTMs do sessionStorage).
 */
export function buildWhatsAppUrl(params: BuildWhatsAppUrlParams): string {
  const { phone, message, source, externalSource, externalMedium, externalCampaign } = params;

  // Anexa linha de origem na mensagem (aparece no inbox do time de vendas)
  const originTag = externalSource
    ? `\n\nOrigem: ${externalSource}${externalMedium ? `/${externalMedium}` : ''}${externalCampaign ? ` (${externalCampaign})` : ''}`
    : '';
  const finalMessage = `${message}${originTag}`;

  // Monta query string com text + UTMs (wa.me aceita múltiplos params além de text)
  const queryParams = new URLSearchParams();
  queryParams.set("text", finalMessage);
  queryParams.set("utm_source", externalSource || "site");
  queryParams.set("utm_medium", source);
  queryParams.set("utm_campaign", externalCampaign || "organico");

  return `https://wa.me/${phone}?${queryParams.toString()}`;
}

/**
 * Lê UTMs do sessionStorage (client-side only).
 * Retorna undefined se rodando no server.
 */
export function readUtmFromSession(): {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
} {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem("cyber_utm");
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}