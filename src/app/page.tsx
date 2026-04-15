import { Instagram } from "lucide-react";
import { Suspense } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CyberIA from "@/components/CyberIA";
import PCBuilder from "@/components/PCBuilder";
import Showroom from "@/components/Showroom";
import Reviews from "@/components/Reviews";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      <Header />
      <Suspense fallback={<div className="h-screen bg-[var(--bg-primary)]" />}>
        <Hero />
      </Suspense>
      <Suspense fallback={<div className="min-h-[400px]" />}>
        <Showroom />
      </Suspense>
      <PCBuilder />
      <Reviews />

      <Suspense fallback={null}>
        <CyberIA />
      </Suspense>

      <footer className="py-20 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] text-center relative overflow-hidden red-line-top">
        <div className="absolute inset-0 hero-texture opacity-50" />
        <div className="container mx-auto px-4 relative z-10">
          <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-[0.3em] mb-4">
            &copy; 2026 CYBER INFORMÁTICA - BRAGANÇA PAULISTA
          </p>
          <p className="text-[var(--text-secondary)] text-[9px] font-mono uppercase tracking-widest mb-8">
            Sólida. Técnica. Confiável.
          </p>
          <div className="flex justify-center gap-6 text-[var(--text-secondary)]">
            <a href="https://instagram.com/cyberinfo.brag" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-primary)] transition-colors">
              <Instagram size={20} />
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
