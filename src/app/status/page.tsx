import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StatusTrackerClient from './StatusTrackerClient';

export const metadata = {
  title: 'Consultar Ordem de Serviço | Cyber Informática — Bragança Paulista',
  description:
    'Consulte em tempo real o andamento do seu equipamento, fotos de entrada, orçamento detalhado e certificado de garantia legal CDC de 90 dias na Cyber Informática.',
  robots: 'noindex, nofollow',
};

export default function StatusPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-zinc-100 text-zinc-950 pt-14 pb-20">
        <Suspense
          fallback={
            <div className="max-w-5xl mx-auto px-4 py-16 text-center">
              <div className="inline-block h-8 w-8 animate-spin border-2 border-zinc-300 border-t-zinc-950" />
              <p className="mt-4 font-mono text-xs uppercase tracking-widest text-zinc-500">
                Consultando o status da sua Ordem de Serviço...
              </p>
            </div>
          }
        >
          <StatusTrackerClient />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
