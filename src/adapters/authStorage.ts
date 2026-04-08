/**
 * Legacy browser storage adapter preserved for migration support.
 * `srh_auth_v2` is no longer used as an auth source of truth and is only read
 * to show a soft re-login path during rollout.
 */
export const AUTH_STORAGE_KEY = 'srh_auth_v2'

export function readAuthStorage(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(AUTH_STORAGE_KEY)
}

export function writeAuthStorage(value: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(AUTH_STORAGE_KEY, value)
}

export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}
