import Link from 'next/link';

/**
 * 404 dentro do /admin — cai aqui quando notFound() é chamado (ex:
 * OS/venda/pedido de peça com id que não existe mais) em vez da
 * página genérica sem marca do Next.
 */
export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center">
        <p className="text-3xl">🔍</p>
        <h1 className="mt-2 text-lg font-bold text-slate-900">Não encontrado</h1>
        <p className="mt-2 text-sm text-slate-600">
          Esse registro não existe ou foi removido.
        </p>
        <div className="mt-4">
          <Link
            href="/admin/os"
            className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Voltar pro início
          </Link>
        </div>
      </div>
    </div>
  );
}
