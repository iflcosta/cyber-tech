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
  robots: "index, follow",
  alternates: { canonical: "https://cyberinformatica.tech" },
  openGraph: {
    title: "Cyber Informática | " + brand.slogan,
    description: brand.description,
    url: "https://cyberinformatica.tech",
    siteName: "Cyber Informática",
    images: [
      {
        url: "https://cyberinformatica.tech/api/og",
        width: 1200,
        height: 630,
        alt: "Cyber Informática — Loja técnica em Bragança Paulista",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cyber Informática | " + brand.slogan,
    description: brand.description,
    images: ["https://cyberinformatica.tech/api/og"],
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
        {/* Meta Pixel Code */}
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
              fbq('init', '${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || ''}');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || ''}&ev=PageView&noscript=1`}
          />
        </noscript>
        {/* Schema Markup for Local SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
             __html: JSON.stringify({
               "@context": "https://schema.org",
               "@type": "ComputerStore",
               "name": "Cyber Informática",
               "image": "https://cyberinformatica.tech/og-image.jpg",
               "@id": "https://cyberinformatica.tech",
               "url": "https://cyberinformatica.tech",
               "telephone": "+55 11 95436-9269",
               "priceRange": "$$$",
               "address": {
                 "@type": "PostalAddress",
                 "streetAddress": "Rua Coronel Teófilo Leme, 967",
                 "addressLocality": "Bragança Paulista",
                 "addressRegion": "SP",
                 "postalCode": "12900-000",
                 "addressCountry": "BR"
               },
               "description": brand.description
             })
          }}
        />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} antialiased font-body bg-[var(--bg-primary)] text-[var(--color-text-on-dark)]`}>
        {children}
      </body>
    </html>
  );
}