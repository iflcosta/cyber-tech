import type { WhatsAppProvider, SendResult } from './types'

/**
 * Stub provider for local development — logs only, no real messages sent.
 */
export class StubProvider implements WhatsAppProvider {
  async send(to: string, message: string): Promise<SendResult> {
    console.log(`[WhatsApp STUB] To: ${to}`)
    console.log(`[WhatsApp STUB] Message:\n${message}`)

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100))

    return {
      success: true,
      messageId: `stub_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
    }
  }
}
