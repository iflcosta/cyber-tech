import { describe, it, expect, beforeEach, vi } from 'vitest'
import { checkRateLimit } from '@/lib/rate-limit'

// The in-memory store is module-level, so we need to reset env vars before each test
beforeEach(() => {
  // Ensure Upstash env vars are NOT set so tests use the in-memory fallback
  delete process.env.UPSTASH_REDIS_REST_URL
  delete process.env.UPSTASH_REDIS_REST_TOKEN
})

describe('checkRateLimit (in-memory fallback)', () => {
  it('allows the first request', async () => {
    const ip = `test-ip-${Date.now()}-${Math.random()}`
    const result = await checkRateLimit(ip, { max: 3, windowMs: 60_000 })
    expect(result.limited).toBe(false)
    expect(result.remaining).toBe(2)
  })

  it('tracks count correctly across multiple requests', async () => {
    const ip = `test-ip-${Date.now()}-${Math.random()}`
    await checkRateLimit(ip, { max: 3, windowMs: 60_000 })
    await checkRateLimit(ip, { max: 3, windowMs: 60_000 })
    const result = await checkRateLimit(ip, { max: 3, windowMs: 60_000 })
    expect(result.limited).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('blocks after max requests', async () => {
    const ip = `test-ip-${Date.now()}-${Math.random()}`
    for (let i = 0; i < 3; i++) {
      await checkRateLimit(ip, { max: 3, windowMs: 60_000 })
    }
    const result = await checkRateLimit(ip, { max: 3, windowMs: 60_000 })
    expect(result.limited).toBe(true)
    expect(result.remaining).toBe(0)
  })

  it('isolates different IPs independently', async () => {
    const ts = Date.now()
    const ip1 = `ip1-${ts}`
    const ip2 = `ip2-${ts}`
    for (let i = 0; i < 3; i++) {
      await checkRateLimit(ip1, { max: 3, windowMs: 60_000 })
    }
    // ip1 should be limited, ip2 should not
    const r1 = await checkRateLimit(ip1, { max: 3, windowMs: 60_000 })
    const r2 = await checkRateLimit(ip2, { max: 3, windowMs: 60_000 })
    expect(r1.limited).toBe(true)
    expect(r2.limited).toBe(false)
  })

  it('includes a reset timestamp in the future', async () => {
    const ip = `test-ip-${Date.now()}-${Math.random()}`
    const before = Date.now()
    const result = await checkRateLimit(ip, { max: 5, windowMs: 10_000 })
    expect(result.reset).toBeGreaterThanOrEqual(before + 9_000)
  })
})
