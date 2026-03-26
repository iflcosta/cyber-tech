import { NextRequest, NextResponse } from 'next/server'
import { createVoucher } from '@/lib/voucher'
import { trackLead } from '@/lib/leads'
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
 * GET /api/redirect/whatsapp?utm_source=custom&utm_campaign=manutencao-celular&service=reparo_celular
 * 
 * Creates a voucher (maintenance_order) and a lead, then redirects to WhatsApp.
 * Uses cookies to prevent duplicate creation for the same session.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl
  const utmSource   = searchParams.get('utm_source')
  const utmCampaign = searchParams.get('utm_campaign')
  const ref         = searchParams.get('ref')
  const serviceKey  = searchParams.get('service') ?? 'outro'

  const service = SERVICE_LABELS[serviceKey] ?? 'atendimento'
  const source = utmToVoucherSource(utmSource)

  // Reuse existing voucher from cookie if present
  const existingCode = req.cookies.get('cyber_wa_voucher')?.value
  
  let code = existingCode

  if (!code) {
    try {
      // 1. Create maintenance order (Voucher)
      const voucher = await createVoucher({
        source,
        serviceType: serviceKey,
        customerName: 'Lead via Link Direto',
      })
      code = voucher.code

      // 2. Track Lead
      await trackLead({
        voucher_code:     code,
        client_name:      'Lead via Link Direto',
        interest_type:    ['reparo_celular', 'celular', 'reparo_notebook', 'notebook'].includes(serviceKey) ? 'manutencao' : 'contato',
        marketing_source: source,
        status:           'pending',
        utm_parameters:   { source: utmSource, campaign: utmCampaign, ref },
      })
    } catch (err) {
      console.error('[REDIRECT/WA] Error creating voucher or lead:', err)
      // Fallback code generation if DB fails (less ideal but prevents 500)
      code = `BPC-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    }
  }

  const message =
    `Olá! Vim pelo site da Cyber Informática.\n\n` +
    `🎟️ Meu voucher: *${code}*\n\n` +
    `Gostaria de informações sobre ${service}.\n\n` +
    `Pode me atender?`

  const waUrl = `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(message)}`
  
  const response = NextResponse.redirect(waUrl, { status: 302 })
  
  // Set cookie for 24h
  if (code) {
    response.cookies.set('cyber_wa_voucher', code, {
      maxAge: 60 * 60 * 24,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    })
  }

  return response
}
