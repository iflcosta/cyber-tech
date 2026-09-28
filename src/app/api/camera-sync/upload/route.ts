import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_CRM_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://avfcsuyackxiaglldyvo.supabase.co';
  const key =
    process.env.SUPABASE_CRM_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_CRM_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = (formData.get('token') as string)?.trim();
    const file = formData.get('file') as File | null;

    if (!token || token.length < 6) {
      return NextResponse.json({ error: 'Token de sessão inválido.' }, { status: 400 });
    }
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Configuração do Supabase indisponível.' }, { status: 500 });
    }

    const ext = file.name?.split('.').pop() || 'jpg';
    const fileName = `sync-${token}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Upload para o bucket equipment-photos
    const { error: uploadError } = await supabase.storage
      .from('equipment-photos')
      .upload(fileName, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.warn('Aviso: upload direto no storage falhou:', uploadError.message);
      return NextResponse.json({ error: uploadError.message }, { status: 403 });
    }

    // 2. Obter URL pública
    const { data: pubData } = supabase.storage.from('equipment-photos').getPublicUrl(fileName);
    const photoUrl = pubData.publicUrl;

    // 3. Registrar na sessão do camera_sync_sessions
    let sessionOsId: string | null = null;
    try {
      const { data: session } = await supabase
        .from('camera_sync_sessions')
        .select('*')
        .eq('session_token', token)
        .maybeSingle();

      sessionOsId = session?.os_id ?? null;

      const existingPhotos: string[] = Array.isArray(session?.photos) ? session.photos : [];
      if (!existingPhotos.includes(photoUrl)) {
        existingPhotos.push(photoUrl);
      }

      await supabase.from('camera_sync_sessions').upsert(
        {
          session_token: token,
          photos: existingPhotos,
          status: 'active',
          updated_at: new Date().toISOString(),
          expires_at: session?.expires_at || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
        { onConflict: 'session_token' }
      );
    } catch (dbErr) {
      console.warn('Aviso: falha ao atualizar camera_sync_sessions:', dbErr);
    }

    // 4. Se a sessão está vinculada a uma OS, atualizar equipment_photos da OS
    if (sessionOsId) {
      try {
        // Busca OS atual para obter equipment_photos e created_by
        const { data: osData, error: osFetchErr } = await supabase
          .from('service_orders')
          .select('equipment_photos, created_by')
          .eq('id', sessionOsId)
          .maybeSingle();

        if (osFetchErr) {
          console.warn('[upload] Aviso: falha ao buscar OS para atualizar fotos:', osFetchErr.message);
        } else if (osData) {
          const currentOsPhotos: string[] = Array.isArray(osData.equipment_photos)
            ? osData.equipment_photos
            : [];
          const createdBy: string | null = osData.created_by ?? null;

          if (!currentOsPhotos.includes(photoUrl)) {
            const newOsPhotos = [...currentOsPhotos, photoUrl];

            // Atualiza equipment_photos
            const { error: updateErr } = await supabase
              .from('service_orders')
              .update({ equipment_photos: newOsPhotos })
              .eq('id', sessionOsId);

            if (updateErr) {
              console.warn('[upload] Aviso: falha ao atualizar equipment_photos da OS:', updateErr.message);
            } else {
              // Registra evento no histórico (só se tiver author_id)
              if (createdBy) {
                const { error: evtErr } = await supabase.from('service_order_events').insert({
                  service_order_id: sessionOsId,
                  event_type: 'note_added',
                  note: 'Foto registrada via Cyber Camera Sync (celular)',
                  author_id: createdBy,
                });
                if (evtErr) {
                  console.warn('[upload] Aviso: falha ao inserir service_order_events:', evtErr.message);
                }
              } else {
                console.warn('[upload] Aviso: OS sem created_by — evento de histórico pulado para OS', sessionOsId);
              }
            }
          }
        }
      } catch (osErr) {
        console.warn('[upload] Aviso: erro inesperado ao atualizar OS com foto do celular:', osErr);
      }
    }

    return NextResponse.json({ success: true, photoUrl });
  } catch (err) {
    console.error('Erro na rota de upload de camera sync:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Erro interno no processamento do upload.' },
      { status: 500 }
    );
  }
}
