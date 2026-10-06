import { NextResponse } from 'next/server';
import { getAuthedProfile } from '@/app/admin/lib/auth';

export async function POST(req: Request) {
  try {
    const { supabase, user, profile } = await getAuthedProfile();
    if (!user || profile?.role !== 'owner') {
      return NextResponse.json(
        { error: 'Acesso negado: apenas proprietários podem alterar permissões.' },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { targetUserId, role, canDelete, active, commissionRate } = body;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'targetUserId é obrigatório.' },
        { status: 400 },
      );
    }

    const numCommission =
      commissionRate !== undefined && commissionRate !== null && commissionRate !== ''
        ? Number(commissionRate)
        : null;

    const { data, error } = await supabase.rpc('admin_update_profile', {
      p_target_id: targetUserId,
      p_role: role ?? null,
      p_can_delete: typeof canDelete === 'boolean' ? canDelete : null,
      p_active: typeof active === 'boolean' ? active : null,
      p_commission_rate: numCommission,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: data });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Erro interno ao atualizar permissões.' },
      { status: 500 },
    );
  }
}
