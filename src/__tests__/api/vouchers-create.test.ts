import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase admin client before importing the route
vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              voucher_code: 'BPC-TEST',
              source: 'form',
              status: 'pending',
              customer_phone: null,
              customer_name: 'Não informado',
              equipment_type: null,
              commission_owner: 0,
              commission_tech: 0,
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      }),
    }),
  },
}))

// Mock rate limit to always allow in unit tests
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ limited: false, remaining: 9, reset: Date.now() + 60000 }),
}))

import { POST } from '@/app/api/vouchers/create/route'
import { NextRequest } from 'next/server'

function makeRequest(body: unknown, origin = 'https://cyberinformatica.com.br') {
  return new NextRequest('https://cyberinformatica.com.br/api/vouchers/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify(body),
  })
}

describe('POST /api/vouchers/create', () => {
  it('returns 400 when source is missing', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/source/i)
  })

  it('returns 400 for an invalid source', async () => {
    const res = await POST(makeRequest({ source: 'invalid_source' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/source/i)
  })

  it('returns 201 with voucher for a valid request', async () => {
    const res = await POST(makeRequest({ source: 'form' }))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.code).toBeDefined()
    expect(json.status).toBe('pending')
  })

  it('accepts all valid VoucherSource values', async () => {
    const validSources = ['whatsapp_site', 'instagram_dm', 'facebook_dm', 'form', 'google_ads', 'organic']
    for (const source of validSources) {
      const res = await POST(makeRequest({ source }))
      expect(res.status, `source "${source}" should return 201`).toBe(201)
    }
  })

  it('returns 400 for non-JSON body', async () => {
    const req = new NextRequest('https://cyberinformatica.com.br/api/vouchers/create', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain', Origin: 'https://cyberinformatica.com.br' },
      body: 'not json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
