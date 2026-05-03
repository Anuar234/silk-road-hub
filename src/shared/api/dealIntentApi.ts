import { apiGetCsrfToken } from '@shared/api/authApi'

export type IntentKind = 'loi' | 'mou'
export type IntentStatus = 'draft' | 'signed' | 'cancelled'

export type DealIntent = {
  id: string
  dealId: string
  kind: IntentKind
  title: string
  summary: string
  fileId?: string | null
  status: IntentStatus
  signedByBuyer: boolean
  signedBySeller: boolean
  signedAt?: string | null
  cancelledAt?: string | null
  createdBy?: string | null
  createdAt: string
  updatedAt: string
}

export const INTENT_KIND_LABELS: Record<IntentKind, string> = {
  loi: 'LOI · Письмо о намерениях',
  mou: 'MOU · Меморандум о взаимопонимании',
}

async function csrfHeaders(): Promise<Record<string, string>> {
  const csrfToken = await apiGetCsrfToken()
  return { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken }
}

async function readApiError(res: Response): Promise<string | null> {
  const payload = (await res.json().catch(() => ({}))) as { message?: string; error?: string }
  return payload.error ?? payload.message ?? null
}

export async function apiListIntents(dealId: string): Promise<DealIntent[]> {
  const res = await fetch(`/api/deals/${dealId}/intents`, { credentials: 'include' })
  if (!res.ok) throw new Error((await readApiError(res)) ?? 'Не удалось загрузить договорённости.')
  const data = (await res.json()) as { ok: true; data: DealIntent[] }
  return data.data
}

export type CreateIntentInput = {
  kind: IntentKind
  title: string
  summary?: string
  fileId?: string
}

export async function apiCreateIntent(dealId: string, input: CreateIntentInput): Promise<DealIntent> {
  const headers = await csrfHeaders()
  const res = await fetch(`/api/deals/${dealId}/intents`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error((await readApiError(res)) ?? 'Не удалось создать договорённость.')
  const data = (await res.json()) as { ok: true; data: DealIntent }
  return data.data
}

export async function apiSignIntent(intentId: string, side?: 'buyer' | 'seller'): Promise<DealIntent> {
  const headers = await csrfHeaders()
  const res = await fetch(`/api/intents/${intentId}/sign`, {
    method: 'PUT',
    credentials: 'include',
    headers,
    body: JSON.stringify(side ? { side } : {}),
  })
  if (!res.ok) throw new Error((await readApiError(res)) ?? 'Не удалось подписать договорённость.')
  const data = (await res.json()) as { ok: true; data: DealIntent }
  return data.data
}

export async function apiCancelIntent(intentId: string): Promise<DealIntent> {
  const headers = await csrfHeaders()
  const res = await fetch(`/api/intents/${intentId}/cancel`, {
    method: 'PUT',
    credentials: 'include',
    headers,
  })
  if (!res.ok) throw new Error((await readApiError(res)) ?? 'Не удалось отменить договорённость.')
  const data = (await res.json()) as { ok: true; data: DealIntent }
  return data.data
}
