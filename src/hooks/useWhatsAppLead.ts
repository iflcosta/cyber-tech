'use client'

import { useState, useEffect } from 'react'
import { brand } from '@/lib/brand'
import { getOrCreateSessionVoucher, setSessionVoucher } from '@/lib/session/voucherSession'
import { trackLead } from '@/lib/leads'

export type WhatsAppServiceType =
  | 'reparo_celular'
  | 'reparo_notebook'
  | 'reparo_desktop'
  | 'montagem_pc'
  | 'outro'

export interface UseWhatsAppLeadParams {
  serviceType?: WhatsAppServiceType;
  defaultMessage?: string;
}

const SERVICE_LABELS: Record<WhatsAppServiceType, string> = {
  reparo_celular:  'reparo de celular',
  reparo_notebook: 'reparo de notebook',
  reparo_desktop:  'reparo de desktop/PC',
  montagem_pc:     'montagem de PC',
  outro:           'atendimento',
}

function firePixelLead(serviceType?: WhatsAppServiceType): void {
  if (typeof window === 'undefined') return
  const fbq = (window as any).fbq
  if (typeof fbq !== 'function') return
  ;(fbq as Function)('track', 'Lead', {
    content_name:     serviceType ? SERVICE_LABELS[serviceType] : 'geral',
    content_category: 'whatsapp_site',
  })
}

function buildMessage(
  code: string,
  serviceType?: WhatsAppServiceType,
  customMessage?: string
): string {
  if (customMessage) {
    return customMessage.includes(code)
      ? customMessage
      : `${customMessage}\n\n🎟️ Meu voucher: *${code}*`
  }
  const service = serviceType ? SERVICE_LABELS[serviceType] : 'atendimento'
  return (
    `Olá! Vim pelo site da Cyber Informática.\n\n` +
    `🎟️ Meu voucher: *${code}*\n\n` +
    `Gostaria de informações sobre ${service}.\n\n` +
    `Pode me atender?`
  )
}

export function useWhatsAppLead({
  serviceType,
  defaultMessage,
}: UseWhatsAppLeadParams = {}) {
  const [isLoading, setIsLoading] = useState(false)

  // Intercepta ?voucher= na URL e salva na sessão.
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        const utmVoucher = params.get('voucher')
        if (utmVoucher && utmVoucher.startsWith('BPC-')) {
            setSessionVoucher(utmVoucher)
        }
    }
  }, [])

  const openWhatsApp = async (overrideMessage?: string): Promise<void> => {
    if (isLoading) return
    setIsLoading(true)

    try {
      const voucher = await getOrCreateSessionVoucher()

      try {
        await trackLead({
            voucher_code: voucher,
            intent_type: 'duvida_tecnica',
            description: overrideMessage || defaultMessage || 'Clique no botão do WhatsApp',
            interest_type: serviceType?.includes('reparo') ? 'manutencao' : 'venda',
            client_name: 'Lead Direto (WhatsApp)',
            whatsapp: '00000000000' 
        });
      } catch(e) { }

      firePixelLead(serviceType)

      const msg = buildMessage(voucher, serviceType, overrideMessage ?? defaultMessage)

      if (typeof window !== 'undefined') {
        window.open(
          `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(msg)}`,
          '_blank'
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Aliased syntax to maintain backwards compatibility with the code I wrote inside components
  const openWhatsAppLead = async (params: { intent?: string, description?: string, messageTemplate?: string, serviceType?: WhatsAppServiceType } = {}) => {
      // Provide backwards compatibility map
      await openWhatsApp(params.messageTemplate || params.description);
  }

  return { isLoading, openWhatsApp, openWhatsAppLead }
}
