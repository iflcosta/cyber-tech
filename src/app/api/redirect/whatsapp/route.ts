import { NextRequest, NextResponse } from 'next/server'
import { createVoucher } from '@/lib/voucher'
import { utmToVoucherSource } from '@/lib/tracking/sources'

/**
 * GET /api/redirect/whatsapp?utm_source=instagram&service=celular&utm_campaign=reparo
 *
 * Used as the destination URL in Instagram / Facebook / Google Ads.
 * Generates a voucher, builds a pre-filled WhatsApp message and redirects.
 */

const SERVICE_LABELS: Record<string, string> = {
  celular:   'reparo de celular',
  notebook:  'reparo de notebook',
  desktop:   'reparo de desktop',
  pc_gamer:  'montagem de PC Gamer',
  outro:     'atendimento geral',
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl
  const utmSource   = searchParams.get('utm_source')
  const serviceKey  = searchParams.get('service') ?? 'outro'
  const utmCampaign = searchParams.get('utm_campaign')

  const source      = utmToVoucherSource(utmSource)
  const serviceLabel = SERVICE_LABELS[serviceKey] ?? 'atendimento'

  const waNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5511999999999'

  let code: string | null = null

  try {
    const voucher = await createVoucher({
      source,
      serviceType: serviceKey,
      externalId: utmCampaign ? `${source}:${utmCampaign}:${Date.now()}` : undefined,
    })
    code = voucher.code
  } catch (err) {
    console.error('[REDIRECT/WA] Failed to create voucher:', err)
    // Fallback: redirect to WhatsApp without a voucher code
  }

  const message = code
    ? `Olá! Vim pelo anúncio da Cyber Informática.\n\n🔖 Código: ${code}\n🛠️ Serviço: ${serviceLabel}\n\nPode me ajudar?`
    : `Olá! Vim pelo anúncio da Cyber Informática.\n🛠️ Serviço: ${serviceLabel}\n\nPode me ajudar?`

  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`

  return NextResponse.redirect(waUrl, { status: 302 })
}
