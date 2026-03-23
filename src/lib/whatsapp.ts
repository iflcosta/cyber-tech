/**
 * @deprecated Use `@/lib/whatsapp` (the directory) directly for new code.
 * This file is kept for backwards compatibility with existing callers.
 */
import { brand } from './brand'
import { getWhatsAppProvider } from './whatsapp/index'

export { getWhatsAppProvider } from './whatsapp/index'

interface WhatsAppMessage {
  to: string
  templateName?: string
  body?: string
  variables?: Record<string, string>
}

/**
 * Send a WhatsApp message via the configured provider (Twilio in production,
 * stub in local development).
 */
export async function sendWhatsAppMessage({ to, body, templateName, variables }: WhatsAppMessage) {
  const provider = getWhatsAppProvider()

  let message: string
  if (templateName && variables) {
    message = `[Template: ${templateName}] ${JSON.stringify(variables)}`
  } else {
    message = body ?? ''
  }

  return provider.send(to, message)
}

/**
 * Formats a message for the "Service Ready" notification.
 */
export function formatReadyMessage(customerName: string, voucherCode: string, equipment: string) {
  return `Olá ${customerName}! Tudo bem? Seu ${equipment} (Voucher: ${voucherCode}) está pronto para retirada na Cyber Informática.\n\nHorário de funcionamento: ${brand.openingHours}\nLocal: ${brand.address.street}, ${brand.address.number}`
}

/**
 * Formats a message for "New Maintenance Request" (Internal/Owner).
 */
export function formatInternalOrderMessage(order: {
  voucher_code: string
  customer_name: string
  equipment_type: string
  problem_description: string
}) {
  return `🚀 *NOVA ORDEM DE MANUTENÇÃO*\n\n*Voucher:* ${order.voucher_code}\n*Cliente:* ${order.customer_name}\n*Equipamento:* ${order.equipment_type}\n*Problema:* ${order.problem_description}\n\nVerifique o painel administrativo para mais detalhes.`
}
