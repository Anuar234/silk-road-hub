import type { NextApiRequest, NextApiResponse } from 'next'

export default function notAnApiRoute(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Allow', '')
  return res.status(404).json({ error: 'NOT_FOUND' })
}

type RateLimitEntry = {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

const CLEANUP_INTERVAL_MS = 60_000

let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key)
  }
}

function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim()
  return req.socket?.remoteAddress ?? 'unknown'
}

/**
 * Simple in-memory rate limiter for auth endpoints.
 * Returns true if the request is allowed, false if rate-limited.
 */
export function checkRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  opts: { windowMs?: number; maxRequests?: number; prefix?: string } = {},
): boolean {
  const { windowMs = 60_000, maxRequests = 10, prefix = 'auth' } = opts
  const ip = getClientIp(req)
  const key = `${prefix}:${ip}`
  const now = Date.now()

  cleanup()

  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  entry.count++

  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    res.setHeader('Retry-After', String(retryAfter))
    res.status(429).json({ error: 'TOO_MANY_REQUESTS', message: `Слишком много запросов. Повторите через ${retryAfter} сек.` })
    return false
  }

  return true
}
