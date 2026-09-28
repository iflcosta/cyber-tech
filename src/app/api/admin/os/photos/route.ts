import { NextRequest, NextResponse } from 'next/server';
import { createCRMServiceClient } from '@/app/admin/lib/supabase/service';
import { createCRMServerClient } from '@/app/admin/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticação do usuário via cookie de sessão
    const serverClient = await createCRMServerClient();
    const {
      data: { user },
    } = await serverClient.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para continuar.' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { osId, photos, action, photoUrl } = body as {
      osId: string;
      photos?: string[];
      action: 'set' | 'add' | 'remove';
      photoUrl?: string;
    };

    if (!osId || typeof osId !== 'string') {
      return NextResponse.json({ error: 'osId é obrigatório.' }, { status: 400 });
    }
    if (!action || !['set', 'add', 'remove'].includes(action)) {
      return NextResponse.json(
        { error: "action deve ser 'set', 'add' ou 'remove'." },
        { status: 400 },
      );
    }

    // Usa service client para bypassar RLS
    const supabase = createCRMServiceClient();

    // Busca estado atual da OS (equipment_photos e created_by)
    const { data: osData, error: fetchErr } = await supabase
      .from('service_orders')
      .select('equipment_photos, created_by')
      .eq('id', osId)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json(
        { error: `Erro ao buscar OS: ${fetchErr.message}` },
        { status: 500 },
      );
    }
    if (!osData) {
      return NextResponse.json({ error: 'OS não encontrada.' }, { status: 404 });
    }

    const currentPhotos: string[] = Array.isArray(osData.equipment_photos)
      ? osData.equipment_photos
      : [];
    const createdBy: string | null = osData.created_by ?? null;

    // Calcula novo array conforme action
    let newPhotosList: string[];
    let eventNote: string;

    if (action === 'set') {
      if (!Array.isArray(photos)) {
        return NextResponse.json(
          { error: "Campo 'photos' (array) é obrigatório para action='set'." },
          { status: 400 },
        );
      }
      newPhotosList = photos;
      eventNote = 'Fotos da vistoria atualizadas via sistema.';
    } else if (action === 'add') {
      if (!photoUrl || typeof photoUrl !== 'string') {
        return NextResponse.json(
          { error: "Campo 'photoUrl' é obrigatório para action='add'." },
          { status: 400 },
        );
      }
      newPhotosList = currentPhotos.includes(photoUrl)
        ? currentPhotos
        : [...currentPhotos, photoUrl];
      eventNote = 'Foto adicionada à vistoria da OS.';
    } else {
      // action === 'remove'
      if (!photoUrl || typeof photoUrl !== 'string') {
        return NextResponse.json(
          { error: "Campo 'photoUrl' é obrigatório para action='remove'." },
          { status: 400 },
        );
      }
      newPhotosList = currentPhotos.filter((p) => p !== photoUrl);
      eventNote = 'Foto removida da vistoria da OS.';
    }

    // Atualiza equipment_photos na OS
    const { error: updateErr } = await supabase
      .from('service_orders')
      .update({ equipment_photos: newPhotosList })
      .eq('id', osId);

    if (updateErr) {
      return NextResponse.json(
        { error: `Erro ao atualizar fotos da OS: ${updateErr.message}` },
        { status: 500 },
      );
    }

    // Registra evento no histórico — não quebra se falhar
    if (createdBy) {
      try {
        await supabase.from('service_order_events').insert({
          service_order_id: osId,
          event_type: 'note_added',
          note: eventNote,
          author_id: createdBy,
        });
      } catch (evtErr) {
        console.warn('[photos/route] Aviso: falha ao inserir service_order_events:', evtErr);
      }
    } else {
      console.warn(
        '[photos/route] Aviso: OS sem created_by — evento de histórico pulado para OS',
        osId,
      );
    }

    return NextResponse.json({ success: true, photos: newPhotosList });
  } catch (err) {
    console.error('[photos/route] Erro interno:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Erro interno ao processar fotos.' },
      { status: 500 },
    );
  }
}
