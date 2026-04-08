import { apiGetCsrfToken } from './authApi'
import type { DealPaymentPlan, PaymentStageStatus, GuaranteeType, DealGuarantee } from '../data/dealData'

/* ── Payment plans ── */

export async function apiGetPaymentPlan(dealId: string): Promise<DealPaymentPlan | null> {
  const res = await fetch(`/api/deals/${dealId}/payments`, { credentials: 'include' })
  if (!res.ok) throw new Error('Не удалось загрузить план расчётов.')
  const data = (await res.json()) as { ok: true; data: DealPaymentPlan | null }
  return data.data
}

export async function apiCreatePaymentPlan(
  dealId: string,
  totalUsd: number,
  stages?: { label: string; percentage: number }[],
): Promise<DealPaymentPlan> {
  const csrfToken = await apiGetCsrfToken()
  const res = await fetch(`/api/deals/${dealId}/payments`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({ totalUsd, stages }),
  })
  if (!res.ok) throw new Error('Ошибка создания плана расчётов.')
  const data = (await res.json()) as { ok: true; data: DealPaymentPlan }
  return data.data
}

export async function apiUpdatePaymentStage(
  dealId: string,
  stageId: string,
  updates: { status?: PaymentStageStatus; dueDate?: string; paidAt?: string },
): Promise<DealPaymentPlan> {
  const csrfToken = await apiGetCsrfToken()
  const res = await fetch(`/api/deals/${dealId}/payments`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({ stageId, ...updates }),
  })
  if (!res.ok) throw new Error('Ошибка обновления этапа расчётов.')
  const data = (await res.json()) as { ok: true; data: DealPaymentPlan }
  return data.data
}

/* ── Guarantees ── */

export async function apiGetDealGuarantees(dealId: string): Promise<DealGuarantee[]> {
  const res = await fetch(`/api/deals/${dealId}/guarantees`, { credentials: 'include' })
  if (!res.ok) throw new Error('Не удалось загрузить гарантии.')
  const data = (await res.json()) as { ok: true; data: DealGuarantee[] }
  return data.data
}

export async function apiSetDealGuarantee(
  dealId: string,
  type: GuaranteeType,
  enabled: boolean,
  notes?: string,
): Promise<DealGuarantee[]> {
  const csrfToken = await apiGetCsrfToken()
  const res = await fetch(`/api/deals/${dealId}/guarantees`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({ type, enabled, notes }),
  })
  if (!res.ok) throw new Error('Ошибка обновления гарантий.')
  const data = (await res.json()) as { ok: true; data: DealGuarantee[] }
  return data.data
}
