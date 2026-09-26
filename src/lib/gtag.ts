export function trackWhatsAppClick(source: string): void {
  if (typeof window !== "undefined") {
    const w = window as Window & { gtag?: (...args: unknown[]) => void };
    if (typeof w.gtag === "function") {
      w.gtag("event", "click_whatsapp", {
        event_category: "engagement",
        event_label: source,
        transport_type: "beacon",
      });
    }
  }
}
