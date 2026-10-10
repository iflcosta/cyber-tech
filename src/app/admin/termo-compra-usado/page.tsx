import Link from 'next/link';
import { getAuthedProfile } from '@/app/admin/lib/auth';
import { formatDateBR } from '@/app/admin/lib/datetime';
import { UsedDevicePurchaseManager, PurchaseRecord } from './UsedDevicePurchaseManager';

export const dynamic = 'force-dynamic';

export default async function TermoCompraUsadoPage() {
  const { supabase, user, profile } = await getAuthedProfile();
  if (!user) return null;

  const currentUserName = profile?.full_name ?? 'Operador';

  // Busca compras de usados já registradas
  const { data: purchasesData } = await supabase
    .from('used_device_purchases')
    .select(`
      *,
      registrar:profiles!used_device_purchases_registered_by_fkey(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  const purchases = (purchasesData ?? []) as unknown as PurchaseRecord[];

  return (
    <div className="space-y-6">
      <UsedDevicePurchaseManager
        purchases={purchases}
        currentUserId={user.id}
        currentUserName={currentUserName}
      />
    </div>
  );
}
