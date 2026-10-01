import { notFound, redirect } from 'next/navigation';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { ProductLabelPrintView } from './ProductLabelPrintView';

export const dynamic = 'force-dynamic';

export default async function ProductLabelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await getAuthedUser();
  if (!user) redirect('/admin/login');

  const { data: item } = await supabase
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
    .eq('id', id)
    .single();

  if (!item) notFound();

  return (
    <div className="py-6 px-4">
      <ProductLabelPrintView item={item} />
    </div>
  );
}
