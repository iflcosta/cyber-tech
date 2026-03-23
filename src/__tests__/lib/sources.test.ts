import { describe, it, expect } from 'vitest'
import { sourceLabel, utmToVoucherSource } from '@/lib/tracking/sources'

describe('sourceLabel', () => {
  it('returns the human-readable label for known sources', () => {
    expect(sourceLabel('whatsapp_site')).toBe('WhatsApp (Site)')
    expect(sourceLabel('instagram_dm')).toBe('Instagram DM')
    expect(sourceLabel('facebook_dm')).toBe('Facebook DM')
    expect(sourceLabel('form')).toBe('Formulário')
    expect(sourceLabel('google_ads')).toBe('Google Ads')
    expect(sourceLabel('organic')).toBe('Orgânico')
  })

  it('returns the raw value for unknown sources', () => {
    expect(sourceLabel('tiktok')).toBe('tiktok')
    expect(sourceLabel('desconhecido')).toBe('desconhecido')
    expect(sourceLabel('')).toBe('')
  })
})

describe('utmToVoucherSource', () => {
  it('maps instagram → instagram_dm', () => {
    expect(utmToVoucherSource('instagram')).toBe('instagram_dm')
    expect(utmToVoucherSource('INSTAGRAM')).toBe('instagram_dm')
  })

  it('maps facebook → facebook_dm', () => {
    expect(utmToVoucherSource('facebook')).toBe('facebook_dm')
    expect(utmToVoucherSource('Facebook')).toBe('facebook_dm')
  })

  it('maps google → google_ads', () => {
    expect(utmToVoucherSource('google')).toBe('google_ads')
    expect(utmToVoucherSource('GOOGLE')).toBe('google_ads')
  })

  it('falls back to organic for unknown sources', () => {
    expect(utmToVoucherSource('tiktok')).toBe('organic')
    expect(utmToVoucherSource(undefined)).toBe('organic')
    expect(utmToVoucherSource(null)).toBe('organic')
    expect(utmToVoucherSource('')).toBe('organic')
  })
})
