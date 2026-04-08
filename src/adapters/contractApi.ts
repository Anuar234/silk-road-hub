import { apiGetCsrfToken } from './authApi'
import type { Contract, ContractTemplateType, ApplicableLaw, ContractDeadline } from '../data/contractData'

export async function apiGetContracts(dealId?: string): Promise<Contract[]> {
  const url = dealId ? `/api/contracts?dealId=${dealId}` : '/api/contracts'
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) throw new Error('Не удалось загрузить контракты.')
  const data = (await res.json()) as { ok: true; data: Contract[] }
  return data.data
}

export async function apiGetContract(id: string): Promise<Contract> {
  const res = await fetch(`/api/contracts/${id}`, { credentials: 'include' })
  if (!res.ok) throw new Error('Контракт не найден.')
  const data = (await res.json()) as { ok: true; data: Contract }
  return data.data
}

export async function apiCreateContract(input: {
  dealId: string
  templateType: ContractTemplateType
  applicableLaw: ApplicableLaw
  deadlines?: ContractDeadline[]
  notes?: string
}): Promise<Contract> {
  const csrfToken = await apiGetCsrfToken()
  const res = await fetch('/api/contracts', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { message?: string }
    throw new Error(payload.message ?? 'Ошибка создания контракта.')
  }
  const data = (await res.json()) as { ok: true; data: Contract }
  return data.data
}

export async function apiUpdateContract(id: string, input: Partial<Contract>): Promise<Contract> {
  const csrfToken = await apiGetCsrfToken()
  const res = await fetch(`/api/contracts/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('Ошибка обновления контракта.')
  const data = (await res.json()) as { ok: true; data: Contract }
  return data.data
}
