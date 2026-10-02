import { redirect } from 'next/navigation';
import { getAuthedProfile } from '@/app/admin/lib/auth';
import { ConfiguracoesClient } from './ConfiguracoesClient';

export const dynamic = 'force-dynamic';

export default async function ConfiguracoesPage() {
  const { user, profile } = await getAuthedProfile();
  if (!user) {
    redirect('/admin/login');
  }

  const userName = profile?.full_name ?? user.email?.split('@')[0] ?? 'Operador';
  const roleLabel = profile?.role === 'owner' ? 'Dono / Administrador' : 'Técnico Bancada';

  return <ConfiguracoesClient userName={userName} userRole={roleLabel} />;
}
