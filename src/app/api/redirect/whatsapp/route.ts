import { NextRequest, NextResponse } from 'next/server'
import { generateVoucherCode } from '@/lib/voucher'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { utmToVoucherSource } from '@/lib/tracking/sources'
import { brand } from '@/lib/brand'

const SERVICE_LABELS: Record<string, string> = {
  reparo_celular:  'reparo de celular',
  reparo_notebook: 'reparo de notebook',
  reparo_desktop:  'reparo de desktop/PC',
  montagem_pc:     'montagem de PC',
  celular:         'reparo de celular',
  notebook:        'reparo de notebook',
  desktop:         'reparo de desktop/PC',
  outro:           'atendimento',
}

/**
 * GET /api/redirect/whatsapp?utm_source=qrcode&ref=iago&service=celular
 *
 * Registers the click as a lead immediately, then redirects directly to
 * WhatsApp with the voucher code in the message for full traceability.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl
  const utmSource   = searchParams.get('utm_source')
  const serviceKey  = searchParams.get('service') ?? 'outro'
  const utmCampaign = searchParams.get('utm_campaign')
  const ref         = searchParams.get('ref')

  const code   = generateVoucherCode()
  const source = utmToVoucherSource(utmSource)

  // Insert lead immediately on click
  supabaseAdmin.from('leads').upsert({
    voucher_code:     code,
    client_name:      'Clique no Anúncio',
    interest_type:    ['reparo','celular','notebook','desktop'].includes(serviceKey) ? 'manutencao' : 'contato',
    marketing_source: source,
    status:           'pending',
    utm_parameters:   { source: utmSource, campaign: utmCampaign, ref },
  }, { onConflict: 'voucher_code', ignoreDuplicates: true })
    .then(({ error }) => { if (error) console.error('[REDIRECT/WA] Lead insert error:', error) })

  const service = SERVICE_LABELS[serviceKey] ?? 'atendimento'
  const message =
    `Olá! Vim pelo QR Code da Cyber Informática.\n\n` +
    `🎟️ Meu voucher: *${code}*\n\n` +
    `Gostaria de informações sobre ${service}.\n\n` +
    `Pode me atender?`

  const waUrl = `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(message)}`
  return NextResponse.redirect(waUrl, { status: 302 })
}
