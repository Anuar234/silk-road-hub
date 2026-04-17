import type { Role } from '@features/auth/auth'

export type VerificationStatus = 'pending' | 'verified' | 'rejected'

export type ApiUser = {
  id: string
  email: string
  displayName: string
  role: Role
  verified: boolean
  emailVerified: boolean
  companyName: string | null
  bin: string | null
  position: string | null
  phone: string | null
  verificationStatus: VerificationStatus
  companyDocs: string[]
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export async function apiGetCsrfToken(): Promise<string> {
  const existing = readCookie('XSRF-TOKEN')
  if (existing) return existing
  const res = await fetch('/api/auth/csrf', { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to initialize auth security token.')
  const data = (await res.json()) as { csrfToken?: string }
  return data.csrfToken ?? ''
}

export async function apiMe(): Promise<ApiUser | null> {
  const res = await fetch('/api/auth/me', { credentials: 'include' })
  if (res.status === 401) return null
  if (!res.ok) throw new Error('Failed to fetch auth profile.')
  const data = (await res.json()) as { user: ApiUser }
  return data.user
}

export async function apiLogin(args: { email: string; password: string }): Promise<ApiUser> {
  const csrfToken = await apiGetCsrfToken()
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify(args),
  })
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { message?: string }
    throw new Error(payload.message ?? 'Неверный логин или пароль')
  }
  const data = (await res.json()) as { user: ApiUser }
  return data.user
}

export type RegisterArgs = {
  email: string
  password: string
  displayName: string
  role: 'buyer' | 'seller'
  phone?: string
  companyName?: string
  bin?: string
  position?: string
}

export async function apiRegister(args: RegisterArgs): Promise<ApiUser> {
  const csrfToken = await apiGetCsrfToken()
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify(args),
  })
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { message?: string }
    throw new Error(payload.message ?? 'Ошибка регистрации')
  }
  const data = (await res.json()) as { ok: true; data: ApiUser }
  return data.data
}

export async function apiUpdateProfile(updates: {
  displayName?: string
  phone?: string
  companyName?: string
  bin?: string
  position?: string
}): Promise<ApiUser> {
  const csrfToken = await apiGetCsrfToken()
  const res = await fetch('/api/auth/profile', {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify(updates),
  })
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { message?: string }
    throw new Error(payload.message ?? 'Ошибка обновления профиля')
  }
  const data = (await res.json()) as { ok: true; data: ApiUser }
  return data.data
}

export async function apiLogout(): Promise<void> {
  const csrfToken = await apiGetCsrfToken()
  const res = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'X-CSRF-Token': csrfToken,
    },
  })
  if (!res.ok && res.status !== 401) {
    throw new Error('Failed to logout.')
  }
}
