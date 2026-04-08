import { randomBytes, timingSafeEqual } from 'node:crypto'
import type { NextApiRequest, NextApiResponse } from 'next'

export type ServerRole = 'buyer' | 'seller' | 'admin'
export type VerificationStatus = 'pending' | 'verified' | 'rejected'

type ServerUser = {
  id: string
  email: string
  displayName: string
  role: ServerRole
  verified: boolean
  emailVerified: boolean
  companyName: string | null
  bin: string | null
  position: string | null
  phone: string | null
  verificationStatus: VerificationStatus
  companyDocs: string[]
}

type CredentialRecord = {
  login: string
  password: string
  id: string
  role: ServerRole
  displayName: string
  verified: boolean
  emailVerified?: boolean
  companyName?: string
  bin?: string
  position?: string
}

type SessionRecord = {
  id: string
  user: ServerUser
  csrfToken: string
  expiresAt: number
}

type PublicUserPayload = {
  id: string
  email: string
  displayName: string
  role: ServerRole
  verified: boolean
  emailVerified: boolean
  companyName: string | null
  bin: string | null
  position: string | null
  phone: string | null
  verificationStatus: VerificationStatus
  companyDocs: string[]
}

const SESSION_COOKIE = 'srh_session'
const XSRF_COOKIE = 'XSRF-TOKEN'
const SESSION_TTL_MS = 1000 * 60 * 60 * 12
const isProduction = process.env.NODE_ENV === 'production'
const allowDemoAuth = process.env.ALLOW_DEMO_AUTH !== 'false'
// Demo/localhost often runs over HTTP; make Secure cookie opt-in so auth works reliably.
const useSecureCookies = process.env.SRH_SECURE_COOKIES === 'true'

const demoCredentials: CredentialRecord[] = [
  {
    login: 'Test',
    password: 'Test123',
    id: 'buyer-test',
    role: 'buyer',
    displayName: 'Test',
    verified: false,
    emailVerified: false,
  },
  {
    login: 'BuyerVerified',
    password: 'Test123',
    id: 'buyer-verified',
    role: 'buyer',
    displayName: 'Покупатель (почта подтверждена)',
    verified: true,
    emailVerified: true,
  },
  {
    login: 'Test123',
    password: 'Test123',
    id: 'seller-test123',
    role: 'seller',
    displayName: 'Test123 (продавец)',
    verified: true,
    emailVerified: true,
    companyName: 'Test Company',
    bin: '000000000001',
    position: 'Менеджер по продажам',
  },
  {
    login: 'Admin',
    password: 'Admin',
    id: 'admin-main',
    role: 'admin',
    displayName: 'Администратор',
    verified: true,
    emailVerified: true,
  },
  {
    login: 'AdminPanel',
    password: 'Admin',
    id: 'admin-panel',
    role: 'admin',
    displayName: 'Администратор',
    verified: true,
    emailVerified: true,
  },
]

const sessions = new Map<string, SessionRecord>()

function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex')
}

function buildCookie(name: string, value: string, maxAgeSeconds?: number): string {
  const sameSite = 'Lax'
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    `SameSite=${sameSite}`,
    useSecureCookies ? 'Secure' : '',
    maxAgeSeconds === undefined ? '' : `Max-Age=${maxAgeSeconds}`,
    maxAgeSeconds === 0 ? 'Expires=Thu, 01 Jan 1970 00:00:00 GMT' : '',
    name === SESSION_COOKIE ? 'HttpOnly' : '',
  ].filter(Boolean)
  return parts.join('; ')
}

function safeCompare(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a)
  const bBuffer = Buffer.from(b)
  if (aBuffer.length !== bBuffer.length) return false
  return timingSafeEqual(aBuffer, bBuffer)
}

function parseEnvCredentials(): CredentialRecord[] {
  const raw = process.env.SRH_AUTH_USERS_JSON
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as CredentialRecord[]
    return parsed.filter((item) => Boolean(item.login && item.password && item.role))
  } catch {
    return []
  }
}

function getCredentialRecords(): CredentialRecord[] {
  const envRecords = parseEnvCredentials()
  if (envRecords.length > 0) return envRecords
  return allowDemoAuth ? demoCredentials : []
}

function toServerUser(record: CredentialRecord): ServerUser {
  return {
    id: record.id,
    email: record.login,
    displayName: record.displayName,
    role: record.role,
    verified: record.verified,
    emailVerified: record.emailVerified ?? record.verified,
    companyName: record.companyName ?? null,
    bin: record.bin ?? null,
    position: record.position ?? null,
    phone: null,
    verificationStatus: record.verified ? 'verified' : 'pending',
    companyDocs: [],
  }
}

function getValidSession(sessionId: string | undefined): SessionRecord | null {
  if (!sessionId) return null
  const session = sessions.get(sessionId)
  if (!session) return null
  if (session.expiresAt < Date.now()) {
    sessions.delete(sessionId)
    return null
  }
  return session
}

export function getSession(req: NextApiRequest): SessionRecord | null {
  return getValidSession(req.cookies[SESSION_COOKIE])
}

