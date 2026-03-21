'use client'

import { useState } from 'react'
import { brand } from '@/lib/brand'

export type WhatsAppServiceType =
  | 'reparo_celular'
  | 'reparo_notebook'
  | 'reparo_desktop'
  | 'montagem_pc'
  | 'outro'

export interface UseWhatsAppLeadParams {
  serviceType?: WhatsAppServiceType
  defaultMessage?: string
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
  const fbq = (window as Record<string, unknown>).fbq
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

  const openWhatsApp = async (overrideMessage?: string): Promise<void> => {
    if (isLoading) return
    setIsLoading(true)

    try {
      let code: string | null = null

      try {
        const res = await fetch('/api/vouchers/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: 'whatsapp_site', serviceType }),
        })
        if (res.ok) {
          const data = (await res.json()) as { code: string }
          code = data.code
        }
      } catch {
        // Non-fatal — open WhatsApp without voucher
      }

      firePixelLead(serviceType)

      const msg = code
        ? buildMessage(code, serviceType, overrideMessage ?? defaultMessage)
        : (overrideMessage ??
            defaultMessage ??
            'Olá! Vim pelo site da Cyber Informática. Pode me atender?')

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

  return { isLoading, openWhatsApp }
}
