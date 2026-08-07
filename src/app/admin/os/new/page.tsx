import { redirect } from 'next/navigation';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { NewOSForm } from './NewOSForm';

export const dynamic = 'force-dynamic';

export default async function NewOSPage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user } = await getAuthedUser();
  if (!user) redirect('/admin/login');

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role, active')
    .eq('active', true)
    .order('full_name');

  // Veio da ficha do cliente (botão "+ Nova OS") — pré-seleciona pra
  // não precisar buscar de novo o mesmo cliente que já está aberto.
  let initialCustomer;
  if (params.customer) {
    const { data: c } = await supabase
      .from('customers')
      .select('id, name, phone, email')
      .eq('id', params.customer)
      .single();
    if (c) {
      const { count } = await supabase
        .from('service_orders')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', c.id);
      initialCustomer = { ...c, osCount: count ?? 0 };
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nova OS</h1>
        <p className="text-sm text-slate-500">Em 3 passos: cliente → aparelho → defeito</p>
      </div>
      <NewOSForm
        currentUserId={user.id}
        technicians={(profiles ?? []).filter((p) => p.role === 'technician')}
        owners={(profiles ?? []).filter((p) => p.role === 'owner')}
        initialCustomer={initialCustomer}
      />
    </div>
  );
}
