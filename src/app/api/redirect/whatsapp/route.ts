import { NextRequest, NextResponse } from 'next/server'
import { generateVoucherCode } from '@/lib/voucher'

/**
 * GET /api/redirect/whatsapp?utm_source=instagram&service=celular&utm_campaign=reparo
 *
 * Entry point for Instagram / Facebook / Google Ads links.
 * Generates a voucher code locally (no DB insert) and lands the user on the
 * site so useWhatsAppLead can set the session and insert the lead correctly
 * into the leads table when the user clicks WhatsApp.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl
  const utmSource   = searchParams.get('utm_source')
  const serviceKey  = searchParams.get('service') ?? 'outro'
  const utmCampaign = searchParams.get('utm_campaign')

  const code = generateVoucherCode()

  const siteBase = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cyberinformatica.tech'
  const params = new URLSearchParams()
  params.set('voucher', code)
  if (utmSource) params.set('utm_source', utmSource)
  if (utmCampaign) params.set('utm_campaign', utmCampaign)
  params.set('service', serviceKey)

  return NextResponse.redirect(`${siteBase}/?${params.toString()}`, { status: 302 })
}
