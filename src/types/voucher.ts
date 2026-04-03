export type VoucherStatus =
  | 'pending'
  | 'in_progress'
  | 'analysis'
  | 'parts'
  | 'upgrade'
  | 'testing'
  | 'ready'
  | 'converted'
  | 'delivered'
  | 'cancelled'

export type VoucherSource =
  | 'whatsapp_site'
  | 'instagram_dm'
  | 'facebook_dm'
  | 'form'
  | 'google_ads'
  | 'organic'

export interface CreateVoucherParams {
  source: VoucherSource
  customerPhone?: string
  customerName?: string
  serviceType?: string
  orderValue?: number
  /** External ID for idempotency (e.g. Manychat subscriber ID) */
  externalId?: string
}

export interface VoucherResult {
  code: string
  source: VoucherSource
  status: VoucherStatus
  customerPhone?: string
  customerName?: string
  serviceType?: string
  commissionOwner: number
  commissionTech: number
  createdAt: string
}
