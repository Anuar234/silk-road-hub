import { apiGetCsrfToken } from '@shared/api/authApi'
import type { DealPaymentPlan, PaymentStageStatus, GuaranteeType, DealGuarantee } from '@features/deals/dealData'

/* ── Chat / comments ── */

export type DealCommentType = 'internal_note' | 'buyer_request' | 'seller_request' | 'document_note' | 'status_note'
export type DealCommentVisibility = 'internal' | 'buyer' | 'seller' | 'all'

export type DealComment = {
  id: string
  dealId: string
  type: DealCommentType
  visibility: DealCommentVisibility
  author: string
  authorRole: string
  body: string
  createdAt: string
}

export async function apiListDealComments(dealId: string): Promise<DealComment[]> {
  const res = await fetch(`/api/deals/${encodeURIComponent(dealId)}/comments`, { credentials: 'include' })
  if (!res.ok) throw new Error('Не удалось загрузить сообщения сделки.')
  const body = (await res.json()) as { ok: true; data: DealComment[] }
  return body.data
}

export async function apiCreateDealComment(
  dealId: string,
  args: { body: string; type?: DealCommentType; visibility?: DealCommentVisibility },
): Promise<DealComment> {
  const csrfToken = await apiGetCsrfToken()
  const res = await fetch(`/api/deals/${encodeURIComponent(dealId)}/comments`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify(args),
  })
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { message?: string }
    throw new Error(payload.message ?? 'Не удалось отправить сообщение.')
  }
  const body = (await res.json()) as { ok: true; data: DealComment }
  return body.data
}

/* ── Deal documents (LOI/MOU/contract/invoice/other) ── */

export type DealDocumentType = 'invoice' | 'contract' | 'certificate' | 'shipping' | 'loi' | 'mou' | 'other'

export type DealDocument = {
  id: string
  dealId: string
  name: string
  type: DealDocumentType
  status: string
  uploadedByRole?: string
  uploadedAt?: string
  note?: string
  sourceFileName?: string
  sourceFileSize?: number
  fileId?: string
}

export async function apiListDealDocuments(dealId: string): Promise<DealDocument[]> {
  const res = await fetch(`/api/deals/${encodeURIComponent(dealId)}/documents`, { credentials: 'include' })
  if (!res.ok) throw new Error('Не удалось загрузить документы сделки.')
  const body = (await res.json()) as { ok: true; data: DealDocument[] }
  return body.data
}

export async function apiCreateDealDocument(
  dealId: string,
  args: { name: string; type: DealDocumentType; fileId: string; note?: string },
): Promise<DealDocument> {
  const csrfToken = await apiGetCsrfToken()
  const res = await fetch(`/api/deals/${encodeURIComponent(dealId)}/documents`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify(args),
  })
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { message?: string }
    throw new Error(payload.message ?? 'Не удалось прикрепить документ.')
  }
  const body = (await res.json()) as { ok: true; data: DealDocument }
  return body.data
}

export const DEAL_DOC_TYPE_LABELS: Record<DealDocumentType, string> = {
  loi: 'LOI — письмо о намерениях',
  mou: 'MOU — меморандум',
  contract: 'Контракт',
  invoice: 'Инвойс',
  certificate: 'Сертификат',
  shipping: 'Отгрузочный документ',
  other: 'Другое',
}

export const DEAL_COMMENT_TYPE_LABELS: Record<DealCommentType, string> = {
  internal_note: 'Внутренняя заметка',
  buyer_request: 'Запрос от покупателя',
  seller_request: 'Запрос от продавца',
  document_note: 'Комментарий по документу',
  status_note: 'Комментарий по статусу',
}

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
