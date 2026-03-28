import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl
  const code        = searchParams.get('code')?.toUpperCase().trim()
  const product_id  = searchParams.get('product_id')
  const category    = searchParams.get('category')

  if (!code) {
    return NextResponse.json({ valid: false, reason: 'Código não informado' }, { status: 400 })
  }

  const { data: coupon, error } = await supabaseAdmin
    .from('discount_coupons')
    .select('*')
    .eq('code', code)
    .single()

  if (error || !coupon) {
    return NextResponse.json({ valid: false, reason: 'Cupom não encontrado' })
  }

  if (!coupon.is_active) {
    return NextResponse.json({ valid: false, reason: 'Cupom inativo' })
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, reason: 'Cupom expirado' })
  }

  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    return NextResponse.json({ valid: false, reason: 'Cupom esgotado' })
  }

  // Scope validation
  if (coupon.scope === 'product') {
    if (!product_id || coupon.product_id !== product_id) {
      return NextResponse.json({
        valid: false,
        reason: `Cupom válido apenas para o produto específico`,
      })
    }
  }

  if (coupon.scope === 'category') {
    if (!category || coupon.category !== category) {
      return NextResponse.json({
        valid: false,
        reason: `Cupom válido apenas para a categoria: ${coupon.category}`,
      })
    }
  }

  return NextResponse.json({
    valid: true,
    coupon_id:      coupon.id,
    code:           coupon.code,
    discount_type:  coupon.discount_type,
    discount_value: coupon.discount_value,
    scope:          coupon.scope,
    remaining_uses: coupon.max_uses !== null ? coupon.max_uses - coupon.used_count : null,
  })
}
