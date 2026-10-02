'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Error boundary do /admin inteiro. Sem isso, qualquer erro não
 * tratado numa Server Component (Supabase fora do ar, dado
 * inesperado) derrubava a tela de crash genérica do Next — sem
 * marca, sem explicação, sem jeito de voltar sem apertar "voltar" do
 * navegador.
 *
 * Precisa ser client component — é a exigência do Next pra
 * error.tsx (roda no boundary do React, que só existe no client).
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Loga no console do navegador (visível em runtime logs da
    // Vercel via captura de erro do lado do cliente, se configurado).
    console.error('[admin] erro não tratado:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md border-2 border-zinc-950 bg-white p-6 text-center shadow-xs">
        <p className="text-3xl">⚠️</p>
        <h1 className="mt-2 font-mono text-lg font-black uppercase text-zinc-950">Algo deu errado</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Não conseguimos carregar essa página. Pode ter sido uma falha momentânea de
          conexão com o banco — tente novamente.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-zinc-400">Ref: {error.digest}</p>
        )}
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="bg-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            Tentar de novo
          </button>
          <Link
            href="/admin/os"
            className="border border-zinc-300 bg-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-800 hover:bg-zinc-100 transition cursor-pointer"
          >
            Voltar pro início
          </Link>
        </div>
      </div>
    </div>
  );
}
