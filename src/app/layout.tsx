import type { Metadata, Viewport } from "next";
import { Rajdhani, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";

const rajdhani = Rajdhani({
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rajdhani",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

import { brand } from "@/lib/brand";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1A1A1A",
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
        url: "https://cyberinformatica.tech/og-image.jpg", // We can place an og-image later, but define the link for now
        width: 1200,
        height: 630,
        alt: "Cyber Informática - Hardware de Alta Performance",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cyber Informática | " + brand.slogan,
    description: brand.description,
    images: ["https://cyberinformatica.tech/og-image.jpg"],
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
        <meta name="theme-color" content="#1A1A1A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Meta Pixel Code */}
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                  }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }

              // Captura o prompt de instalação
              window.deferredPrompt = null;
              window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                window.deferredPrompt = e;
                // Dispara um evento customizado que componentes React podem ouvir
                window.dispatchEvent(new Event('pwa-installable'));
              });
            `,
          }}
        />
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
               "telephone": "+5511997457718",
               "priceRange": "$$$",
               "address": {
                 "@type": "PostalAddress",
                 "streetAddress": "Bragança Paulista",
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
      <body
        className={`${rajdhani.variable} ${dmSans.variable} ${jetbrainsMono.variable} antialiased font-sans bg-[var(--bg-primary)] text-[var(--text-primary)]`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
