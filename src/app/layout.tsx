import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { brand } from "@/lib/brand";
import UTMTracker from "@/components/UTMTracker";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});


const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});
const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#09090b",
};

export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  title: "Cyber Informática | " + brand.slogan,
  description: brand.description,
  keywords: brand.seo.keywords,
  authors: [{ name: "Cyber Informática" }],
  creator: "Cyber Informática",
  publisher: "Cyber Informática",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: { canonical: brand.url },
  openGraph: {
    title: "Cyber Informática — Computadores à Pronta-Entrega & Laboratório em Bragança",
    description: brand.description,
    url: brand.url,
    siteName: "Cyber Informática",
    images: [
      {
        url: `${brand.url}/opengraph-image?v=2026`,
        width: 1200,
        height: 630,
        alt: "Cyber Informática — Computadores à Pronta-Entrega, Manutenção Rápida e Laboratório Próprio em Bragança Paulista.",
        type: "image/png",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cyber Informática — Computadores à Pronta-Entrega & Laboratório em Bragança",
    description: brand.description,
    images: [`${brand.url}/opengraph-image?v=2026`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Google Ads ID fixo (já estava em produção). GA4 ID via env var.
  const GOOGLE_ADS_ID = "AW-18041073028";
  const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID; // ex: "G-XXXXXXXXXX"

  return (
    <html lang="pt-BR">
      <head>
        {/* UTM tracker — popula sessionStorage a partir dos params da URL */}
        <UTMTracker />

        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#09090b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Google Ads Tag (gtag.js) */}
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GOOGLE_ADS_ID}');
              ${GA4_ID ? `gtag('config', '${GA4_ID}');` : ""}
            `,
          }}
        />

        {/* Meta Pixel Code - só carrega se PIXEL_ID estiver configurado */}
        {process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}');
                  fbq('track', 'PageView');
              `,
              }}
            />
            <noscript>
              {/* Pixel de rastreamento (Facebook), não é imagem de conteúdo —
                  next/image não se aplica aqui (precisa de JS pra otimizar,
                  isso é justamente o fallback pra quando JS está desligado). */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                height="1"
                width="1"
                alt=""
                style={{ display: 'none' }}
                src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}&ev=PageView&noscript=1`}
              />
            </noscript>
          </>
        )}

        {/* Schema Markup for Local SEO - LocalBusiness + ComputerStore + FAQ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": ["LocalBusiness", "ComputerStore", "ComputerRepairService", "Store"],
                "@id": `${brand.url}/#business`,
                "name": "Cyber Informática",
                "alternateName": "Cyber Info Bragança",
                "description": brand.description,
                "url": brand.url,
                "logo": `${brand.url}/logo.png`,
                "image": `${brand.url}/og-image.png`,
                "telephone": "+55-11-95436-9269",
                "email": "contato@cyberinformatica.tech",
                "priceRange": "$$",
                "currenciesAccepted": "BRL",
                "paymentAccepted": "Cash, Credit Card, Debit Card, PIX, Bank Transfer",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "Rua Coronel Teófilo Leme, 967",
                  "addressLocality": "Bragança Paulista",
                  "addressRegion": "SP",
                  "postalCode": "12900-000",
                  "addressCountry": "BR"
                },
                "geo": {
                  "@type": "GeoCoordinates",
                  "latitude": brand.address.coords.lat,
                  "longitude": brand.address.coords.lng
                },
                "openingHoursSpecification": [
                  {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                    "opens": "09:00",
                    "closes": "18:00"
                  },
                  {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": "Saturday",
                    "opens": "09:00",
                    "closes": "13:00"
                  }
                ],
                "hasOfferCatalog": {
                  "@type": "OfferCatalog",
                  "name": "Serviços Técnicos e Laboratório Cyber",
                  "itemListElement": [
                    {
                      "@type": "Offer",
                      "itemOffered": {
                        "@type": "Service",
                        "name": "Manutenção Pericial de Computadores e Notebooks",
                        "description": "Diagnóstico rápido, upgrades de SSD NVMe, limpeza térmica profunda e reparo de hardware."
                      }
                    },
                    {
                      "@type": "Offer",
                      "itemOffered": {
                        "@type": "Service",
                        "name": "Laboratório de Telas e Microeletrônica OCA",
                        "description": "Restauração óptica em autoclave industrial e câmara de vácuo preservando o display original."
                      }
                    },
                    {
                      "@type": "Offer",
                      "itemOffered": {
                        "@type": "Service",
                        "name": "Montagem de Workstations e PCs Gamers",
                        "description": "Curadoria de hardware, cable management profissional e testes de estresse FurMark e AIDA64."
                      }
                    }
                  ]
                },
                "sameAs": [
                  brand.social.instagram,
                  brand.social.facebook
                ],
                "potentialAction": {
                  "@type": "ReserveAction",
                  "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent("Olá! Vim pelo site da Cyber e gostaria de falar com a curadoria técnica.")}`,
                    "inLanguage": "pt-BR"
                  },
                  "name": "Falar com a curadoria"
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "A Cyber Informática atende cliente final e lojistas?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Sim. Atendemos o cliente final com curadoria técnica e montagem, e lojistas e assistências parceiras com indicação técnica e pós-venda estendido."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Onde fica a loja?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Rua Coronel Teófilo Leme, 967, Bragança Paulista / SP. Sem agendamento, basta ir à loja."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Quais produtos a Cyber vende?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "PC sob medida (gamer e workstation), notebook, celular e acessórios, com curadoria técnica em todas as categorias."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Como posso falar com a curadoria técnica?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Pelo WhatsApp (11) 95436-9269 ou diretamente na loja."
                    }
                  }
                ]
              }
            ])
          }}
        />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased font-body selection:bg-white selection:text-black bg-[var(--bg-primary)] text-[var(--color-text-on-dark)]`}>
        {children}
      </body>
    </html>
  );
}