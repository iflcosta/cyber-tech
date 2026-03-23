import { NextRequest, NextResponse } from 'next/server'
import { createVoucher } from '@/lib/voucher'
import { utmToVoucherSource } from '@/lib/tracking/sources'

/**
 * GET /api/redirect/whatsapp?utm_source=instagram&service=celular&utm_campaign=reparo
 *
 * Used as the destination URL in Instagram / Facebook / Google Ads.
 * Generates a voucher, builds a pre-filled WhatsApp message and redirects.
 */


export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl
  const utmSource   = searchParams.get('utm_source')
  const serviceKey  = searchParams.get('service') ?? 'outro'
  const utmCampaign = searchParams.get('utm_campaign')

  const source = utmToVoucherSource(utmSource)

  let code: string | null = null

  try {
    const voucher = await createVoucher({
      source,
      serviceType: serviceKey,
    })
    code = voucher.code
  } catch (err) {
    console.error('[REDIRECT/WA] Failed to create voucher:', err)
    // Fallback: redirect to WhatsApp without a voucher code
  }

  const siteBase = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cyberinformatica.tech'
  const params = new URLSearchParams()
  if (code) params.set('voucher', code)
  if (utmSource) params.set('utm_source', utmSource)
  if (utmCampaign) params.set('utm_campaign', utmCampaign)
  params.set('service', serviceKey)

  const siteUrl = `${siteBase}/?${params.toString()}`

  return NextResponse.redirect(siteUrl, { status: 302 })
}
