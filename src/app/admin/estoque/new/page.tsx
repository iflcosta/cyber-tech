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
      <div className="border-b-2 border-zinc-950 pb-3">
        <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-950">
          {initialShowroom ? 'Publicar Computador no Showroom' : 'Novo Item de Estoque'}
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
