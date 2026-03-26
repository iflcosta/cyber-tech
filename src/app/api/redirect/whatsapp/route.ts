import { NextRequest, NextResponse } from 'next/server'
import { createVoucher } from '@/lib/voucher'
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

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl
  const utmSource   = searchParams.get('utm_source')
  const utmCampaign = searchParams.get('utm_campaign')
  const ref         = searchParams.get('ref')
  const serviceKey  = searchParams.get('service') ?? 'outro'

  const service = SERVICE_LABELS[serviceKey] ?? 'atendimento'
  const source = utmToVoucherSource(utmSource)

  // Reuse existing voucher from cookie
  const existingCode = req.cookies.get('cyber_wa_voucher')?.value
  
  let code = existingCode

  if (!code) {
    try {
      // 1. Create maintenance order (Voucher)
      // We use the helper which uses supabaseAdmin
      const voucher = await createVoucher({
        source,
        serviceType: serviceKey,
        customerName: 'Lead via Link Direto',
      })
      code = voucher.code

      // 2. Track Lead (Using supabaseAdmin directly to ensure it works)
      const { error: leadError } = await supabaseAdmin.from('leads').insert({
        voucher_code:     code,
        client_name:      'Lead via Link Direto',
        interest_type:    ['reparo_celular', 'celular', 'reparo_notebook', 'notebook'].includes(serviceKey) ? 'manutencao' : 'contato',
        marketing_source: source,
        status:           'pending',
        utm_parameters:   { source: utmSource, campaign: utmCampaign, ref },
      })

      if (leadError) console.error('[REDIRECT/WA] Lead insert error:', leadError)
      
    } catch (err: any) {
      console.error('[REDIRECT/WA] Error creating voucher:', err)
      // If it fails, we show the error so the user can see what's wrong instead of a silent failure
      return NextResponse.json({ 
        error: 'Falha ao criar voucher no banco de dados', 
        details: err.message || 'Erro desconhecido'
      }, { status: 500 })
    }
  }

  const message =
    `Olá! Vim pelo site da Cyber Informática.\n\n` +
    `🎟️ Meu voucher: *${code}*\n\n` +
    `Gostaria de informações sobre ${service}.\n\n` +
    `Pode me atender?`

  const waUrl = `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(message)}`
  
  const response = NextResponse.redirect(waUrl, { status: 302 })
  
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
