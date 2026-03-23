import { NextRequest, NextResponse } from 'next/server'
import { generateVoucherCode } from '@/lib/voucher'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { utmToVoucherSource } from '@/lib/tracking/sources'

/**
 * GET /api/redirect/whatsapp?utm_source=instagram&service=celular&utm_campaign=reparo
 *
 * Entry point for Instagram / Facebook / Google Ads links.
 * Registers the click as a lead immediately (no name/phone yet) so the
 * voucher appears in the admin panel even if the user never clicks WhatsApp.
 * When the user does click WhatsApp on the site, trackLead upserts by
 * voucher_code and fills in name, phone, and intent.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl
  const utmSource   = searchParams.get('utm_source')
  const serviceKey  = searchParams.get('service') ?? 'outro'
  const utmCampaign = searchParams.get('utm_campaign')

  const code   = generateVoucherCode()
  const source = utmToVoucherSource(utmSource)

  // Insert lead immediately on ad click — upsert is safe if somehow duplicate
  supabaseAdmin.from('leads').upsert({
    voucher_code:     code,
    client_name:      'Clique no Anúncio',
    interest_type:    serviceKey === 'reparo' || serviceKey === 'celular' || serviceKey === 'notebook' || serviceKey === 'desktop' ? 'manutencao' : 'contato',
    marketing_source: source,
    status:           'pending',
    utm_parameters:   { source: utmSource, campaign: utmCampaign },
  }, { onConflict: 'voucher_code', ignoreDuplicates: true })
    .then(({ error }) => { if (error) console.error('[REDIRECT/WA] Lead insert error:', error) })

  const siteBase = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cyberinformatica.tech'
  const params = new URLSearchParams()
  params.set('voucher', code)
  if (utmSource) params.set('utm_source', utmSource)
  if (utmCampaign) params.set('utm_campaign', utmCampaign)
  params.set('service', serviceKey)

  return NextResponse.redirect(`${siteBase}/?${params.toString()}`, { status: 302 })
}
