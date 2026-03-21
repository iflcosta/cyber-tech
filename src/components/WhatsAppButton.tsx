'use client'

import { MessageSquare, Loader2 } from 'lucide-react'
import { useWhatsAppLead, type WhatsAppServiceType } from '@/hooks/useWhatsAppLead'

export interface WhatsAppButtonProps {
  serviceType?: WhatsAppServiceType
  label?: string
  className?: string
  variant?: 'primary' | 'ghost' | 'fab'
  defaultMessage?: string
}

const WA_STYLE: React.CSSProperties = {
  background: 'linear-gradient(to bottom, #2ECC71, #25A55A)',
  boxShadow: '0 4px 0 #1a7a42',
  borderRadius: '4px',
}

export default function WhatsAppButton({
  serviceType = 'outro',
  label = 'WhatsApp',
  className = '',
  variant = 'primary',
  defaultMessage,
}: WhatsAppButtonProps) {
  const { isLoading, openWhatsApp } = useWhatsAppLead({ serviceType, defaultMessage })
  const loadingLabel = 'Aguarde...'

  if (variant === 'fab') {
    return (
      <button
        onClick={() => openWhatsApp()}
        disabled={isLoading}
        aria-label={isLoading ? loadingLabel : 'Abrir WhatsApp'}
        className="fixed bottom-24 left-6 z-[99] w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-95 transition-all disabled:opacity-80"
        style={WA_STYLE}
      >
        {isLoading
          ? <Loader2 size={22} className="animate-spin" />
          : <MessageSquare size={22} />}
      </button>
    )
  }

  if (variant === 'ghost') {
    return (
      <button
        onClick={() => openWhatsApp()}
        disabled={isLoading}
        aria-label={isLoading ? loadingLabel : label}
        className={`btn-ghost flex items-center gap-2 disabled:opacity-60 ${className}`}
      >
        {isLoading
          ? <Loader2 size={16} className="animate-spin" />
          : <MessageSquare size={16} />}
        {isLoading ? loadingLabel : label}
      </button>
    )
  }

  // variant === 'primary'
  return (
    <button
      onClick={() => openWhatsApp()}
      disabled={isLoading}
      aria-label={isLoading ? loadingLabel : label}
      className={`flex items-center justify-center gap-2 text-white font-display font-bold uppercase tracking-wider transition-all hover:-translate-y-[1px] active:translate-y-[2px] disabled:opacity-70 ${className}`}
      style={WA_STYLE}
    >
      {isLoading
        ? <Loader2 size={16} className="animate-spin" />
        : <MessageSquare size={16} />}
      {isLoading ? loadingLabel : label}
    </button>
  )
}
