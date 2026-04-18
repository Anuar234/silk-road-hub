import { apiGetCsrfToken } from '@shared/api/authApi'

export type InvestmentRequestStatus = 'new' | 'reviewing' | 'accepted' | 'declined'

export type InvestmentRequest = {
  id: string
  projectId: string
  investorId: string
  amountUsd: number
  message: string
  status: InvestmentRequestStatus
  createdAt: string
  updatedAt: string
}

export type CreateInvestmentRequestArgs = {
  amountUsd: number
  message: string
}

export async function apiCreateInvestmentRequest(
  projectId: string,
  args: CreateInvestmentRequestArgs,
): Promise<InvestmentRequest> {
  const csrfToken = await apiGetCsrfToken()
  const res = await fetch(`/api/investments/${encodeURIComponent(projectId)}/requests`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify(args),
  })
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { message?: string }
    throw new Error(payload.message ?? 'Не удалось отправить инвест-запрос.')
  }
  const body = (await res.json()) as { ok: true; data: InvestmentRequest }
  return body.data
}

export async function apiGetMyInvestmentRequests(): Promise<InvestmentRequest[]> {
  const res = await fetch('/api/me/investment-requests', { credentials: 'include' })
  if (!res.ok) throw new Error('Не удалось загрузить инвест-запросы.')
  const body = (await res.json()) as { ok: true; data: InvestmentRequest[] }
  return body.data
}

export async function apiGetProjectInvestmentRequests(projectId: string): Promise<InvestmentRequest[]> {
  const res = await fetch(`/api/investments/${encodeURIComponent(projectId)}/requests`, { credentials: 'include' })
  if (!res.ok) throw new Error('Не удалось загрузить запросы по проекту.')
  const body = (await res.json()) as { ok: true; data: InvestmentRequest[] }
  return body.data
}

export const INVESTMENT_REQUEST_STATUS_LABELS: Record<InvestmentRequestStatus, string> = {
  new: 'Новый',
  reviewing: 'На рассмотрении',
  accepted: 'Принят',
  declined: 'Отклонён',
}
