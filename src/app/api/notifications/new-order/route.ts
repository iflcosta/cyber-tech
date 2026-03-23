import { NextRequest, NextResponse } from 'next/server'
import { getWhatsAppProvider } from '@/lib/whatsapp/index'
import { formatInternalOrderMessage } from '@/lib/whatsapp'
import { checkRateLimit } from '@/lib/rate-limit'
import { brand } from '@/lib/brand'

/**
 * POST /api/notifications/new-order
 *
 * Sends an internal WhatsApp notification to the store owner when a new
 * maintenance order is created.
 *
 * Body:
 *   { voucherCode, customerName, equipmentType, problemDescription }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  const rl = await checkRateLimit(ip, { max: 20, windowMs: 60_000, prefix: 'rl:notif-new-order' })
  if (rl.limited) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { voucherCode, customerName, equipmentType, problemDescription } = body as {
    voucherCode?: string
    customerName?: string
    equipmentType?: string
    problemDescription?: string
  }

  if (!voucherCode || !customerName || !equipmentType) {
    return NextResponse.json(
      { error: 'Missing required fields: voucherCode, customerName, equipmentType' },
      { status: 400 }
    )
  }

  const ownerPhone = brand.whatsapp // e.g. "5511997457718"

  try {
    const provider = getWhatsAppProvider()
    const message = formatInternalOrderMessage({
      voucher_code: voucherCode,
      customer_name: customerName,
      equipment_type: equipmentType,
      problem_description: problemDescription ?? 'Não informado',
    })
    const result = await provider.send(ownerPhone, message)

    return NextResponse.json({ success: true, messageId: result.messageId }, { status: 200 })
  } catch (err) {
    console.error('[NOTIF] new-order error:', err)
    return NextResponse.json({ error: 'Failed to send notification.' }, { status: 500 })
  }
}
