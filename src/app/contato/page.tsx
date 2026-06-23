import { Metadata } from "next";
import { ContactForm } from "./ContactForm";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contato | Cyber Informática",
  description:
    "Fale com a curadoria técnica da Cyber Informática. PC, notebook, celular e parceria com lojistas. Resposta rápida no WhatsApp.",
  alternates: { canonical: "https://cyberinformatica.tech/contato" },
  openGraph: {
    title: "Contato | Cyber Informática",
    description:
      "Fale com a curadoria técnica da Cyber Informática. PC, notebook, celular e parceria com lojistas.",
    url: "https://cyberinformatica.tech/contato",
    images: [
      {
        url: "https://cyberinformatica.tech/og-image.png",
        width: 1200,
        height: 630,
        alt: "Contato - Cyber Informática",
        type: "image/png",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
};

const whatsappUrl = `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(
  "Olá! Vim pelo site da Cyber e gostaria de falar com a curadoria técnica."
)}`;

export default function ContatoPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-primary)] pt-24 pb-20">
      <div className="container-narrow">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Coluna esquerda — texto + contato */}
          <div>
            <span className="kicker">Contato</span>
            <h1 className="display mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-text-on-dark)] mb-6">
              Fala com a curadoria técnica.
            </h1>
            <p className="text-base sm:text-lg text-[var(--color-text-on-dark-muted)] leading-relaxed mb-8">
              Manda o que você precisa — orçamento, dúvida, parceria. Respondemos rápido, sem script e sem chatbot.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-cyber-blue)]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-[var(--color-cyber-blue)] font-bold">📍</span>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-[var(--color-text-on-dark-muted)] font-semibold mb-1">
                    Endereço
                  </p>
                  <p className="text-[var(--color-text-on-dark)]">
                    {brand.address.street}, {brand.address.number}
                    <br />
                    {brand.address.city} / SP · {brand.address.coords.lat.toFixed(4)}, {brand.address.coords.lng.toFixed(4)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-cyber-blue)]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-[var(--color-cyber-blue)] font-bold">🕘</span>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-[var(--color-text-on-dark-muted)] font-semibold mb-1">
                    Horário
                  </p>
                  <p className="text-[var(--color-text-on-dark)]">{brand.openingHours}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-cyber-blue)]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-[var(--color-cyber-blue)] font-bold">✉</span>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-[var(--color-text-on-dark-muted)] font-semibold mb-1">
                    E-mail
                  </p>
                  <p className="text-[var(--color-text-on-dark)]">
                    <a href={`mailto:${brand.email}`} className="hover:text-[var(--color-cyber-blue)] transition-colors">
                      {brand.email}
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost inline-flex"
            >
              Prefere WhatsApp? Clica aqui →
            </a>
          </div>

          {/* Coluna direita — form */}
          <div>
            <ContactForm />
          </div>
        </div>
      </div>
    </main>
  );
}