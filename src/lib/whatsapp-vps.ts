/**
 * Cliente de Integração com a Evolution API v2 na VPS da Cyber Informática
 * VPS: http://148.113.247.44:8085
 * Instância: cyber-loja
 */

const VPS_URL = process.env.CYBER_VPS_WA_URL || 'http://148.113.247.44:8085';
const VPS_API_KEY = process.env.CYBER_VPS_WA_KEY || 'cyber_wa_sec_2026_braganca_ifl';
const INSTANCE_NAME = process.env.CYBER_VPS_WA_INSTANCE || 'cyber-loja';

export type OSStatusType =
  | 'created'
  | 'awaiting_approval'
  | 'approved'
  | 'in_progress'
  | 'waiting_part'
  | 'qa_testing'
  | 'ready'
  | 'delivered'
  | 'canceled';

interface SendOSNotificationParams {
  customerPhone: string;
  customerName: string;
  osNumber: string | number;
  osId: string;
  status: OSStatusType;
  equipmentBrand?: string | null;
  equipmentModel?: string | null;
  amount?: number | null;
}

function cleanPhone(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (!digits.startsWith('55')) digits = `55${digits}`;
  return digits;
}

function fmtBRL(val: number): string {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function buildOSMessage(params: SendOSNotificationParams): string {
  const {
    customerName,
    osNumber,
    osId,
    status,
    equipmentBrand,
    equipmentModel,
    amount,
  } = params;

  const equip = [equipmentBrand, equipmentModel].filter(Boolean).join(' ') || 'Equipamento';
  const cleanCode = String(osNumber).replace(/^#/, '');
  const trackUrl = `https://www.cyberinformatica.tech/status?q=${cleanCode || osId}`;

  switch (status) {
    case 'created':
      return (
        `Olá, *${customerName}*! 👋\n\n` +
        `Confirmamos a entrada do seu *${equip}* na *Cyber Informática* (OS #${cleanCode}).\n\n` +
        `Nosso laboratório já iniciou o procedimento de vistoria física e triagem pericial.\n\n` +
        `📸 Você pode acompanhar as fotos da entrada e o laudo em tempo real pelo link:\n` +
        `${trackUrl}\n\n` +
        `_Cyber Informática · Rua Coronel Teófilo Leme, 967 - Centro de Bragança Paulista_`
      );

    case 'awaiting_approval':
      const amountStr = amount ? `\n💰 *Valor Orçado:* ${fmtBRL(amount)}` : '';
      return (
        `Olá, *${customerName}*! 📋\n\n` +
        `O laudo técnico e diagnóstico do seu *${equip}* (OS #${cleanCode}) foi concluído pelos nossos especialistas.${amountStr}\n\n` +
        `Por favor, acesse o link abaixo para conferir o laudo detalhado e aprovar a execução em 1 toque:\n` +
        `${trackUrl}\n\n` +
        `_Dúvidas? Pode responder diretamente a esta mensagem!_`
      );

    case 'approved':
    case 'in_progress':
      return (
        `Olá, *${customerName}*! ⚙️\n\n` +
        `Orçamento aprovado! Seu *${equip}* (OS #${cleanCode}) já entrou em bancada técnica e nossos especialistas estão executando o serviço.\n\n` +
        `Acompanhe a telemetria do serviço:\n` +
        `${trackUrl}`
      );

    case 'waiting_part':
      return (
        `Olá, *${customerName}*! 📦\n\n` +
        `Atualização da OS #${cleanCode} (*${equip}*): estamos aguardando a chegada de componente homologado para finalizar a montagem com precisão pericial.\n\n` +
        `Status atualizado no portal:\n` +
        `${trackUrl}`
      );

    case 'qa_testing':
      return (
        `Olá, *${customerName}*! 🔬\n\n` +
        `O reparo do seu *${equip}* (OS #${cleanCode}) foi concluído! Agora ele está no rack de testes de estresse térmico, estabilidade e garantia de qualidade (QA).\n\n` +
        `Assim que for liberado para entrega, você receberá a confirmação aqui!`
      );

    case 'ready':
      const totalStr = amount ? `\n💰 *Total:* ${fmtBRL(amount)} (Pix ou Cartão em até 12x)` : '';
      return (
        `🎉 *BOA NOTÍCIA, ${customerName.toUpperCase()}!*\n\n` +
        `Seu *${equip}* (OS #${cleanCode}) passou em todos os testes e está *PRONTO PARA RETIRADA*!${totalStr}\n\n` +
        `📍 *Onde retirar:*\n` +
        `Cyber Informática\n` +
        `Rua Coronel Teófilo Leme, 967 — Centro, Bragança Paulista\n` +
        `Segunda a Sexta das 09h às 18h · Sábado das 09h às 13h\n\n` +
        `🔗 *Ver laudo final e certificado de garantia CDC 90 dias:*\n` +
        `${trackUrl}\n\n` +
        `Agradecemos a confiança! 🚀`
      );

    case 'delivered':
      return (
        `Olá, *${customerName}*! ✅\n\n` +
        `Confirmamos a entrega do seu *${equip}* (OS #${cleanCode}).\n\n` +
        `Seu serviço conta com a *Garantia Legal CDC de 90 dias*. Guarde o link do seu certificado digital:\n` +
        `${trackUrl}\n\n` +
        `Qualquer dúvida ou suporte, nossa equipe está sempre à disposição!`
      );

    default:
      return (
        `Olá, *${customerName}*! Informamos que o status da sua OS #${cleanCode} (*${equip}*) foi atualizado para *${status}*.\n\n` +
        `Acompanhe em tempo real:\n${trackUrl}`
      );
  }
}

export async function sendWhatsAppMessage(toPhone: string, message: string): Promise<{ success: boolean; error?: string }> {
  try {
    const formattedPhone = cleanPhone(toPhone);
    const endpoint = `${VPS_URL}/message/sendText/${INSTANCE_NAME}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: VPS_API_KEY,
      },
      body: JSON.stringify({
        number: formattedPhone,
        text: message,
        options: {
          delay: 1200,
          presence: 'composing',
          linkPreview: true,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `VPS Error ${res.status}: ${errText}` };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function notifyCustomerOS(params: SendOSNotificationParams): Promise<{ success: boolean; error?: string }> {
  if (!params.customerPhone) {
    return { success: false, error: 'Telefone do cliente ausente' };
  }

  const msg = buildOSMessage(params);
  return sendWhatsAppMessage(params.customerPhone, msg);
}
