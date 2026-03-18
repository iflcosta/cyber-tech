import { brand } from './brand';

interface WhatsAppMessage {
  to: string;
  templateName?: string;
  body?: string;
  variables?: Record<string, string>;
}

/**
 * WhatsApp Business API Integration Stub
 */
export async function sendWhatsAppMessage({ to, body, templateName, variables }: WhatsAppMessage) {
  console.log(`[WhatsApp API] Sending message to ${to}`);
  
  if (templateName) {
    console.log(`[WhatsApp API] Using template: ${templateName}`, variables);
  } else {
    console.log(`[WhatsApp API] Body: ${body}`);
  }

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  return {
    success: true,
    messageId: `wa_msg_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString()
  };
}

/**
 * Formats a message for the "Service Ready" notification
 */
export function formatReadyMessage(customerName: string, voucherCode: string, equipment: string) {
  return `Olá ${customerName}! Tudo bem? Seu ${equipment} (Voucher: ${voucherCode}) está pronto para retirada na Cyber Informática.\n\nHorário de funcionamento: ${brand.openingHours}\nLocal: ${brand.address.street}, ${brand.address.number}`;
}

/**
 * Formats a message for "New Maintenance Request" (Internal/Owner)
 */
export function formatInternalOrderMessage(order: any) {
  return `🚀 *NOVA ORDEM DE MANUTENÇÃO*\n\n*Voucher:* ${order.voucher_code}\n*Cliente:* ${order.customer_name}\n*Equipamento:* ${order.equipment_type}\n*Problema:* ${order.problem_description}\n\nVerifique o painel administrativo para mais detalhes.`;
}
