import { getAuthedProfile } from '@/app/admin/lib/auth';
import { CashSessionManager, CashSession, CashEntry } from './CashSessionManager';

export const dynamic = 'force-dynamic';

export default async function CaixaPage() {
  const { supabase, user, profile } = await getAuthedProfile();
  if (!user) return null;

  const currentUserName = profile?.full_name ?? 'Operador';
  const isOwnerOrManager = Boolean(profile?.can_delete) || profile?.role === 'owner';

  // 1. Busca sessão ativa de caixa aberta
  const { data: openSessionData } = await supabase
    .from('cash_sessions')
    .select(`
      *,
      opener:profiles!cash_sessions_opened_by_fkey(full_name),
      closer:profiles!cash_sessions_closed_by_fkey(full_name)
    `)
    .eq('status', 'open')
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 2. Se houver sessão aberta, busca as movimentações da sessão
  let activeEntries: CashEntry[] = [];
  if (openSessionData) {
    const { data: entries } = await supabase
      .from('cash_entries')
      .select(`
        *,
        author:profiles!cash_entries_author_id_fkey(full_name)
      `)
      .eq('session_id', openSessionData.id)
      .order('created_at', { ascending: true });

    activeEntries = (entries ?? []) as unknown as CashEntry[];
  }

  // 3. Busca histórico das últimas 10 sessões fechadas
  const { data: recentSessionsData } = await supabase
    .from('cash_sessions')
    .select(`
      *,
      opener:profiles!cash_sessions_opened_by_fkey(full_name),
      closer:profiles!cash_sessions_closed_by_fkey(full_name)
    `)
    .eq('status', 'closed')
    .order('closed_at', { ascending: false })
    .limit(10);

  const activeSession = openSessionData as unknown as CashSession | null;
  const recentSessions = (recentSessionsData ?? []) as unknown as CashSession[];

  return (
    <div className="space-y-6">
      <CashSessionManager
        activeSession={activeSession}
        activeEntries={activeEntries}
        recentSessions={recentSessions}
        currentUserId={user.id}
        currentUserName={currentUserName}
        isOwnerOrManager={isOwnerOrManager}
      />
    </div>
  );
}
