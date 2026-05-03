import { apiGetCsrfToken } from '@shared/api/authApi'

export type MessageThread = {
  id: string
  buyerId: string
  sellerId: string
  productId?: string | null
  relatedDealId?: string | null
  createdAt: string
  updatedAt: string
  buyerName?: string | null
  sellerName?: string | null
  productName?: string | null
  productSlug?: string | null
  unreadCount: number
  lastMessageBody?: string | null
  lastMessageAt?: string | null
  lastMessageRole?: 'buyer' | 'seller' | 'admin' | 'system' | null
}

export type MessageRow = {
  id: string
  threadId: string
  senderId?: string | null
  senderRole: 'buyer' | 'seller' | 'admin' | 'system'
  body: string
  isSystemMessage: boolean
  createdAt: string
}

async function csrfHeaders(): Promise<Record<string, string>> {
  const csrfToken = await apiGetCsrfToken()
  return { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken }
}

async function readApiError(res: Response): Promise<string | null> {
  const payload = (await res.json().catch(() => ({}))) as { message?: string; error?: string }
  return payload.error ?? payload.message ?? null
}

export async function apiListThreads(): Promise<MessageThread[]> {
  const res = await fetch('/api/messaging/threads', { credentials: 'include' })
  if (!res.ok) throw new Error((await readApiError(res)) ?? 'Не удалось загрузить переписки.')
  const data = (await res.json()) as { ok: true; data: MessageThread[] }
  return data.data
}

export async function apiGetThread(id: string): Promise<MessageThread> {
  const res = await fetch(`/api/messaging/threads/${id}`, { credentials: 'include' })
  if (!res.ok) throw new Error((await readApiError(res)) ?? 'Переписка не найдена.')
  const data = (await res.json()) as { ok: true; data: MessageThread }
  return data.data
}

export async function apiOpenThread(args: { counterpartId: string; productId?: string }): Promise<MessageThread> {
  const headers = await csrfHeaders()
  const res = await fetch('/api/messaging/threads', {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify(args),
  })
  if (!res.ok) throw new Error((await readApiError(res)) ?? 'Не удалось открыть переписку.')
  const data = (await res.json()) as { ok: true; data: MessageThread }
  return data.data
}

export async function apiListMessages(threadId: string): Promise<MessageRow[]> {
  const res = await fetch(`/api/messaging/threads/${threadId}/messages`, { credentials: 'include' })
  if (!res.ok) throw new Error((await readApiError(res)) ?? 'Не удалось загрузить сообщения.')
  const data = (await res.json()) as { ok: true; data: MessageRow[] }
  return data.data
}

export async function apiPostMessage(threadId: string, body: string): Promise<MessageRow> {
  const headers = await csrfHeaders()
  const res = await fetch(`/api/messaging/threads/${threadId}/messages`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify({ body }),
  })
  if (!res.ok) throw new Error((await readApiError(res)) ?? 'Не удалось отправить сообщение.')
  const data = (await res.json()) as { ok: true; data: MessageRow }
  return data.data
}

export async function apiMarkThreadRead(threadId: string): Promise<void> {
  const headers = await csrfHeaders()
  const res = await fetch(`/api/messaging/threads/${threadId}/read`, {
    method: 'POST',
    credentials: 'include',
    headers,
  })
  if (!res.ok) throw new Error((await readApiError(res)) ?? 'Не удалось отметить прочитанным.')
}
