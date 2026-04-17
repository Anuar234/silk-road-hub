import { apiGetCsrfToken } from '@shared/api/authApi'
import type { InvestmentProject } from '@features/investments/investmentData'

export async function apiGetInvestments(): Promise<InvestmentProject[]> {
  const res = await fetch('/api/investments', { credentials: 'include' })
  if (!res.ok) throw new Error('Не удалось загрузить инвестпроекты.')
  const data = (await res.json()) as { ok: true; data: InvestmentProject[] }
  return data.data
}

export async function apiGetInvestment(id: string): Promise<InvestmentProject> {
  const res = await fetch(`/api/investments/${id}`, { credentials: 'include' })
  if (!res.ok) throw new Error('Инвестпроект не найден.')
  const data = (await res.json()) as { ok: true; data: InvestmentProject }
  return data.data
}

export async function apiCreateInvestment(input: Partial<InvestmentProject>): Promise<InvestmentProject> {
  const csrfToken = await apiGetCsrfToken()
  const res = await fetch('/api/investments', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { message?: string }
    throw new Error(payload.message ?? 'Ошибка создания инвестпроекта.')
  }
  const data = (await res.json()) as { ok: true; data: InvestmentProject }
  return data.data
}

export async function apiUpdateInvestment(id: string, input: Partial<InvestmentProject>): Promise<InvestmentProject> {
  const csrfToken = await apiGetCsrfToken()
  const res = await fetch(`/api/investments/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('Ошибка обновления инвестпроекта.')
  const data = (await res.json()) as { ok: true; data: InvestmentProject }
  return data.data
}
