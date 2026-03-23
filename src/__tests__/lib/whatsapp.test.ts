import { describe, it, expect, beforeEach } from 'vitest'
import { resetWhatsAppProvider, getWhatsAppProvider } from '@/lib/whatsapp/index'
import { StubProvider } from '@/lib/whatsapp/stub'
import { formatReadyMessage, formatInternalOrderMessage } from '@/lib/whatsapp'

beforeEach(() => {
  resetWhatsAppProvider()
  delete process.env.TWILIO_ACCOUNT_SID
  delete process.env.TWILIO_AUTH_TOKEN
  delete process.env.TWILIO_WHATSAPP_FROM
})

describe('getWhatsAppProvider', () => {
  it('returns StubProvider when Twilio env vars are not set', () => {
    const provider = getWhatsAppProvider()
    expect(provider).toBeInstanceOf(StubProvider)
  })

  it('returns the same singleton on repeated calls', () => {
    const p1 = getWhatsAppProvider()
    const p2 = getWhatsAppProvider()
    expect(p1).toBe(p2)
  })

  it('returns a new instance after reset', () => {
    const p1 = getWhatsAppProvider()
    resetWhatsAppProvider()
    const p2 = getWhatsAppProvider()
    expect(p1).not.toBe(p2)
  })
})

describe('StubProvider', () => {
  it('send returns success=true with a messageId', async () => {
    const stub = new StubProvider()
    const result = await stub.send('5511999999999', 'Hello test')
    expect(result.success).toBe(true)
    expect(result.messageId).toBeDefined()
    expect(result.timestamp).toBeDefined()
  })
})

describe('formatReadyMessage', () => {
  it('includes customer name, voucher code and equipment', () => {
    const msg = formatReadyMessage('Maria', 'BPC-AB12', 'Notebook')
    expect(msg).toContain('Maria')
    expect(msg).toContain('BPC-AB12')
    expect(msg).toContain('Notebook')
  })
})

describe('formatInternalOrderMessage', () => {
  it('includes voucher, customer name and equipment type', () => {
    const msg = formatInternalOrderMessage({
      voucher_code: 'BPC-XY99',
      customer_name: 'João',
      equipment_type: 'PC Desktop',
      problem_description: 'Não liga',
    })
    expect(msg).toContain('BPC-XY99')
    expect(msg).toContain('João')
    expect(msg).toContain('PC Desktop')
    expect(msg).toContain('Não liga')
  })
})
