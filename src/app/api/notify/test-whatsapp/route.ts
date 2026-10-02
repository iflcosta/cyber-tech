import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppProvider } from '@/lib/whatsapp';
import { getAuthedUser } from '@/app/admin/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';

    if (!phone) {
      return NextResponse.json({ error: 'Telefone é obrigatório.' }, { status: 400 });
    }

    const provider = getWhatsAppProvider();
    const testMessage = [
      '🔔 *Teste de Conexão - Cyber Informática ERP*',
      '',
      'Esta é uma mensagem de teste enviada a partir das Configurações do Sistema.',
      'Sua integração com a Evolution API está conectada e operando com sucesso! 🚀',
      '',
      `🕒 ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
    ].join('\n');

    const result = await provider.send(phone, testMessage);

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      phone,
    });
  } catch (err) {
    console.error('[Test WhatsApp] Erro:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Erro ao enviar mensagem de teste.' },
      { status: 500 },
    );
  }
}
