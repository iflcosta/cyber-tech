import Link from 'next/link';
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-black uppercase tracking-tight text-zinc-950">Nova OS</h1>
          <p className="font-mono text-xs uppercase tracking-wider text-zinc-500">Em 3 passos: cliente → aparelho → defeito</p>
        </div>
        <Link
          href="/admin/os"
          className="inline-flex items-center gap-1.5 border-2 border-zinc-950 bg-white px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition shadow-2xs"
        >
          ← Voltar para OS
        </Link>
      </div>
      <NewOSForm
        currentUserId={user.id}
        initialCustomer={initialCustomer}
      />
    </div>
  );
}
