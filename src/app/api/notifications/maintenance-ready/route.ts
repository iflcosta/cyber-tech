import { NextRequest, NextResponse } from 'next/server'
import { getWhatsAppProvider } from '@/lib/whatsapp/index'
import { formatReadyMessage } from '@/lib/whatsapp'
import { checkRateLimit } from '@/lib/rate-limit'

/**
 * POST /api/notifications/maintenance-ready
 *
 * Sends a WhatsApp notification to the customer when their device is ready.
 * Called by the admin dashboard when updating a maintenance order status to "ready".
 *
 * Body:
 *   { orderId, voucherCode, customerPhone, customerName, equipment }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  const rl = await checkRateLimit(ip, { max: 20, windowMs: 60_000, prefix: 'rl:notif-ready' })
  if (rl.limited) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { voucherCode, customerPhone, customerName, equipment } = body as {
    voucherCode?: string
    customerPhone?: string
    customerName?: string
    equipment?: string
  }

  if (!customerPhone || !voucherCode || !customerName || !equipment) {
    return NextResponse.json(
      { error: 'Missing required fields: customerPhone, voucherCode, customerName, equipment' },
      { status: 400 }
    )
  }

  try {
    const provider = getWhatsAppProvider()
    const message = formatReadyMessage(customerName, voucherCode, equipment)
    const result = await provider.send(customerPhone, message)

    return NextResponse.json({ success: true, messageId: result.messageId }, { status: 200 })
  } catch (err) {
    console.error('[NOTIF] maintenance-ready error:', err)
    return NextResponse.json({ error: 'Failed to send notification.' }, { status: 500 })
  }
}
