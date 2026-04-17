/** @type {import('next').NextConfig} */
const strictCspEnabled = process.env.CSP_STRICT_ENABLED === 'true'

const isProduction = process.env.NODE_ENV === 'production'

const baselineCsp = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline' https:",
  // unsafe-eval is needed for Next.js dev mode; stripped in production
  isProduction ? "script-src 'self' 'unsafe-inline'" : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "connect-src 'self' https:",
  "form-action 'self'",
].join('; ')

// Strict CSP requires per-request nonce to keep Next.js runtime working.
// This is emitted by `middleware.ts`. Here we keep baseline as a safe default.
const strictCsp = baselineCsp

const API_BACKEND = process.env.API_BACKEND_URL || 'http://127.0.0.1:8080'

const nextConfig = {
  images: {
    unoptimized: !isProduction,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_BACKEND}/api/:path*`,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: strictCspEnabled ? strictCsp : baselineCsp,
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          ...(process.env.NODE_ENV === 'production'
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=31536000; includeSubDomains; preload',
                },
              ]
            : []),
        ],
      },
    ]
  },
}

export default nextConfig
