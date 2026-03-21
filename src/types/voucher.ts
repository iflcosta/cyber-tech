export type VoucherStatus = 'pending' | 'in_progress' | 'delivered' | 'cancelled'
export type VoucherSource = 'whatsapp_site' | 'instagram_dm' | 'facebook_dm' | 'form'

export interface CreateVoucherParams {
  source: VoucherSource
  customerPhone?: string
  customerName?: string
  serviceType?: string
  technicianId?: string
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
