import { describe, it, expect } from 'vitest'
import { generateVoucherCode } from '@/lib/voucher'

describe('generateVoucherCode', () => {
  it('returns a string starting with BPC-', () => {
    const code = generateVoucherCode()
    expect(code).toMatch(/^BPC-/)
  })

  it('has exactly 4 characters after BPC-', () => {
    const code = generateVoucherCode()
    const suffix = code.split('BPC-')[1]
    expect(suffix).toHaveLength(4)
  })

  it('uses only valid alphanumeric characters (no ambiguous chars)', () => {
    // Valid charset: ABCDEFGHJKLMNPQRSTUVWXYZ23456789 (no 0,1,I,O)
    const validChars = new Set('ABCDEFGHJKLMNPQRSTUVWXYZ23456789')
    for (let i = 0; i < 100; i++) {
      const code = generateVoucherCode()
      const suffix = code.replace('BPC-', '')
      for (const char of suffix) {
        expect(validChars.has(char), `char "${char}" should be in valid charset`).toBe(true)
      }
    }
  })

  it('generates unique codes across many calls', () => {
    const codes = new Set(Array.from({ length: 200 }, () => generateVoucherCode()))
    // With 32^4 = ~1M possible codes, 200 calls should yield ~200 unique
    expect(codes.size).toBeGreaterThan(190)
  })

  it('format matches BPC-XXXX pattern exactly', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateVoucherCode()
      expect(code).toMatch(/^BPC-[A-Z2-9]{4}$/)
    }
  })
})
