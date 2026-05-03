import { apiGetCsrfToken } from '@shared/api/authApi'

export type RfqStatus = 'open' | 'in_review' | 'matched' | 'fulfilled' | 'closed'

export const RFQ_STATUS_LABELS: Record<RfqStatus, string> = {
  open: 'Открыт',
  in_review: 'На рассмотрении',
  matched: 'Подобраны поставщики',
  fulfilled: 'Сделка заключена',
  closed: 'Закрыт',
}

export const RFQ_STATUS_TONE: Record<RfqStatus, 'info' | 'warning' | 'success' | 'neutral'> = {
  open: 'info',
  in_review: 'warning',
  matched: 'success',
  fulfilled: 'success',
  closed: 'neutral',
}

export type RfqMatch = {
  id: string
  rfqId: string
  sellerId: string
  note: string
  threadId?: string | null
  createdBy?: string | null
  createdAt: string
  sellerName?: string | null
  sellerCompany?: string | null
  sellerEmail?: string | null
}

export type Rfq = {
  id: string
  buyerId: string
  title: string
  description: string
  sectorId: string
  subcategoryId: string
  targetCountry: string
  quantity: string
  budgetUsd?: number | null
  targetDate?: string | null
  incoterms: string
  notes: string
  status: RfqStatus
  adminNotes?: string
  createdAt: string
  updatedAt: string
  buyerName?: string | null
  buyerEmail?: string | null
  matches?: RfqMatch[]
}

export type CreateRfqInput = {
  title: string
  description?: string
  sectorId?: string
  subcategoryId?: string
  targetCountry?: string
  quantity?: string
  budgetUsd?: number
  targetDate?: string
  incoterms?: string
  notes?: string
}

export type UpdateRfqInput = Partial<CreateRfqInput> & {
  status?: RfqStatus
  adminNotes?: string
}

async function csrfHeaders(): Promise<Record<string, string>> {
  const csrfToken = await apiGetCsrfToken()
  return { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken }
}

async function readApiError(res: Response): Promise<string | null> {
  const payload = (await res.json().catch(() => ({}))) as { message?: string; error?: string }
  return payload.error ?? payload.message ?? null
}

export async function apiListRfqs(status?: RfqStatus): Promise<Rfq[]> {
  const url = status ? `/api/rfqs?status=${status}` : '/api/rfqs'
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) throw new Error((await readApiError(res)) ?? 'Не удалось загрузить запросы.')
  const data = (await res.json()) as { ok: true; data: Rfq[] }
  return data.data
}

export async function apiGetRfq(id: string): Promise<Rfq> {
  const res = await fetch(`/api/rfqs/${id}`, { credentials: 'include' })
  if (!res.ok) throw new Error((await readApiError(res)) ?? 'Запрос не найден.')
  const data = (await res.json()) as { ok: true; data: Rfq }
  return data.data
}

export async function apiCreateRfq(input: CreateRfqInput): Promise<Rfq> {
  const headers = await csrfHeaders()
  const res = await fetch('/api/rfqs', {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error((await readApiError(res)) ?? 'Не удалось создать запрос.')
  const data = (await res.json()) as { ok: true; data: Rfq }
  return data.data
}

export async function apiUpdateRfq(id: string, input: UpdateRfqInput): Promise<Rfq> {
  const headers = await csrfHeaders()
  const res = await fetch(`/api/rfqs/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers,
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error((await readApiError(res)) ?? 'Не удалось обновить запрос.')
  const data = (await res.json()) as { ok: true; data: Rfq }
  return data.data
}

export type AddMatchInput = {
  sellerId: string
  note?: string
}

export async function apiAddRfqMatch(rfqId: string, input: AddMatchInput): Promise<RfqMatch> {
  const headers = await csrfHeaders()
  const res = await fetch(`/api/rfqs/${rfqId}/matches`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error((await readApiError(res)) ?? 'Не удалось добавить продавца.')
  const data = (await res.json()) as { ok: true; data: RfqMatch }
  return data.data
}

export async function apiDeleteRfqMatch(rfqId: string, matchId: string): Promise<void> {
  const headers = await csrfHeaders()
  const res = await fetch(`/api/rfqs/${rfqId}/matches/${matchId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers,
  })
  if (!res.ok) throw new Error((await readApiError(res)) ?? 'Не удалось убрать продавца.')
}
