import { apiGetCsrfToken } from '@shared/api/authApi'
import type { ApiUser, VerificationStatus } from '@shared/api/authApi'
import type { Role } from '@features/auth/auth'

export async function apiGetUsers(): Promise<ApiUser[]> {
  const res = await fetch('/api/users', { credentials: 'include' })
  if (!res.ok) throw new Error('Не удалось загрузить список пользователей.')
  const data = (await res.json()) as { ok: true; data: ApiUser[] }
  return data.data
}

export async function apiVerifyUser(userId: string, status: VerificationStatus): Promise<ApiUser> {
  const csrfToken = await apiGetCsrfToken()
  const res = await fetch(`/api/users/${userId}/verify`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error('Ошибка обновления верификации.')
  const data = (await res.json()) as { ok: true; data: ApiUser }
  return data.data
}

export async function apiUpdateUserRole(userId: string, role: Role): Promise<ApiUser> {
  const csrfToken = await apiGetCsrfToken()
  const res = await fetch(`/api/users/${userId}/role`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({ role }),
  })
  if (!res.ok) throw new Error('Ошибка смены роли.')
  const data = (await res.json()) as { ok: true; data: ApiUser }
  return data.data
}

export async function apiAddUserDoc(userId: string, fileId: string): Promise<ApiUser> {
  const csrfToken = await apiGetCsrfToken()
  const res = await fetch(`/api/users/${userId}/docs`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({ fileId }),
  })
  if (!res.ok) throw new Error('Ошибка загрузки документа.')
  const data = (await res.json()) as { ok: true; data: ApiUser }
  return data.data
}
