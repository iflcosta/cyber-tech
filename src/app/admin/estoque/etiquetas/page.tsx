import { redirect } from 'next/navigation';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { BatchLabelPrintView } from './BatchLabelPrintView';

export const dynamic = 'force-dynamic';

export default async function BatchLabelsPage() {
  const { supabase, user } = await getAuthedUser();
  if (!user) redirect('/admin/login');

  const { data: items } = await supabase
    .from('stock_items')
    .select(`
      id,
      name,
      brand,
      model,
      category,
      ean13,
      internal_sku,
      shelf_location,
      unit_price,
      current_stock
    `)
    .eq('active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  return (
    <div className="py-6 px-4">
      <BatchLabelPrintView items={items || []} />
    </div>
  );
}
