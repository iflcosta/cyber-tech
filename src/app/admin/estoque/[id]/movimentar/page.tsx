import { redirect } from 'next/navigation';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { MovementForm } from './MovementForm';

export const dynamic = 'force-dynamic';

export default async function NewMovementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await getAuthedUser();
  if (!user) redirect('/admin/login');

  const { data: item } = await supabase
    .from('stock_items')
    .select('id, name, current_stock, min_stock, unit_price')
    .eq('id', id)
    .single();

  if (!item) redirect('/admin/estoque');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Movimentar estoque</h1>
        <p className="text-sm text-slate-500">
          {item.name} · atual: <strong>{item.current_stock}</strong>
        </p>
      </div>
      <MovementForm
        stockItemId={item.id}
        itemName={item.name}
        currentStock={item.current_stock}
        defaultUnitPrice={item.unit_price}
        currentUserId={user.id}
      />
    </div>
  );
}
