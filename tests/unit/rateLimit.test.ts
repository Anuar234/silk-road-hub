import { describe, expect, it, vi } from 'vitest'
import { checkRateLimit } from '../../pages/api/_lib/rateLimit'

function createMockReq(ip = '127.0.0.1') {
  return {
    headers: { 'x-forwarded-for': ip },
    socket: { remoteAddress: ip },
  } as Parameters<typeof checkRateLimit>[0]
}

function createMockRes() {
  const headers: Record<string, string> = {}
  const res = {
    statusCode: 200,
    setHeader: vi.fn((key: string, value: string) => { headers[key] = value }),
    status: vi.fn((code: number) => {
      res.statusCode = code
      return res
    }),
    json: vi.fn(),
    _headers: headers,
  }
  return res as unknown as Parameters<typeof checkRateLimit>[1] & { statusCode: number; json: ReturnType<typeof vi.fn> }
}

describe('rate limiter', () => {
  it('allows requests under the limit', () => {
    const req = createMockReq('10.0.0.1')
    const res = createMockRes()

    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(req, res, { prefix: 'test-allow', maxRequests: 5, windowMs: 60_000 })).toBe(true)
    }
  })

  it('blocks requests over the limit', () => {
    const req = createMockReq('10.0.0.2')
    const res = createMockRes()

    for (let i = 0; i < 3; i++) {
      checkRateLimit(req, res, { prefix: 'test-block', maxRequests: 3, windowMs: 60_000 })
    }

    const blocked = checkRateLimit(req, res, { prefix: 'test-block', maxRequests: 3, windowMs: 60_000 })
    expect(blocked).toBe(false)
    expect(res.statusCode).toBe(429)
  })

  it('uses different buckets for different prefixes', () => {
    const req = createMockReq('10.0.0.3')
    const res = createMockRes()

    for (let i = 0; i < 2; i++) {
      checkRateLimit(req, res, { prefix: 'bucket-a', maxRequests: 2, windowMs: 60_000 })
    }

    // Different prefix should not be blocked
    const allowed = checkRateLimit(req, res, { prefix: 'bucket-b', maxRequests: 2, windowMs: 60_000 })
    expect(allowed).toBe(true)
  })

  it('uses different buckets for different IPs', () => {
    const res = createMockRes()

    for (let i = 0; i < 2; i++) {
      checkRateLimit(createMockReq('10.0.0.4'), res, { prefix: 'ip-test', maxRequests: 2, windowMs: 60_000 })
    }

    // Different IP should not be blocked
    const allowed = checkRateLimit(createMockReq('10.0.0.5'), res, { prefix: 'ip-test', maxRequests: 2, windowMs: 60_000 })
    expect(allowed).toBe(true)
  })
})
