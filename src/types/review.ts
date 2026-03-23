export interface Review {
  id: string
  rating: number
  comment: string | null
  author_name: string | null
  user_name: string | null
  voucher_code: string | null
  is_approved: boolean
  created_at: string
}
