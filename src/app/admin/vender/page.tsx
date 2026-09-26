import { redirect } from 'next/navigation';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { PDV } from './PDV';

export const dynamic = 'force-dynamic';

export default async function VenderPage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user } = await getAuthedUser();
  if (!user) redirect('/admin/login');

  // Carrega todos os itens ativos pra lookup local (autocomplete do EAN/nome)
  // Em loja pequena (~centenas de itens) isso cabe num bundle so.
  const { data: items } = await supabase
    .from('stock_items')
    .select('id, ean13, internal_sku, shelf_location, name, brand, model, unit_price, current_stock, min_stock')
    .eq('active', true)
    .order('name');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();

  // Veio da ficha do cliente ("+ Nova venda") — pré-vincula a venda a
  // esse cliente, sem precisar buscar de novo na hora de finalizar.
  let initialCustomer;
  if (params.customer) {
    const { data: c } = await supabase
      .from('customers')
      .select('id, name, phone')
      .eq('id', params.customer)
      .single();
    if (c) initialCustomer = c;
  }

  return (
    <PDV
      items={items ?? []}
      currentUserId={user.id}
      currentUserName={profile?.full_name ?? '—'}
      initialCustomer={initialCustomer}
    />
  );
}
