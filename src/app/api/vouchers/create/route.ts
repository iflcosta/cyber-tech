import { NextRequest, NextResponse } from 'next/server'
import { createVoucher } from '@/lib/voucher'
import { supabase } from '@/lib/supabase'
import type { VoucherSource } from '@/types/voucher'

// ---------------------------------------------------------------------------
// CORS helpers
// ---------------------------------------------------------------------------

const ALLOWED_ORIGINS = [
  'https://cyberinformatica.com.br',
  'https://www.cyberinformatica.com.br',
  'https://hooks.manychat.com',
]

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  const origin = request.headers.get('origin')
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  })
}

// ---------------------------------------------------------------------------
// Rate limiting — in-memory, per IP
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 60_000

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true
  }

  entry.count++
  return false
}

// ---------------------------------------------------------------------------
// Valid sources
// ---------------------------------------------------------------------------

const VALID_SOURCES: VoucherSource[] = [
  'whatsapp_site',
  'instagram_dm',
  'facebook_dm',
  'form',
]

// ---------------------------------------------------------------------------
// POST /api/vouchers/create
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  // Resolve client IP
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again in 1 minute.' },
      { status: 429, headers: corsHeaders }
    )
  }

  // Parse body
  let body: {
    source?: unknown
    customerPhone?: unknown
    customerName?: unknown
    serviceType?: unknown
    orderValue?: unknown
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body.' },
      { status: 400, headers: corsHeaders }
    )
  }

  // Validate source
  if (!body.source || !VALID_SOURCES.includes(body.source as VoucherSource)) {
    return NextResponse.json(
      {
        error: `Invalid or missing "source". Must be one of: ${VALID_SOURCES.join(', ')}`,
      },
      { status: 400, headers: corsHeaders }
    )
  }

  const source = body.source as VoucherSource
  const customerPhone =
    typeof body.customerPhone === 'string' ? body.customerPhone : undefined
  const customerName =
    typeof body.customerName === 'string' ? body.customerName : undefined
  const serviceType =
    typeof body.serviceType === 'string' ? body.serviceType : undefined
  const orderValue =
    typeof body.orderValue === 'number' && body.orderValue > 0
      ? body.orderValue
      : undefined

  // Calculate commissions
  const commissionOwner = orderValue != null ? orderValue * 0.05 : 0
  const commissionTech = orderValue != null ? orderValue * 0.03 : 0

  try {
    const voucher = await createVoucher({
      source,
      customerPhone,
      customerName,
      serviceType,
    })

    // If orderValue provided, update commissions in DB
    if (orderValue != null) {
      const { error: commissionError } = await supabase
        .from('maintenance_orders')
        .update({
          commission_owner: commissionOwner,
          commission_tech: commissionTech,
          order_value: orderValue,
        })
        .eq('voucher_code', voucher.code)

      if (commissionError) {
        console.error(
          '[VOUCHER] Failed to update commissions:',
          commissionError
        )
      }
    }

    return NextResponse.json(
      {
        code: voucher.code,
        commissionOwner,
        commissionTech,
        createdAt: voucher.createdAt,
      },
      { status: 201, headers: corsHeaders }
    )
  } catch (err) {
    console.error('[VOUCHER] Error in POST /api/vouchers/create:', err)
    return NextResponse.json(
      { error: 'Internal server error. Could not create voucher.' },
      { status: 500, headers: corsHeaders }
    )
  }
}
