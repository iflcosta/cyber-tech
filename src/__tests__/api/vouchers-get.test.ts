import { describe, it, expect, vi } from 'vitest'

const mockVoucher = {
  code: 'BPC-AB12',
  source: 'form',
  status: 'pending',
  customerPhone: undefined,
  customerName: 'Não informado',
  serviceType: undefined,
  commissionOwner: 0,
  commissionTech: 0,
  createdAt: new Date().toISOString(),
}

vi.mock('@/lib/voucher', () => ({
  getVoucherByCode: vi.fn(async (code: string) => {
    if (code === 'BPC-AB12') return mockVoucher
    return null
  }),
}))

import { GET } from '@/app/api/vouchers/[code]/route'
import { NextRequest } from 'next/server'

function makeRequest(code: string) {
  return new NextRequest(`https://cyberinformatica.com.br/api/vouchers/${code}`, {
    method: 'GET',
    headers: { Origin: 'https://cyberinformatica.com.br' },
  })
}

describe('GET /api/vouchers/[code]', () => {
  it('returns 200 with voucher data for a valid code', async () => {
    const res = await GET(makeRequest('BPC-AB12'), {
      params: Promise.resolve({ code: 'BPC-AB12' }),
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.code).toBe('BPC-AB12')
    expect(json.status).toBe('pending')
  })

  it('normalizes code to uppercase', async () => {
    const res = await GET(makeRequest('bpc-ab12'), {
      params: Promise.resolve({ code: 'bpc-ab12' }),
    })
    expect(res.status).toBe(200)
  })

  it('returns 404 for a non-existent code', async () => {
    const res = await GET(makeRequest('BPC-XXXX'), {
      params: Promise.resolve({ code: 'BPC-XXXX' }),
    })
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBeDefined()
  })

  it('includes CORS headers in the response', async () => {
    const res = await GET(makeRequest('BPC-AB12'), {
      params: Promise.resolve({ code: 'BPC-AB12' }),
    })
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeTruthy()
  })
})
