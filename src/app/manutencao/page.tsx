import Header from "@/components/Header";
import { Suspense } from "react";
import Maintenance from "@/components/Maintenance";
import CyberIA from "@/components/CyberIA";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assistência Técnica de Computadores | Cyber Informática",
  description: "Especialistas em reparo de notebooks, computadores e smartphones em Bragança Paulista com garantia técnica.",
  keywords: [
    "manutenção de smartphones",
    "conserto de celulares Bragança Paulista",
    "consertar tela iPhone",
    "troca de tela celular",
    "assistência técnica bateria iPhone",
    "reparo de placa mãe",
    "assistência técnica notebook Bragança",
  ],
  openGraph: {
    title: "Assistência Técnica de Computadores | Cyber Informática",
    description: "Especialistas em reparo de notebooks, computadores e smartphones em Bragança Paulista com garantia técnica.",
    url: "https://cyberinformatica.tech/manutencao",
  },
  twitter: {
    title: "Assistência Técnica de Computadores | Cyber Informática",
    description: "Especialistas em reparo de notebooks, computadores e smartphones em Bragança Paulista com garantia técnica.",
  }
};

export default function MaintenancePage() {
  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      <Header />
      <div className="pt-24">
        <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center"><div className="w-8 h-8 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" /></div>}>
          <Maintenance />
        </Suspense>
      </div>
      
      {/* SEO Section */}
      <section className="py-24 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-12">
            <div>
              <h2 className="text-3xl font-display font-bold text-[var(--text-primary)] mb-6 uppercase chrome-text">
                Assistência Técnica em Bragança Paulista
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed italic">
                Especialistas em reparo de notebooks, computadores e smartphones. Atendimento local com peças originais e garantia técnica. Oferecemos limpeza preventiva, troca de pasta térmica, reparo de carcaça, formatação e upgrade de SSD.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="p-8 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl">
                <h3 className="text-xl font-display font-bold text-[var(--accent-primary)] mb-4 uppercase">Notebooks & PCs</h3>
                <ul className="space-y-3 text-[var(--text-secondary)] text-sm font-mono">
                  <li>• Formatação com Backup</li>
                  <li>• Limpeza Interna + Thermal Paste</li>
                  <li>• Upgrade de SSD e Memória RAM</li>
                  <li>• Reparo de Placa-Mãe</li>
                  <li>• Troca de Teclados e Telas</li>
                </ul>
              </div>
              <div className="p-8 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl">
                <h3 className="text-xl font-display font-bold text-[var(--accent-primary)] mb-4 uppercase">Smartphones</h3>
                <ul className="space-y-3 text-[var(--text-secondary)] text-sm font-mono">
                  <li>• Troca de Tela Touch</li>
                  <li>• Substituição de Bateria</li>
                  <li>• Reparo em Conector de Carga</li>
                  <li>• Reparo em Placa</li>
                  <li>• Recuperação de Software</li>
                  <li>• Proteção (Películas e Capas)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 bg-[var(--bg-primary)] border-t border-[var(--border-subtle)] text-center">
        <p className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-widest">
           Cyber Informática &copy; {new Date().getFullYear()} - Bragança Paulista/SP
        </p>
      </footer>

      <Suspense fallback={null}>
        <CyberIA />
      </Suspense>
    </main>
  );
}
