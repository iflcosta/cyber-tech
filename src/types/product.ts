export interface Product {
  id: string
  name: string
  slug: string | null
  description: string | null
  category: string
  price: number
  stock_quantity: number
  specs: Record<string, string | number | boolean>
  image_urls: string[]
  sku: string | null
  show_in_showroom: boolean
  show_in_catalog: boolean
  show_in_pcbuilder: boolean
  stock_alert: boolean
  stock_alert_min: number
  performance_score: number | null
  views: number | null
  created_at: string
}

export interface ProductFormData {
  name: string
  slug: string | null
  description: string | null
  category: string
  price: number
  stock_quantity: number
  specs: Record<string, string | number | boolean>
  image_urls: string[]
  sku: string | null
  show_in_showroom: boolean
  show_in_catalog: boolean
  show_in_pcbuilder: boolean
  stock_alert: boolean
  stock_alert_min: number
  performance_score: number | null
}
