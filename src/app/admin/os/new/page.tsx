import { redirect } from 'next/navigation';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { NewOSForm } from './NewOSForm';

export const dynamic = 'force-dynamic';

export default async function NewOSPage() {
  const { supabase, user } = await getAuthedUser();
  if (!user) redirect('/admin/login');

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role, active')
    .eq('active', true)
    .order('full_name');

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
      />
    </div>
  );
}
