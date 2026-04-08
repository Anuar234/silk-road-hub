import { NextResponse, type NextRequest } from 'next/server'

function base64Nonce(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

function createNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return base64Nonce(bytes)
}

function buildStrictCsp(nonce: string): string {
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    // Next.js injects runtime scripts; allow only nonce'd inline.
    `script-src 'self' 'nonce-${nonce}'`,
    // Keep styles compatible with SSR and existing Tailwind; tighten later if needed.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https:",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ]
  return directives.join('; ')
}

export function middleware(req: NextRequest) {
  const strictEnabled = req.nextUrl.searchParams.get('__csp') === 'strict' || process.env.CSP_STRICT_ENABLED === 'true'
  if (!strictEnabled) {
    return NextResponse.next()
  }

  const nonce = createNonce()
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-srh-nonce', nonce)

  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  res.headers.set('Content-Security-Policy', buildStrictCsp(nonce))
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'SAMEORIGIN')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

