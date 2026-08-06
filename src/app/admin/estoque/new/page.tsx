import { redirect } from 'next/navigation';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { NewItemForm } from './NewItemForm';

export const dynamic = 'force-dynamic';

export default async function NewStockItemPage() {
  const { supabase, user } = await getAuthedUser();
  if (!user) redirect('/admin/login');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Novo item de estoque</h1>
        <p className="text-sm text-slate-500">
          Cadastre peças/produtos vendidos na loja. Estoque inicial entra depois via movimentação.
        </p>
      </div>
      <NewItemForm />
    </div>
  );
}
