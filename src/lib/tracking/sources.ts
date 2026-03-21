import type { VoucherSource } from '@/types/voucher'

const SOURCE_LABELS: Record<VoucherSource, string> = {
  whatsapp_site: 'WhatsApp (Site)',
  instagram_dm:  'Instagram DM',
  facebook_dm:   'Facebook DM',
  form:          'Formulário',
  google_ads:    'Google Ads',
  organic:       'Orgânico',
}

export function sourceLabel(source: VoucherSource | string): string {
  return SOURCE_LABELS[source as VoucherSource] ?? source
}

/** Maps common UTM source values to VoucherSource */
export function utmToVoucherSource(utmSource?: string | null): VoucherSource {
  switch ((utmSource ?? '').toLowerCase()) {
    case 'instagram': return 'instagram_dm'
    case 'facebook':  return 'facebook_dm'
    case 'google':    return 'google_ads'
    default:          return 'organic'
  }
}
