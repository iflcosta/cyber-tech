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

import { TwilioProvider } from './twilio'
import { StubProvider } from './stub'
import type { WhatsAppProvider } from './types'

export { type WhatsAppProvider } from './types'
export { type SendResult } from './types'

let _provider: WhatsAppProvider | null = null

export function getWhatsAppProvider(): WhatsAppProvider {
  if (_provider) return _provider

  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_FROM

  if (sid && token && from) {
    _provider = new TwilioProvider(sid, token, from)
    console.log('[WhatsApp] Using TwilioProvider')
  } else {
    _provider = new StubProvider()
    if (process.env.NODE_ENV !== 'test') {
      console.warn(
        '[WhatsApp] TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_FROM not set — using StubProvider. Messages will only be logged.'
      )
    }
  }

  return _provider
}

/** Reset the singleton (useful for testing). */
export function resetWhatsAppProvider(): void {
  _provider = null
}
