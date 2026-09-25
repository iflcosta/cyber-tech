import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { ContactForm } from "./ContactForm";
import { brand } from "@/lib/brand";
import TrackedWhatsAppLink from "@/components/TrackedWhatsAppLink";
import { MapPin, Clock, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Contato | Cyber Informática",
  description:
    "Fale com a curadoria técnica da Cyber Informática. PC, notebook, celular e parceria com lojistas. Resposta rápida no WhatsApp.",
  alternates: { canonical: `${brand.url}/contato` },
  openGraph: {
    title: "Contato | Cyber Informática",
    description:
      "Fale com a curadoria técnica da Cyber Informática. PC, notebook, celular e parceria com lojistas.",
    url: `${brand.url}/contato`,
    images: [
      {
        url: `${brand.url}/og-image.png`,
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

const whatsappMessage = "Olá! Vim pelo site da Cyber e gostaria de falar com a curadoria técnica.";

export default function ContatoPage() {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${brand.address.street}, ${brand.address.number} - ${brand.address.city} - SP`
  )}`;

  return (
    <>
      <Header />
      <main id="main" className="min-h-screen bg-[var(--bg-primary)] pt-32 pb-20">
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
                    <MapPin size={18} className="text-[var(--color-cyber-blue)]" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[var(--color-text-on-dark-muted)] font-semibold mb-1">
                      Endereço
                    </p>
                    <p className="text-[var(--color-text-on-dark)]">
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[var(--color-cyber-blue)] transition-colors underline underline-offset-4 decoration-[var(--color-border-on-dark)]"
                      >
                        {brand.address.street}, {brand.address.number} — Centro
                        <br />
                        {brand.address.city} / SP · CEP 12914-070
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-cyber-blue)]/10 flex items-center justify-center flex-shrink-0">
                    <Clock size={18} className="text-[var(--color-cyber-blue)]" />
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
                    <Mail size={18} className="text-[var(--color-cyber-blue)]" />
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

              <TrackedWhatsAppLink
                phone={brand.whatsapp}
                message={whatsappMessage}
                source="contato"
                className="btn-ghost inline-flex"
                ariaLabel="Abrir WhatsApp da Cyber Informática"
              >
                Prefere WhatsApp? Clica aqui →
              </TrackedWhatsAppLink>
            </div>

            {/* Coluna direita — form */}
            <div>
              <ContactForm />
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}