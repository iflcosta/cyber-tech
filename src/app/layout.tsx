import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { brand } from "@/lib/brand";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a1929",
};

export const metadata: Metadata = {
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
  alternates: { canonical: "https://cyberinformatica.tech" },
  openGraph: {
    title: "Cyber Informática | " + brand.slogan,
    description: brand.description,
    url: "https://cyberinformatica.tech",
    siteName: "Cyber Informática",
    images: [
      {
        url: "https://cyberinformatica.tech/og-image.png",
        width: 1200,
        height: 630,
        alt: "Cyber Informática — Loja técnica em Bragança Paulista. PC, notebook, celular com curadoria e montagem.",
        type: "image/png",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cyber Informática | " + brand.slogan,
    description: brand.description,
    images: ["https://cyberinformatica.tech/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a1929" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Google Ads Tag */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-18041073028" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-18041073028');
            `,
          }}
        />
        {/* Meta Pixel Code - so carrega se PIXEL_ID estiver configurado */}
        {process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=f.createElement(e);t.async=!0;
                t.src=v;s=f.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}');
                fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>
        )}

        {/* Schema Markup for Local SEO - LocalBusiness + ComputerStore + FAQ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": ["LocalBusiness", "ComputerStore", "Store"],
                "@id": "https://cyberinformatica.tech/#business",
                "name": "Cyber Informática",
                "alternateName": "Cyber Info Bragança",
                "description": brand.description,
                "url": "https://cyberinformatica.tech",
                "logo": "https://cyberinformatica.tech/logo.png",
                "image": "https://cyberinformatica.tech/og-image.png",
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
      <body className={`${inter.variable} ${spaceGrotesk.variable} antialiased font-body bg-[var(--bg-primary)] text-[var(--color-text-on-dark)]`}>
        {children}
      </body>
    </html>
  );
}