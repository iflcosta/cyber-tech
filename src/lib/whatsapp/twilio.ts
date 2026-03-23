import type { WhatsAppProvider, SendResult } from './types'

/**
 * Twilio WhatsApp Business API provider.
 *
 * Required environment variables:
 *   TWILIO_ACCOUNT_SID   — from console.twilio.com
 *   TWILIO_AUTH_TOKEN    — from console.twilio.com
 *   TWILIO_WHATSAPP_FROM — e.g. "whatsapp:+14155238886" (sandbox) or approved number
 *
 * For Brazilian phones: the `to` number must be in E.164 format without `+`
 * (e.g. "5511997457718") — this provider will prepend "whatsapp:+" automatically.
 *
 * Notes:
 *   - Proactive (template) messages require pre-approved templates in Portuguese.
 *   - For testing, use the Twilio Sandbox at console.twilio.com/whatsapp/sandbox
 */
export class TwilioProvider implements WhatsAppProvider {
  private readonly accountSid: string
  private readonly authToken: string
  private readonly from: string

  constructor(accountSid: string, authToken: string, from: string) {
    this.accountSid = accountSid
    this.authToken = authToken
    // Normalize "from" to always include whatsapp: prefix
    this.from = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`
  }

  async send(to: string, message: string): Promise<SendResult> {
    // Normalize "to" — strip non-digits, prepend whatsapp:+
    const normalizedTo = `whatsapp:+${to.replace(/\D/g, '')}`

    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`

    const body = new URLSearchParams({
      From: this.from,
      To: normalizedTo,
      Body: message,
    })

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(
        `[Twilio] Send failed: ${res.status} ${(err as { message?: string }).message ?? res.statusText}`
      )
    }

    const data = (await res.json()) as { sid: string; date_created: string }

    return {
      success: true,
      messageId: data.sid,
      timestamp: data.date_created ?? new Date().toISOString(),
    }
  }
}
