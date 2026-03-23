import type { VoucherStatus, VoucherSource } from './voucher'

export type { VoucherStatus, VoucherSource }

export interface MaintenanceOrder {
  id: string
  voucher_code: string
  source: VoucherSource
  status: VoucherStatus
  customer_name: string
  customer_phone: string | null
  equipment_type: string | null
  problem_description: string | null
  order_value: number | null
  final_value: number | null
  cost_value: number | null
  commission_owner: number | null
  commission_tech: number | null
  commission_value: number | null
  payment_status: string | null
  external_id: string | null
  performed_by_partner: boolean | null
  delivered_at: string | null
  created_at: string
}

export interface MaintenanceOrderRow {
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
