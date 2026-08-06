import { redirect } from 'next/navigation';
import { createCRMServerClient } from '@/app/admin/lib/supabase/server';
import { NewPartOrderForm } from './NewPartOrderForm';

export const dynamic = 'force-dynamic';

export default async function NewPartOrderPage() {
  const supabase = await createCRMServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, name, phone')
    .eq('active', true)
    .order('name');

  // OS ativas (ainda não entregues/canceladas) pra vincular o pedido
  const { data: openOrders } = await supabase
    .from('service_orders')
    .select('id, short_id, os_number, customer:customers(name)')
    .not('status', 'in', '(delivered,cancelled)')
    .order('created_at', { ascending: false })
    .limit(100);

  type OpenOrderRow = {
    id: string;
    short_id: string | null;
    os_number: string | null;
    customer: { name: string } | null;
  };

  const normalizedOrders = ((openOrders ?? []) as unknown as OpenOrderRow[]).map((o) => ({
    id: o.id,
    label: o.short_id ?? o.os_number ?? o.id.slice(0, 8),
    customerName: o.customer?.name ?? '(cliente removido)',
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Novo Pedido de Peça</h1>
        <p className="text-sm text-slate-500">
          Registre depois de já ter fechado com o fornecedor (peça, variação e valor confirmados).
        </p>
      </div>
      <NewPartOrderForm
        currentUserId={user.id}
        suppliers={suppliers ?? []}
        serviceOrders={normalizedOrders}
      />
    </div>
  );
}
