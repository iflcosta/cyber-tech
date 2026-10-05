import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { NewItemForm } from './NewItemForm';

export const dynamic = 'force-dynamic';

export default async function NewStockItemPage({
  searchParams,
}: {
  searchParams: Promise<{ showroom?: string }>;
}) {
  const { user } = await getAuthedUser();
  if (!user) redirect('/admin/login');
  const params = await searchParams;
  const initialShowroom = params.showroom === '1';

  return (
    <div className="space-y-4">
      {/* Banner de atalho para o módulo especializado de Aparelhos */}
      <div className="border-2 border-emerald-600 bg-emerald-50 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase text-emerald-800 bg-emerald-200/60 px-1.5 py-0.5">
            Módulo Especializado de Venda
          </span>
          <p className="font-mono text-xs text-zinc-900 mt-1">
            Vai cadastrar um <strong>Notebook</strong>, <strong>Computador Desktop</strong> ou <strong>Celular / iPhone</strong> para venda com ficha técnica e etiqueta própria?
          </p>
        </div>
        <Link
          href="/admin/estoque/novo-aparelho"
          className="shrink-0 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider transition text-center"
        >
          💻📱 Abrir Módulo de Aparelhos →
        </Link>
      </div>

      <div className="border-b-2 border-zinc-950 pb-3">
        <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-950">
          {initialShowroom ? 'Publicar Computador no Showroom' : 'Novo Item de Estoque (Peças & Acessórios)'}
        </h1>
        <p className="font-mono text-xs text-zinc-600">
          {initialShowroom
            ? 'Cadastre um computador recém-montado para aparecer imediatamente na vitrine Showroom do site.'
            : 'Cadastre peças, cabos ou periféricos vendidos na loja.'}
        </p>
      </div>
      <NewItemForm initialShowroom={initialShowroom} />
    </div>
  );
}
