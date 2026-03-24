'use client'

import { useState, useEffect } from 'react'
import { brand } from '@/lib/brand'
import { getOrCreateSessionVoucher, setSessionVoucher } from '@/lib/session/voucherSession'
import { trackLead } from '@/lib/leads'
import { utmToVoucherSource } from '@/lib/tracking/sources'
import type { InterestType } from '@/types/lead'

export type WhatsAppServiceType =
  | 'reparo_celular'
  | 'reparo_notebook'
  | 'reparo_desktop'
  | 'montagem_pc'
  | 'venda'
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
  venda:           'compra de produto',
  outro:           'atendimento',
}

function serviceTypeToInterestType(serviceType?: WhatsAppServiceType): InterestType {
  if (!serviceType) return 'contato'
  if (serviceType.includes('reparo')) return 'manutencao'
  if (serviceType === 'montagem_pc') return 'pc_build'
  if (serviceType === 'venda') return 'venda'
  return 'contato'
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
      : `${customMessage}\n\n🎫 Meu voucher: *${code}*`
  }
  const service = serviceType ? SERVICE_LABELS[serviceType] : 'atendimento'
  return (
    `Olá! Vim pelo site da Cyber Informática.\n\n` +
    `🎫 Meu voucher: *${code}*\n\n` +
    `Gostaria de informações sobre ${service}.\n\n` +
    `Pode me atender?`
  )
}

export function useWhatsAppLead({
  serviceType,
  defaultMessage,
}: UseWhatsAppLeadParams = {}) {
  const [isLoading, setIsLoading] = useState(false)

  // Intercepta ?voucher= e ?ref= na URL e salva na sessão.
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        const utmVoucher = params.get('voucher')
        if (utmVoucher && utmVoucher.startsWith('BPC-')) {
            setSessionVoucher(utmVoucher)
        }
        const ref = params.get('ref')
        if (ref) {
            sessionStorage.setItem('bpc_ref', ref)
        }
    }
  }, [])

  const openWhatsApp = async (overrideMessage?: string, overrideServiceType?: WhatsAppServiceType, overrideInterestType?: InterestType): Promise<void> => {
    if (isLoading) return
    setIsLoading(true)

    const effectiveServiceType = overrideServiceType ?? serviceType
    const effectiveInterestType: InterestType = overrideInterestType ?? serviceTypeToInterestType(effectiveServiceType)

    // Open blank window synchronously (before any await) to avoid popup blocker
    const win = typeof window !== 'undefined' ? window.open('', '_blank') : null

    try {
      const voucher = await getOrCreateSessionVoucher()

      try {
        const ref = typeof window !== 'undefined' ? sessionStorage.getItem('bpc_ref') : null
        const utmSource = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_source') : null
        await trackLead({
            voucher_code:     voucher,
            intent_type:      'duvida_tecnica',
            description:      overrideMessage || defaultMessage || 'Clique no botão do WhatsApp',
            interest_type:    effectiveInterestType,
            client_name:      'Lead Direto (WhatsApp)',
            whatsapp:         '00000000000',
            marketing_source: utmSource ? utmToVoucherSource(utmSource) : undefined,
            utm_parameters:   ref ? { ref } : undefined,
        });
      } catch(e) { }

      firePixelLead(effectiveServiceType)

      const msg = buildMessage(voucher, effectiveServiceType, overrideMessage ?? defaultMessage)
      const waUrl = `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(msg)}`

      if (win) {
        win.location.href = waUrl
      } else if (typeof window !== 'undefined') {
        window.open(waUrl, '_blank')
      }
    } catch {
      win?.close()
    } finally {
      setIsLoading(false)
    }
  }

  // Aliased syntax to maintain backwards compatibility with the code I wrote inside components
  const openWhatsAppLead = async (params: { intent?: string, description?: string, messageTemplate?: string, serviceType?: WhatsAppServiceType } = {}) => {
      const effectiveServiceType = params.serviceType ?? serviceType
      const effectiveInterestType: InterestType = serviceTypeToInterestType(effectiveServiceType)
      await openWhatsApp(params.messageTemplate || params.description, effectiveServiceType, effectiveInterestType)
  }

  return { isLoading, openWhatsApp, openWhatsAppLead }
}
