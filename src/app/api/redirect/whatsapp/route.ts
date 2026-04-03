import { NextRequest, NextResponse } from 'next/server'
import { createVoucher } from '@/lib/voucher'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { utmToVoucherSource } from '@/lib/tracking/sources'
import { brand } from '@/lib/brand'

const SERVICE_LABELS: Record<string, string> = {
  hardware_premium: 'hardware premium',
  notebook_gamer:   'notebook gamer',
  estacao_trabalho: 'estação de trabalho',
  montagem_pc:      'montagem de PC',
  celular:          'hardware premium',
  notebook:         'notebook gamer',
  desktop:          'estação de trabalho',
  outro:            'atendimento',
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl
  const utmSource   = searchParams.get('utm_source')
  const utmCampaign = searchParams.get('utm_campaign')
  const ref         = searchParams.get('ref')
  const serviceKey  = searchParams.get('service') ?? 'outro'
  const coupon      = searchParams.get('coupon')?.toUpperCase().trim()

  const service = SERVICE_LABELS[serviceKey] ?? 'atendimento'
  const source = utmToVoucherSource(utmSource)

  // --- COUPON FLOW: skip voucher creation, send coupon directly ---
  if (coupon) {
    const couponMessage =
      `Olá! Vim pelo Google e quero o desconto usando o CUPOM: *${coupon}*\n\n` +
      `Gostaria de informações sobre ${service}.\n\n` +
      `Pode me atender?`
    const waUrl = `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(couponMessage)}`
    return NextResponse.redirect(waUrl, { status: 302 })
  }

  // --- STANDARD FLOW: dynamic voucher generation ---

  // Reuse existing voucher from cookie
  const cookieCode = req.cookies.get('cyber_wa_voucher')?.value
  
  let code = ''
  
  // If we have a cookie, check if it exists in the database
  if (cookieCode) {
    const { data: voucherExists } = await supabaseAdmin
      .from('maintenance_orders')
      .select('voucher_code')
      .eq('voucher_code', cookieCode)
      .maybeSingle()
    
    if (voucherExists) {
      code = cookieCode
      console.log(`[REDIRECT/WA] Reusing existing DB voucher: ${code}`)
    }
  }

  // If no valid code found in cookie/DB, create a new one
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
      console.log(`[REDIRECT/WA] Created new voucher: ${code}`)

      // 2. Track Lead
      const { error: leadError } = await supabaseAdmin.from('leads').insert({
        voucher_code:     code,
        client_name:      'Lead via Link Direto',
        interest_type:    ['hardware_premium', 'celular', 'notebook_gamer', 'notebook'].includes(serviceKey) ? 'venda' : 'contato',
        marketing_source: source,
        status:           'pending',
        utm_parameters:   { source: utmSource, campaign: utmCampaign, ref },
      })

      if (leadError) console.error('[REDIRECT/WA] Lead insert error:', leadError)
      
    } catch (err: any) {
      console.error('[REDIRECT/WA] Critical error creating voucher:', err)
      return NextResponse.json({ 
        error: 'Erro técnico ao gerar seu voucher', 
        details: err.message || 'Erro desconhecido'
      }, { status: 500 })
    }
  }

  const message =
    `Olá! Vim pelo site da Cyber Informática.\n\n` +
    `🎫 Meu voucher: *${code}*\n\n` +
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
