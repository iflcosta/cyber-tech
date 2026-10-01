import { notFound, redirect } from 'next/navigation';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { StockLabelClient } from './StockLabelClient';

export const dynamic = 'force-dynamic';

export default async function StockItemLabelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await getAuthedUser();
  if (!user) redirect('/admin/login');

  const { data: item } = await supabase
    .from('stock_items')
    .select('*')
    .eq('id', id)
    .single();

  if (!item) notFound();

  const d = new Date();
  const monthYear = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;

  return (
    <StockLabelClient
      item={{
        id: item.id,
        name: item.name,
        brand: item.brand,
        model: item.model,
        category: item.category,
        ean13: item.ean13,
        internal_sku: item.internal_sku,
        unit_price: Number(item.unit_price ?? 0),
        shelf_location: item.shelf_location ?? null,
        notes: item.notes ?? null,
      }}
      monthYear={monthYear}
    />
  );
}