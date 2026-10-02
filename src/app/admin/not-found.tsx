import Link from 'next/link';

/**
 * 404 dentro do /admin — cai aqui quando notFound() é chamado (ex:
 * OS/venda/pedido de peça com id que não existe mais) em vez da
 * página genérica sem marca do Next.
 */
export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md border-2 border-zinc-950 bg-white p-6 text-center shadow-xs">
        <p className="text-3xl">🔍</p>
        <h1 className="mt-2 font-mono text-lg font-black uppercase text-zinc-950">Não encontrado</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Esse registro não existe ou foi removido.
        </p>
        <div className="mt-4">
          <Link
            href="/admin/os"
            className="inline-block bg-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            Voltar pro início
          </Link>
        </div>
      </div>
    </div>
  );
}
