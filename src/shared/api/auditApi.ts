export type AuditEntry = {
  id: string
  userId: string | null
  method: string
  path: string
  statusCode: number
  ipAddress: string | null
  userAgent: string | null
  durationMs: number
  createdAt: string
}

export type AuditFilters = {
  method?: string
  userId?: string
  from?: string
  to?: string
  limit?: number
  offset?: number
}

export async function apiListAuditLog(filters: AuditFilters = {}): Promise<AuditEntry[]> {
  const qs = new URLSearchParams()
  if (filters.method) qs.set('method', filters.method)
  if (filters.userId) qs.set('userId', filters.userId)
  if (filters.from) qs.set('from', filters.from)
  if (filters.to) qs.set('to', filters.to)
  if (filters.limit != null) qs.set('limit', String(filters.limit))
  if (filters.offset != null) qs.set('offset', String(filters.offset))

  const res = await fetch(`/api/admin/audit-log?${qs.toString()}`, { credentials: 'include' })
  if (!res.ok) throw new Error('Не удалось загрузить журнал действий.')
  const body = (await res.json()) as { ok: true; data: AuditEntry[] }
  return body.data
}
