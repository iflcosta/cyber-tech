import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import type {
  CreateVoucherParams,
  VoucherResult,
  VoucherStatus,
  VoucherSource,
} from '@/types/voucher'

const VOUCHER_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const VOUCHER_PREFIX = 'BPC'
const VOUCHER_CODE_LENGTH = 4
const MAX_GENERATION_ATTEMPTS = 5

// ---------------------------------------------------------------------------
// Code generation
// ---------------------------------------------------------------------------

export function generateVoucherCode(): string {
  const code = Array.from(
    { length: VOUCHER_CODE_LENGTH },
    () => VOUCHER_CHARS[Math.floor(Math.random() * VOUCHER_CHARS.length)]
  ).join('')
  return `${VOUCHER_PREFIX}-${code}`
}

// ---------------------------------------------------------------------------
// Internal helper — maps a DB row to VoucherResult
// ---------------------------------------------------------------------------

interface MaintenanceOrderRow {
  voucher_code: string
  source: string
  status: string
  customer_phone: string | null
  customer_name: string
  equipment_type: string | null
  commission_owner: number | null
  commission_tech: number | null
  created_at: string
}

function rowToVoucherResult(row: MaintenanceOrderRow): VoucherResult {
  return {
    code: row.voucher_code,
    source: (row.source ?? 'organic') as VoucherSource,
    status: row.status as VoucherStatus,
    customerPhone: row.customer_phone ?? undefined,
    customerName: row.customer_name ?? undefined,
    serviceType: row.equipment_type ?? undefined,
    commissionOwner: row.commission_owner ?? 0,
    commissionTech: row.commission_tech ?? 0,
    createdAt: row.created_at,
  }
}

// ---------------------------------------------------------------------------
// createVoucher
// Idempotent when externalId is provided: returns existing voucher if found
// ---------------------------------------------------------------------------

export async function createVoucher(
  params: CreateVoucherParams
): Promise<VoucherResult> {
  // ── Idempotency: check externalId before generating a new code ──────────
  if (params.externalId) {
    try {
      const { data: existing } = await supabase
        .from('maintenance_orders')
        .select(
          'voucher_code, source, status, customer_phone, customer_name, equipment_type, commission_owner, commission_tech, created_at'
        )
        .eq('external_id', params.externalId)
        .maybeSingle()

      if (existing) {
        console.log(
          `[VOUCHER] Returning existing voucher for externalId=${params.externalId}`
        )
        return rowToVoucherResult(existing as MaintenanceOrderRow)
      }
    } catch (err) {
      // Non-fatal — fall through to create a new voucher
      console.warn('[VOUCHER] externalId lookup failed, creating new:', err)
    }
  }

  // ── Generate a unique code — retry if collision ─────────────────────────
  let code = ''
  let attempts = 0

  while (attempts < MAX_GENERATION_ATTEMPTS) {
    attempts++
    const candidate = generateVoucherCode()

    try {
      const { data, error } = await supabase
        .from('maintenance_orders')
        .select('voucher_code')
        .eq('voucher_code', candidate)
        .maybeSingle()

      if (error) throw new Error(`Supabase select error: ${error.message}`)

      if (!data) {
        code = candidate
        break
      }
    } catch (err) {
      console.error('[VOUCHER] Error checking duplicate code:', err)
      throw err
    }
  }

  if (!code) {
    throw new Error(
      `[VOUCHER] Failed to generate a unique code after ${MAX_GENERATION_ATTEMPTS} attempts`
    )
  }

  // ── Calculate commissions ───────────────────────────────────────────────
  // owner: 8% ecossistema (sem custo disponível na criação — recalculado no fechamento)
  // tech: 50% do lucro (final - custo) — calculado no fechamento via updateVoucherStatus
  const commissionOwner =
    params.orderValue != null ? params.orderValue * 0.08 : 0
  const commissionTech = 0 // recalculado no fechamento quando custo for informado

  // ── Persist to maintenance_orders ───────────────────────────────────────
  try {
    const insertPayload: Record<string, unknown> = {
      voucher_code: code,
      source: params.source,
      status: 'pending',
      customer_name: params.customerName ?? 'Não informado',
      customer_phone: params.customerPhone ?? null,
      equipment_type: params.serviceType ?? null,
      commission_owner: commissionOwner,
      commission_tech: commissionTech,
      order_value: params.orderValue ?? null,
      external_id: params.externalId ?? null,
    }

    const { data, error } = await supabase
      .from('maintenance_orders')
      .insert(insertPayload)
      .select()
      .single()

    if (error) throw new Error(`Supabase insert error: ${error.message}`)

    return rowToVoucherResult(data as MaintenanceOrderRow)
  } catch (err) {
    console.error('[VOUCHER] Error creating voucher:', err)
    throw err
  }
}

// ---------------------------------------------------------------------------
// getVoucherByCode
// ---------------------------------------------------------------------------

export async function getVoucherByCode(
  code: string
): Promise<VoucherResult | null> {
  try {
    const { data, error } = await supabase
      .from('maintenance_orders')
      .select(
        'voucher_code, source, status, customer_phone, customer_name, equipment_type, commission_owner, commission_tech, created_at'
      )
      .eq('voucher_code', code)
      .maybeSingle()

    if (error) throw new Error(`Supabase select error: ${error.message}`)
    if (!data) return null

    return rowToVoucherResult(data as MaintenanceOrderRow)
  } catch (err) {
    console.error('[VOUCHER] Error fetching voucher:', err)
    throw err
  }
}

// ---------------------------------------------------------------------------
// updateVoucherStatus
// Optionally recalculates commissions when orderValue is provided
// ---------------------------------------------------------------------------

export async function updateVoucherStatus(
  code: string,
  status: VoucherStatus,
  orderValue?: number
): Promise<void> {
  try {
    const updatePayload: Record<string, unknown> = { status }

    if (status === 'delivered') {
      updatePayload['delivered_at'] = new Date().toISOString()
    }

    if (orderValue != null) {
      updatePayload['order_value'] = orderValue
      // 8% ecossistema (5% se > 8000); tech = 50% do lucro, calculado no admin ao fechar
      updatePayload['commission_owner'] = orderValue > 8000 ? orderValue * 0.05 : orderValue * 0.08
    }

    const { error } = await supabase
      .from('maintenance_orders')
      .update(updatePayload)
      .eq('voucher_code', code)

    if (error) throw new Error(`Supabase update error: ${error.message}`)
  } catch (err) {
    console.error('[VOUCHER] Error updating voucher status:', err)
    throw err
  }
}

// ---------------------------------------------------------------------------
// linkVoucherToPhone
// ---------------------------------------------------------------------------

export async function linkVoucherToPhone(
  code: string,
  phone: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('maintenance_orders')
      .update({ customer_phone: phone })
      .eq('voucher_code', code)

    if (error) throw new Error(`Supabase update error: ${error.message}`)
  } catch (err) {
    console.error('[VOUCHER] Error linking phone to voucher:', err)
    throw err
  }
}
