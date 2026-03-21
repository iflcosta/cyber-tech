import { NextRequest, NextResponse } from 'next/server'
import {
  updateVoucherStatus,
  linkVoucherToPhone,
} from '@/lib/voucher'
import { supabase } from '@/lib/supabase'
import type { VoucherStatus } from '@/types/voucher'

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
    'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
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
// Valid statuses
// ---------------------------------------------------------------------------

const VALID_STATUSES: VoucherStatus[] = [
  'pending',
  'in_progress',
  'delivered',
  'cancelled',
]

// ---------------------------------------------------------------------------
// PATCH /api/vouchers/[code]/status
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
): Promise<NextResponse> {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  const { code: rawCode } = await params
  const code = rawCode.toUpperCase()

  // Parse body
  let body: {
    status?: unknown
    orderValue?: unknown
    customerPhone?: unknown
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body.' },
      { status: 400, headers: corsHeaders }
    )
  }

  // Validate status
  if (!body.status || !VALID_STATUSES.includes(body.status as VoucherStatus)) {
    return NextResponse.json(
      {
        error: `Invalid or missing "status". Must be one of: ${VALID_STATUSES.join(', ')}`,
      },
      { status: 400, headers: corsHeaders }
    )
  }

  const status = body.status as VoucherStatus
  const customerPhone =
    typeof body.customerPhone === 'string' ? body.customerPhone : undefined
  const orderValue =
    typeof body.orderValue === 'number' && body.orderValue > 0
      ? body.orderValue
      : undefined

  try {
    // Update status
    await updateVoucherStatus(code, status)

    // Optionally link phone
    if (customerPhone) {
      await linkVoucherToPhone(code, customerPhone)
    }

    // Optionally recalculate and persist commissions
    if (orderValue != null) {
      const commissionOwner = orderValue * 0.05
      const commissionTech = orderValue * 0.03

      const { error: commissionError } = await supabase
        .from('maintenance_orders')
        .update({
          commission_owner: commissionOwner,
          commission_tech: commissionTech,
          order_value: orderValue,
        })
        .eq('voucher_code', code)

      if (commissionError) {
        console.error(
          '[VOUCHER] Failed to update commissions:',
          commissionError
        )
      }
    }

    return NextResponse.json(
      { success: true },
      { status: 200, headers: corsHeaders }
    )
  } catch (err) {
    console.error(`[VOUCHER] Error in PATCH /api/vouchers/${code}/status:`, err)
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500, headers: corsHeaders }
    )
  }
}
