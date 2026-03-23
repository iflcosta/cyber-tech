export type TabId = 'dashboard' | 'leads' | 'vendas' | 'maintenance' | 'products' | 'reviews'

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
}

export interface AdminStats {
  totalLeadValue: number
  convertedCount: number
  pendingCount: number
  avgTicket: number
}
