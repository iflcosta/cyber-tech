export type LeadStatus =
  | 'pending'
  | 'contacted'
  | 'converted'
  | 'dismissed'
  | 'upgrade'
  | 'building'
  | 'testing'
  | 'ready'

export type InterestType =
  | 'venda'
  | 'upgrade'
  | 'pc_build'
  | 'compra'
  | 'showroom'
  | 'duvida'
  | 'link_direto'
  | 'contato'

export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'awaiting_payment'

export interface Lead {
  id: string
  client_name: string | null
  whatsapp: string | null
  interest_type: InterestType | null
  intent_type: string | null
  description: string | null
  status: LeadStatus
  final_value: number | null
  cost_value: number | null
  commission_value: number | null
  commission_ecosystem: boolean | null
  commission_service: boolean | null
  performed_by_partner: boolean | null
  payment_status: PaymentStatus | null
  voucher_code: string | null
  marketing_source: string | null
  utm_parameters: Record<string, unknown> | null
  session_id: string | null
  converted_at: string | null
  created_at: string
}

export interface TrackLeadParams {
  client_name?: string
  whatsapp?: string
  interest_type?: InterestType
  intent_type?: string
  description?: string
  status?: LeadStatus
  voucher_code?: string
  marketing_source?: string
  utm_parameters?: Record<string, unknown>
}
