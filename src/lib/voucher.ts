import { supabase } from '@/lib/supabase'
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
    source: (row.source ?? 'whatsapp_site') as VoucherSource,
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
// ---------------------------------------------------------------------------

export async function createVoucher(
  params: CreateVoucherParams
): Promise<VoucherResult> {
  let code = ''
  let attempts = 0

  // Generate a unique code — retry if duplicate found
  while (attempts < MAX_GENERATION_ATTEMPTS) {
    attempts++
    const candidate = generateVoucherCode()

    try {
      const { data, error } = await supabase
        .from('maintenance_orders')
        .select('voucher_code')
        .eq('voucher_code', candidate)
        .maybeSingle()

      if (error) {
        throw new Error(`Supabase select error: ${error.message}`)
      }

      if (!data) {
        // No duplicate found — use this code
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

  // Persist to maintenance_orders
  try {
    const insertPayload: Record<string, unknown> = {
      voucher_code: code,
      source: params.source,
      status: 'pending',
      customer_name: params.customerName ?? 'Não informado',
      customer_phone: params.customerPhone ?? null,
      equipment_type: params.serviceType ?? null,
      technician_id: params.technicianId ?? null,
      commission_owner: 0,
      commission_tech: 0,
    }

    const { data, error } = await supabase
      .from('maintenance_orders')
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      throw new Error(`Supabase insert error: ${error.message}`)
    }

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

    if (error) {
      throw new Error(`Supabase select error: ${error.message}`)
    }

    if (!data) return null

    return rowToVoucherResult(data as MaintenanceOrderRow)
  } catch (err) {
    console.error('[VOUCHER] Error fetching voucher:', err)
    throw err
  }
}

// ---------------------------------------------------------------------------
// updateVoucherStatus
// ---------------------------------------------------------------------------

export async function updateVoucherStatus(
  code: string,
  status: VoucherStatus
): Promise<void> {
  try {
    const updatePayload: Record<string, unknown> = { status }

    if (status === 'delivered') {
      updatePayload['delivered_at'] = new Date().toISOString()
    }

    const { error } = await supabase
      .from('maintenance_orders')
      .update(updatePayload)
      .eq('voucher_code', code)

    if (error) {
      throw new Error(`Supabase update error: ${error.message}`)
    }
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

    if (error) {
      throw new Error(`Supabase update error: ${error.message}`)
    }
  } catch (err) {
    console.error('[VOUCHER] Error linking phone to voucher:', err)
    throw err
  }
}
