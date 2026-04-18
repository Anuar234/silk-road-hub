import { apiGetCsrfToken } from '@shared/api/authApi'
import type { Shipment, RouteTemplate } from '@features/logistics/logisticsData'

export async function apiGetRouteTemplates(): Promise<RouteTemplate[]> {
  const res = await fetch('/api/route-templates', { credentials: 'include' })
  if (!res.ok) throw new Error('Не удалось загрузить шаблоны маршрутов.')
  const data = (await res.json()) as { ok: true; data: RouteTemplate[] }
  return data.data
}

export async function apiGetShipments(dealId?: string): Promise<Shipment[]> {
  const url = dealId ? `/api/shipments?dealId=${dealId}` : '/api/shipments'
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) throw new Error('Не удалось загрузить отправления.')
  const data = (await res.json()) as { ok: true; data: Shipment[] }
  return data.data
}

export async function apiGetShipment(id: string): Promise<Shipment> {
  const res = await fetch(`/api/shipments/${id}`, { credentials: 'include' })
  if (!res.ok) throw new Error('Отправление не найдено.')
  const data = (await res.json()) as { ok: true; data: Shipment }
  return data.data
}

export async function apiCreateShipment(input: {
  dealId: string
  routeTemplateId?: string
  origin?: string
  destination?: string
}): Promise<Shipment> {
  const csrfToken = await apiGetCsrfToken()
  const res = await fetch('/api/shipments', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { message?: string }
    throw new Error(payload.message ?? 'Ошибка создания отправления.')
  }
  const data = (await res.json()) as { ok: true; data: Shipment }
  return data.data
}

export async function apiUpdateShipmentStage(shipmentId: string, input: {
  stageId: string
  stageStatus?: string
  stageLocation?: string
  stageDate?: string
  stageNotes?: string
}): Promise<Shipment> {
  const csrfToken = await apiGetCsrfToken()
  const res = await fetch(`/api/shipments/${shipmentId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('Ошибка обновления этапа.')
  const data = (await res.json()) as { ok: true; data: Shipment }
  return data.data
}

export async function apiAddShipmentDocument(shipmentId: string, fileId: string): Promise<Shipment> {
  const csrfToken = await apiGetCsrfToken()
  const res = await fetch(`/api/shipments/${shipmentId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({ addDocumentFileId: fileId }),
  })
  if (!res.ok) throw new Error('Ошибка добавления документа.')
  const data = (await res.json()) as { ok: true; data: Shipment }
  return data.data
}
