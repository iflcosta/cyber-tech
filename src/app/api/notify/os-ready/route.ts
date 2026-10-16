import { NextRequest, NextResponse } from 'next/server';
import { createCRMServiceClient } from '@/app/admin/lib/supabase/service';
import { getWhatsAppProvider } from '@/lib/whatsapp';
import { getAuthedUser } from '@/app/admin/lib/auth';

export const dynamic = 'force-dynamic';

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

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
        repair_notes,
        equipment_type,
        equipment_brand,
        equipment_model,
        estimated_value,
        labor_cost,
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

    // 2. Monta o texto de notificação de aparelho pronto
    const customerFirstName = customer?.name?.split(' ')[0] || 'Cliente';
    const shortId = so.short_id || `OS-${so.os_number || so.id.slice(0, 6)}`;
    const osNumberStr = String(so.os_number || shortId);
    const equipName =
      [so.equipment_brand, so.equipment_model].filter(Boolean).join(' ') ||
      so.equipment_type ||
      'Equipamento';

    const grandTotal = Number(so.estimated_value || so.labor_cost || 0);
    const totalMsg = grandTotal > 0 ? `💰 *Valor total:* ${fmtBRL(grandTotal)}` : '';
    const repairNote = so.repair_notes?.trim();
    const serviceMsg = repairNote ? `🔧 *Serviço realizado:* ${repairNote}` : '';
    const trackingUrl = `https://www.cyberinformatica.tech/status?os=${encodeURIComponent(so.os_number || so.short_id || osNumberStr)}`;

    const messageLines = [
      `Olá, *${customerFirstName}*! 👋`,
      `Seu aparelho já está *pronto para retirada* em nossa bancada na *Cyber Informática*! 🚀`,
      '',
      `📋 *OS:* ${shortId}`,
      `💻 *Equipamento:* ${equipName}`,
    ];

    if (serviceMsg) messageLines.push(serviceMsg);
    if (totalMsg) messageLines.push(totalMsg);

    messageLines.push(
      '',
      `Você pode conferir o laudo técnico completo e detalhes pelo link:`,
      `👉 ${trackingUrl}`,
      '',
      `📍 *Cyber Informática* · Rua Cel. Teófilo Leme 967, Centro`,
      `⏰ Horário: Seg a Sex 09h às 18h | Sáb 09h às 13h`,
      `Qualquer dúvida, é só nos responder por aqui!`,
    );

    const message = messageLines.join('\n');

    // 3. Dispara via Evolution API (ou provider ativo na VPS)
    const provider = getWhatsAppProvider();
    const result = await provider.send(phone, message);

    // 4. Registra evento no histórico da OS
    try {
      await supabase.from('service_order_events').insert({
        service_order_id: so.id,
        event_type: 'note_added',
        note: `Notificação de "Aparelho Pronto" enviada automaticamente via WhatsApp para ${phone} (Msg ID: ${result.messageId}).`,
        author_id: user.id,
      });
    } catch (evtErr) {
      console.warn('[Notify OS Ready] Falha ao registrar evento na timeline:', evtErr);
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      phone,
    });
  } catch (err) {
    console.error('[Notify OS Ready] Erro ao disparar notificação de WhatsApp:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Erro interno ao disparar notificação.' },
      { status: 500 },
    );
  }
}
