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
      <div className="w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-3xl">⚠️</p>
        <h1 className="mt-2 text-lg font-bold text-red-900">Algo deu errado</h1>
        <p className="mt-2 text-sm text-red-800">
          Não conseguimos carregar essa página. Pode ter sido uma falha momentânea de
          conexão com o banco — tenta de novo.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-red-400">Ref: {error.digest}</p>
        )}
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Tentar de novo
          </button>
          <Link
            href="/admin/os"
            className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Voltar pro início
          </Link>
        </div>
      </div>
    </div>
  );
}
