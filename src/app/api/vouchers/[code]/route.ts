import { NextRequest, NextResponse } from 'next/server'
import { getVoucherByCode } from '@/lib/voucher'

// ---------------------------------------------------------------------------
// CORS helpers
// ---------------------------------------------------------------------------

const ALLOWED_ORIGINS = [
  'https://cyberinformatica.tech',
  'https://www.cyberinformatica.tech',
]

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
// GET /api/vouchers/[code]
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
): Promise<NextResponse> {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  const { code: rawCode } = await params
  const code = rawCode.toUpperCase()

  try {
    const voucher = await getVoucherByCode(code)

    if (!voucher) {
      return NextResponse.json(
        { error: 'Voucher não encontrado' },
        { status: 404, headers: corsHeaders }
      )
    }

    return NextResponse.json(voucher, { status: 200, headers: corsHeaders })
  } catch (err) {
    console.error(`[VOUCHER] Error in GET /api/vouchers/${code}:`, err)
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500, headers: corsHeaders }
    )
  }
}
