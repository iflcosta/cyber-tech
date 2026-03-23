/**
 * Persistent rate limiter using Upstash Redis when available,
 * falling back to an in-memory map for local development.
 *
 * To enable persistent rate limiting in production:
 *   1. Create a free Redis database at https://upstash.com
 *   2. Add to your .env.local (and Vercel project settings):
 *        UPSTASH_REDIS_REST_URL=https://...upstash.io
 *        UPSTASH_REDIS_REST_TOKEN=AX...
 */

export interface RateLimitResult {
  limited: boolean
  remaining: number
  reset: number // unix timestamp ms
}

// ---------------------------------------------------------------------------
// In-memory fallback (local dev / no Upstash configured)
// ---------------------------------------------------------------------------

interface InMemoryEntry { count: number; resetAt: number }
const memoryStore = new Map<string, InMemoryEntry>()

function checkInMemory(
  key: string,
  max: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const entry = memoryStore.get(key)

  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs })
    return { limited: false, remaining: max - 1, reset: now + windowMs }
  }

  if (entry.count >= max) {
    return { limited: true, remaining: 0, reset: entry.resetAt }
  }

  entry.count++
  return { limited: false, remaining: max - entry.count, reset: entry.resetAt }
}

// ---------------------------------------------------------------------------
// Upstash Redis sliding window
// ---------------------------------------------------------------------------

async function checkUpstash(
  url: string,
  token: string,
  key: string,
  max: number,
  windowMs: number
): Promise<RateLimitResult> {
  const windowSec = Math.ceil(windowMs / 1000)
  const now = Date.now()

  // Sliding window via MULTI/EXEC pipeline
  const pipeline = [
    ['ZADD', key, now.toString(), now.toString()],
    ['ZREMRANGEBYSCORE', key, '-inf', (now - windowMs).toString()],
    ['ZCARD', key],
    ['EXPIRE', key, windowSec.toString()],
  ]

  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(pipeline),
  })

  if (!res.ok) {
    // Fail open — do not block requests on Redis errors
    console.warn('[RATE LIMIT] Upstash request failed, allowing through:', res.status)
    return { limited: false, remaining: max, reset: now + windowMs }
  }

  const data = await res.json()
  // data[2].result = ZCARD (current count)
  const count: number = data[2]?.result ?? 0
  const reset = now + windowMs

  if (count > max) {
    return { limited: true, remaining: 0, reset }
  }

  return { limited: false, remaining: max - count, reset }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function checkRateLimit(
  ip: string,
  options: { max?: number; windowMs?: number; prefix?: string } = {}
): Promise<RateLimitResult> {
  const { max = 10, windowMs = 60_000, prefix = 'rl' } = options
  const key = `${prefix}:${ip}`

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (redisUrl && redisToken) {
    try {
      return await checkUpstash(redisUrl, redisToken, key, max, windowMs)
    } catch (err) {
      // Fail open — Upstash unreachable
      console.warn('[RATE LIMIT] Upstash error, falling back to allow:', err)
      return { limited: false, remaining: max, reset: Date.now() + windowMs }
    }
  }

  // Local dev fallback
  return checkInMemory(key, max, windowMs)
}
