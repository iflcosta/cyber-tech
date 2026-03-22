import { Instagram, Facebook } from "lucide-react";
import Header from "@/components/Header";
import Showroom from "@/components/Showroom";

export const metadata = {
  title: "Catálogo de Produtos | Cyber Informática",
  description: "Navegue pelo nosso catálogo premium de Workstations de IA, PC Gamers de alto desempenho e Hardware Elite.",
};

export default function ProdutosPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-primary)] pt-20">
      <Header />
      
      <div className="py-24">
        <Showroom />
      </div>

      <footer className="py-20 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] text-center relative overflow-hidden red-line-top mt-auto">
        <div className="absolute inset-0 hero-texture opacity-50" />
        <div className="container mx-auto px-4 relative z-10">
          <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-[0.3em] mb-4">
            &copy; {new Date().getFullYear()} CYBER INFORMÁTICA - BRAGANÇA PAULISTA
          </p>
          <p className="text-[var(--text-secondary)] text-[9px] font-mono uppercase tracking-widest mb-8">
            Sólida. Técnica. Confiável.
          </p>
          <div className="flex justify-center gap-6 text-[var(--text-secondary)]">
            <a href="https://instagram.com/cyberinformatica" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-primary)] transition-colors">
              <Instagram size={20} />
            </a>
            <a href="https://facebook.com/cyberinformatica" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-primary)] transition-colors">
              <Facebook size={20} />
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
