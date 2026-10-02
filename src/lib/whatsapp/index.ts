/**
 * WhatsApp provider factory.
 *
 * Returns a TwilioProvider when TWILIO_ACCOUNT_SID is set in the environment,
 * otherwise falls back to the StubProvider (safe for local development).
 *
 * Usage:
 *   import { getWhatsAppProvider } from '@/lib/whatsapp'
 *   const wa = getWhatsAppProvider()
 *   await wa.send('+5511997457718', 'Hello!')
 */

import { EvolutionProvider } from './evolution'
import { TwilioProvider } from './twilio'
import { StubProvider } from './stub'
import type { WhatsAppProvider } from './types'

export { type WhatsAppProvider } from './types'
export { type SendResult } from './types'

let _provider: WhatsAppProvider | null = null

export function getWhatsAppProvider(): WhatsAppProvider {
  if (_provider) return _provider

  // 1. Prioridade 1: Evolution API (Custo zero, instâncias próprias na VPS)
  const evoUrl = process.env.EVOLUTION_API_URL
  const evoKey = process.env.EVOLUTION_API_KEY
  const evoInstance = process.env.EVOLUTION_INSTANCE_NAME || 'cyber-tech'

  if (evoUrl && evoKey) {
    _provider = new EvolutionProvider(evoUrl, evoKey, evoInstance)
    console.log('[WhatsApp] Using EvolutionProvider on instance:', evoInstance)
    return _provider
  }

  // 2. Fallback: Twilio (se configurado)
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_FROM

  if (sid && token && from) {
    _provider = new TwilioProvider(sid, token, from)
    console.log('[WhatsApp] Using TwilioProvider')
    return _provider
  }

  // 3. Fallback: Stub para testes e desenvolvimento local
  _provider = new StubProvider()
  if (process.env.NODE_ENV !== 'test') {
    console.warn(
      '[WhatsApp] EVOLUTION_API_URL ou TWILIO_* não configurados — usando StubProvider. Mensagens serão registradas apenas no log.'
    )
  }

  return _provider
}

/** Reset the singleton (useful for testing). */
export function resetWhatsAppProvider(): void {
  _provider = null
}
