import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StatusTrackerClient from './StatusTrackerClient';

export const metadata = {
  title: 'Portal do Cliente // Cyber Informática',
  description: 'Acompanhe em tempo real o status, laudo fotográfico, telemetria e garantia da sua Ordem de Serviço na Cyber Informática.',
  robots: 'noindex, nofollow',
};

export default function StatusPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#09090b] text-zinc-100 pt-24 pb-20">
        <Suspense fallback={
          <div className="container-narrow py-16 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <p className="mt-4 font-mono text-xs uppercase tracking-widest text-zinc-400">Carregando telemetria de bancada...</p>
          </div>
        }>
          <StatusTrackerClient />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
