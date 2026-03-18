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
    <main className="min-h-screen bg-[#F0EFED]">
      <Header />
      <Hero />
      <Maintenance />
      <ServiceSearch />
      <Showroom />
      <PCBuilder />
      <Reviews />
      <CyberIA />

      <footer className="py-12 border-t border-[#D4D2CF] bg-white text-center">
        <p className="text-[#AAAAAA] text-[10px] font-bold uppercase tracking-[0.2em]">
          &copy; 2026 CYBER INFORMÁTICA - BRAGANÇA PAULISTA. TODOS OS DIREITOS RESERVADOS.
        </p>
      </footer>
    </main>
  );
}
