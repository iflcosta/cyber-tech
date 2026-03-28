export type TabId = 'dashboard' | 'leads' | 'vendas' | 'maintenance' | 'products' | 'reviews' | 'coupons'

export type Executor = 'owner' | 'iago' | 'partner'

export type CommissionType = 'percent' | 'value'

export interface ConsumedProduct {
  product_id: string
  quantity: number
  name?: string
  current_stock?: number
  price?: number
}

export interface CommissionForm {
  finalValue: string
  costValue: string
  ecosystemCaptured: boolean
  isAssembly: boolean
  executor: Executor
  customCommissionType: CommissionType
  customCommissionAmount: string
  consumedProducts: ConsumedProduct[]
}

export interface PdvForm {
  customerName: string
  discountType: 'fixed' | 'percentage'
  discountValue: number
  ecosystemCaptured: boolean
  isAssembly: boolean
  executor: Executor
  customCommissionType: CommissionType
  customCommissionAmount: string
  manualFinalValue: string
  serviceDescription: string
  consumedProducts: ConsumedProduct[]
  couponCode?: string
  couponId?: string
}

export interface DiscountCoupon {
  id: string
  code: string
  owner_id: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  scope: 'universal' | 'category' | 'product'
  product_id?: string | null
  category?: string | null
  max_uses?: number | null
  used_count: number
  expires_at?: string | null
  is_active: boolean
  created_at: string
}

export interface AdminStats {
  totalLeadValue: number
  convertedCount: number
  pendingCount: number
  avgTicket: number
}
