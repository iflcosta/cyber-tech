import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Maintenance from "@/components/Maintenance";
import Showroom from "@/components/Showroom";
import CyberIA from "@/components/CyberIA";
import PCBuilder from "@/components/PCBuilder";
import ServiceSearch from "@/components/ServiceSearch";
import Reviews from "@/components/Reviews";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Maintenance />
      <ServiceSearch />
      <Showroom />
      <PCBuilder />
      <Reviews />
      <CyberIA />

      {/* Footer Simples */}
      <footer className="py-8 md:py-12 border-t border-white/5 text-center text-white/20 text-sm">
        <p>&copy; 2026 Cyber Tech - Bragança Paulista. Todos os direitos reservados.</p>
      </footer>
    </main>
  );
}
