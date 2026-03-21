import { NextRequest, NextResponse } from 'next/server'
import { createVoucher } from '@/lib/voucher'
import type { VoucherSource } from '@/types/voucher'

/**
 * POST /api/webhooks/lead
 *
 * Called by Manychat (or any DM automation) when a new lead starts a
 * conversation on Instagram or Facebook.
 *
 * Security: requires x-webhook-secret header = WEBHOOK_SECRET env var.
 * Idempotency: if `externalId` is provided and a voucher already exists for
 * that ID, the existing voucher is returned — no duplicate is created.
 */

const VALID_SOURCES: VoucherSource[] = ['instagram_dm', 'facebook_dm', 'form', 'organic']

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Auth ────────────────────────────────────────────────────────────────
  const secret = process.env.WEBHOOK_SECRET
  if (secret) {
    const provided = req.headers.get('x-webhook-secret')
    if (provided !== secret) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }
  }

  // ── Parse body ──────────────────────────────────────────────────────────
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const source = body.source as VoucherSource | undefined
  if (!source || !VALID_SOURCES.includes(source)) {
    return NextResponse.json(
      { error: `Invalid "source". Must be one of: ${VALID_SOURCES.join(', ')}` },
      { status: 400 }
    )
  }

  // ── Create (or retrieve) voucher ────────────────────────────────────────
  try {
    const voucher = await createVoucher({
      source,
      customerName:  typeof body.customerName  === 'string' ? body.customerName  : undefined,
      customerPhone: typeof body.customerPhone === 'string' ? body.customerPhone : undefined,
      serviceType:   typeof body.serviceType   === 'string' ? body.serviceType   : undefined,
      externalId:    typeof body.externalId    === 'string' ? body.externalId    : undefined,
    })

    return NextResponse.json(
      {
        code:   voucher.code,
        source: voucher.source,
        status: voucher.status,
        // Convenience field for Manychat to inject into DM template
        message: `🎟️ Seu voucher exclusivo: *${voucher.code}*\nApresente este código para atendimento prioritário!`,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[WEBHOOK/LEAD] Error creating voucher:', err)
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    )
  }
}
