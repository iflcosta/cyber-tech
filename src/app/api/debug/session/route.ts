import { NextResponse } from 'next/server';
import { createCRMServerClient } from '@/app/admin/crm/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createCRMServerClient();
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr) {
      return NextResponse.json({ error: 'auth_error', message: userErr.message }, { status: 401 });
    }
    if (!user) {
      return NextResponse.json({ error: 'not_logged_in' }, { status: 401 });
    }
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (profErr) {
      return NextResponse.json({ error: 'profile_error', message: profErr.message, user_id: user.id, user_email: user.email });
    }
    const canEdit = profile?.role === 'owner' || profile?.role === 'technician';
    return NextResponse.json({
      user: { id: user.id, email: user.email },
      profile,
      canEdit,
      decision: canEdit ? 'StatusQuickActions DEVE renderizar' : 'StatusQuickActions retorna null (canEdit=false)',
    });
  } catch (e) {
    return NextResponse.json({ error: 'exception', message: (e as Error).message, stack: (e as Error).stack }, { status: 500 });
  }
}
