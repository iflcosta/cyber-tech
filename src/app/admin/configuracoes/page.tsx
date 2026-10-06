import { redirect } from 'next/navigation';
import { getAuthedProfile } from '@/app/admin/lib/auth';
import { ConfiguracoesClient } from './ConfiguracoesClient';

export const dynamic = 'force-dynamic';

export default async function ConfiguracoesPage() {
  const { supabase, user, profile } = await getAuthedProfile();
  if (!user) {
    redirect('/admin/login');
  }

  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, can_delete, active, commission_rate, created_at')
    .order('role', { ascending: false })
    .order('full_name');

  const userName = profile?.full_name ?? user.email?.split('@')[0] ?? 'Operador';
  const roleLabel = profile?.role === 'owner' ? 'Dono / Administrador' : 'Técnico Bancada';
  const isOwner = profile?.role === 'owner';

  return (
    <ConfiguracoesClient
      userName={userName}
      userRole={roleLabel}
      isOwner={isOwner}
      currentUserId={user.id}
      initialProfiles={allProfiles ?? []}
    />
  );
}
