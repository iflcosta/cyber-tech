import { NextRequest, NextResponse } from 'next/server';
import { createCRMServiceClient } from '@/app/admin/lib/supabase/service';
import { getWhatsAppProvider } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const osId = typeof body.osId === 'string' ? body.osId.trim() : '';

    if (!osId) {
      return NextResponse.json({ error: 'osId é obrigatório.' }, { status: 400 });
    }

    const supabase = createCRMServiceClient();

    // 1. Busca dados da OS e do cliente
    const { data: so, error: soErr } = await supabase
      .from('service_orders')
      .select(`
        id,
        short_id,
        os_number,
        reported_defect,
        equipment_type,
        equipment_brand,
        equipment_model,
        created_by,
        customer:customers(id, name, phone)
      `)
      .eq('id', osId)
      .maybeSingle();

    if (soErr || !so) {
      return NextResponse.json(
        { error: 'OS não encontrada.', details: soErr?.message },
        { status: 404 },
      );
    }

    const customerRaw = so.customer as unknown;
    const customer = (Array.isArray(customerRaw) ? customerRaw[0] : customerRaw) as {
      id: string;
      name: string;
      phone: string | null;
    } | null;
    const phone = customer?.phone?.trim();

    if (!phone) {
      return NextResponse.json({
        skipped: true,
        reason: 'Cliente sem telefone cadastrado.',
      });
    }

    // 2. Monta o texto de notificação de check-in
    const customerFirstName = customer?.name?.split(' ')[0] || 'Cliente';
    const shortId = so.short_id || `OS-${so.os_number || so.id.slice(0, 6)}`;
    const osNumberStr = String(so.os_number || shortId);
    const equipName = [so.equipment_brand, so.equipment_model]
      .filter(Boolean)
      .join(' ') || so.equipment_type || 'Equipamento';
    const defect = so.reported_defect?.trim() || 'Em análise';
    const trackingUrl = `https://www.cyberinformatica.tech/status?os=${encodeURIComponent(osNumberStr)}`;

    const message = [
      `Olá, *${customerFirstName}*! 👋`,
      `Seu equipamento já deu entrada em nossa bancada técnica na *Cyber Informática*.`,
      '',
      `📋 *OS:* ${shortId}`,
      `💻 *Equipamento:* ${equipName}`,
      `🔍 *Sintoma inicial:* ${defect}`,
      '',
      `Você pode acompanhar as fotos da carcaça, o diagnóstico e o orçamento em tempo real pelo link abaixo:`,
      `👉 ${trackingUrl}`,
      '',
      `📍 *Cyber Informática* · Rua Cel. Teófilo Leme 967, Centro`,
      `Qualquer dúvida, você pode responder diretamente por aqui!`,
    ].join('\n');

    // 3. Dispara via Evolution API (ou provider ativo)
    const provider = getWhatsAppProvider();
    const result = await provider.send(phone, message);

    // 4. Registra evento no histórico da OS
    try {
      if (so.created_by) {
        await supabase.from('service_order_events').insert({
          service_order_id: so.id,
          event_type: 'note_added',
          note: `Notificação de abertura de OS enviada via WhatsApp para ${phone} (Msg ID: ${result.messageId}).`,
          author_id: so.created_by,
        });
      }
    } catch (evtErr) {
      console.warn('[Notify OS] Falha ao registrar evento na timeline:', evtErr);
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      phone,
    });
  } catch (err) {
    console.error('[Notify OS] Erro ao disparar notificação de WhatsApp:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Erro interno ao disparar notificação.' },
      { status: 500 },
    );
  }
}
