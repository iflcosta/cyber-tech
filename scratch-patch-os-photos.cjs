/**
 * scratch-patch-os-photos.cjs
 *
 * Script de patch manual para associar as 3 fotos da sessão s_670g_yt5a
 * à OS-2026-0003 (id: 26f97f35-6c0f-471f-acd8-9c73c396fe1f) diretamente
 * via Supabase service_role (bypassa RLS), sem depender de autenticação
 * web do endpoint /api/admin/os/photos.
 *
 * USO:
 *   node scratch-patch-os-photos.cjs
 *
 * REQUER:
 *   .env.local com NEXT_PUBLIC_SUPABASE_CRM_URL e SUPABASE_CRM_SERVICE_ROLE_KEY
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const OS_ID = '26f97f35-6c0f-471f-acd8-9c73c396fe1f';
const SESSION_PHOTOS = [
  'https://avfcsuyackxiaglldyvo.supabase.co/storage/v1/object/public/equipment-photos/sync-s_670g_yt5a-1790637181917-yhb1n.jpg',
  'https://avfcsuyackxiaglldyvo.supabase.co/storage/v1/object/public/equipment-photos/sync-s_670g_yt5a-1790637197145-5edr7.jpg',
  'https://avfcsuyackxiaglldyvo.supabase.co/storage/v1/object/public/equipment-photos/sync-s_670g_yt5a-1790637220116-l2ine.jpg',
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_CRM_URL;
  const serviceKey = process.env.SUPABASE_CRM_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('[PATCH] ERRO: Faltam NEXT_PUBLIC_SUPABASE_CRM_URL e/ou SUPABASE_CRM_SERVICE_ROLE_KEY no .env.local');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('[PATCH] Buscando OS:', OS_ID);
  const { data: osData, error: fetchErr } = await supabase
    .from('service_orders')
    .select('id, equipment_photos, created_by')
    .eq('id', OS_ID)
    .maybeSingle();

  if (fetchErr) {
    console.error('[PATCH] Erro ao buscar OS:', fetchErr.message);
    process.exit(1);
  }
  if (!osData) {
    console.error('[PATCH] OS não encontrada com id:', OS_ID);
    process.exit(1);
  }

  console.log('[PATCH] OS encontrada. Fotos atuais:', osData.equipment_photos);

  const currentPhotos = Array.isArray(osData.equipment_photos) ? osData.equipment_photos : [];
  const newPhotos = Array.from(new Set([...currentPhotos, ...SESSION_PHOTOS]));

  console.log('[PATCH] Novo array de fotos:', newPhotos);

  const { error: updateErr } = await supabase
    .from('service_orders')
    .update({ equipment_photos: newPhotos })
    .eq('id', OS_ID);

  if (updateErr) {
    console.error('[PATCH] Erro ao atualizar equipment_photos:', updateErr.message);
    process.exit(1);
  }

  console.log('[PATCH] equipment_photos atualizado com sucesso!');

  // Registra evento no histórico se tiver created_by
  if (osData.created_by) {
    const { error: evtErr } = await supabase.from('service_order_events').insert({
      service_order_id: OS_ID,
      event_type: 'note_added',
      note: 'Fotos da sessao s_670g_yt5a associadas manualmente via script de patch (3 fotos).',
      author_id: osData.created_by,
    });
    if (evtErr) {
      console.warn('[PATCH] Aviso: falha ao inserir evento de histórico:', evtErr.message);
    } else {
      console.log('[PATCH] Evento de histórico registrado com sucesso.');
    }
  } else {
    console.warn('[PATCH] OS sem created_by — evento de histórico pulado.');
  }

  console.log('[PATCH] Patch concluido para OS-2026-0003!');
}

main().catch((err) => {
  console.error('[PATCH] Erro inesperado:', err);
  process.exit(1);
});