export function getUserPayload(session: SessionRecord): PublicUserPayload {
  const { user } = session
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    verified: user.verified,
    emailVerified: user.emailVerified,
    companyName: user.companyName,
    bin: user.bin,
    position: user.position,
    phone: user.phone,
    verificationStatus: user.verificationStatus,
    companyDocs: user.companyDocs,
  }
}

export function createSession(res: NextApiResponse, user: ServerUser): SessionRecord {
  const session: SessionRecord = {
    id: randomToken(24),
    user,
    csrfToken: randomToken(24),
    expiresAt: Date.now() + SESSION_TTL_MS,
  }
  sessions.set(session.id, session)
  res.setHeader('Set-Cookie', [
    buildCookie(SESSION_COOKIE, session.id, Math.floor(SESSION_TTL_MS / 1000)),
    buildCookie(XSRF_COOKIE, session.csrfToken, Math.floor(SESSION_TTL_MS / 1000)),
  ])
  return session
}

export function clearSession(res: NextApiResponse, req?: NextApiRequest): void {
  const sessionId = req?.cookies[SESSION_COOKIE]
  if (sessionId) sessions.delete(sessionId)
  res.setHeader('Set-Cookie', [buildCookie(SESSION_COOKIE, '', 0), buildCookie(XSRF_COOKIE, '', 0)])
}

export function issueCsrfToken(res: NextApiResponse): { csrfToken: string } {
  const csrfToken = randomToken(24)
  res.setHeader('Set-Cookie', buildCookie(XSRF_COOKIE, csrfToken, 60 * 60))
  return { csrfToken }
}

export function assertCsrf(req: NextApiRequest): boolean {
  const cookieToken = req.cookies[XSRF_COOKIE]
  const headerToken = req.headers['x-csrf-token']
  const normalizedHeader = Array.isArray(headerToken) ? headerToken[0] : headerToken
  if (!cookieToken || !normalizedHeader) return false
  return safeCompare(cookieToken, normalizedHeader)
}

export function authenticateCredentials(email: string, password: string): ServerUser | null {
  const match = getCredentialRecords().find((record) => record.login === email && record.password === password)
  if (match) return toServerUser(match)
  return authenticateRegisteredUser(email, password)
}

export function isDemoAuthEnabled(): boolean {
  return allowDemoAuth || !isProduction
}

export function requireSession(
  req: NextApiRequest,
  res: NextApiResponse,
  roles?: ServerRole[],
): SessionRecord | null {
  const session = getSession(req)
  if (!session) {
    res.status(401).json({ error: 'UNAUTHORIZED' })
    return null
  }
  if (roles && roles.length > 0 && !roles.includes(session.user.role)) {
    res.status(403).json({ error: 'FORBIDDEN' })
    return null
  }
  return session
}

/* ── Registered users (in-memory store) ── */

const registeredUsers = new Map<string, { user: ServerUser; password: string }>()

export type RegisterInput = {
  email: string
  password: string
  displayName: string
  role: 'buyer' | 'seller'
  phone?: string
  companyName?: string
  bin?: string
  position?: string
}

export function registerUser(input: RegisterInput): ServerUser | { error: string } {
  const emailLower = input.email.trim().toLowerCase()

  // Check demo credentials
  const demoConflict = getCredentialRecords().some((r) => r.login.toLowerCase() === emailLower)
  if (demoConflict || registeredUsers.has(emailLower)) {
    return { error: 'EMAIL_TAKEN' }
  }

  const id = `user-${randomToken(8)}`
  const user: ServerUser = {
    id,
    email: input.email.trim(),
    displayName: input.displayName.trim(),
    role: input.role,
    verified: false,
    emailVerified: false,
    companyName: input.companyName?.trim() ?? null,
    bin: input.bin?.trim() ?? null,
    position: input.position?.trim() ?? null,
    phone: input.phone?.trim() ?? null,
    verificationStatus: 'pending',
    companyDocs: [],
  }

  registeredUsers.set(emailLower, { user, password: input.password })
  return user
}

export function authenticateRegisteredUser(email: string, password: string): ServerUser | null {
  const record = registeredUsers.get(email.trim().toLowerCase())
  if (!record) return null
  if (!safeCompare(record.password, password)) return null
  return record.user
}

export function getAllUsers(): ServerUser[] {
  const demoUsers = getCredentialRecords().map(toServerUser)
  const registered = [...registeredUsers.values()].map((r) => r.user)
  return [...demoUsers, ...registered]
}

export function getUserById(userId: string): ServerUser | null {
  // Check demo users
  const demo = getCredentialRecords().find((r) => r.id === userId)
  if (demo) return toServerUser(demo)
  // Check registered
  for (const { user } of registeredUsers.values()) {
    if (user.id === userId) return user
  }
  return null
}

export function updateUserVerification(userId: string, status: VerificationStatus): ServerUser | null {
  for (const record of registeredUsers.values()) {
    if (record.user.id === userId) {
      record.user.verificationStatus = status
      record.user.verified = status === 'verified'
      return record.user
    }
  }
  return null
}

export function addUserCompanyDoc(userId: string, fileId: string): boolean {
  for (const record of registeredUsers.values()) {
    if (record.user.id === userId) {
      record.user.companyDocs.push(fileId)
      return true
    }
  }
  return false
}

export default function notAnApiRoute(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Allow', '')
  return res.status(404).json({ error: 'NOT_FOUND' })
}
