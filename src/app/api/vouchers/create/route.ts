import { NextRequest, NextResponse } from 'next/server'
import { createVoucher } from '@/lib/voucher'
import { checkRateLimit } from '@/lib/rate-limit'
import type { VoucherSource } from '@/types/voucher'

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

const ALLOWED_ORIGINS = [
  'https://cyberinformatica.tech',
  'https://www.cyberinformatica.tech',
  process.env.WEBHOOK_ORIGIN,
].filter(Boolean) as string[]

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

export async function OPTIONS(req: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get('origin')),
  })
}

// ---------------------------------------------------------------------------
// Valid sources
// ---------------------------------------------------------------------------

const VALID_SOURCES: VoucherSource[] = [
  'whatsapp_site',
  'instagram_dm',
  'facebook_dm',
  'form',
  'google_ads',
  'organic',
]

// ---------------------------------------------------------------------------
// POST /api/vouchers/create
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  const origin = req.headers.get('origin')
  const cors = corsHeaders(origin)

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  const rl = await checkRateLimit(ip, { max: 10, windowMs: 60_000, prefix: 'rl:voucher' })
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again in 1 minute.' },
      { status: 429, headers: cors }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body.' },
      { status: 400, headers: cors }
    )
  }

  if (!body.source || !VALID_SOURCES.includes(body.source as VoucherSource)) {
    return NextResponse.json(
      { error: `Invalid "source". Must be one of: ${VALID_SOURCES.join(', ')}` },
      { status: 400, headers: cors }
    )
  }

  try {
    const voucher = await createVoucher({
      source: body.source as VoucherSource,
      customerPhone: typeof body.customerPhone === 'string' ? body.customerPhone : undefined,
      customerName:  typeof body.customerName  === 'string' ? body.customerName  : undefined,
      serviceType:   typeof body.serviceType   === 'string' ? body.serviceType   : undefined,
      orderValue:    typeof body.orderValue    === 'number' && body.orderValue > 0 ? body.orderValue : undefined,
      externalId:    typeof body.externalId    === 'string' ? body.externalId    : undefined,
    })

    return NextResponse.json(voucher, { status: 201, headers: cors })
  } catch (err) {
    console.error('[VOUCHER] POST /api/vouchers/create error:', err)
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500, headers: cors }
    )
  }
}
