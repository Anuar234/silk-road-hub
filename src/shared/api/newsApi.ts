import { apiGetCsrfToken } from '@shared/api/authApi'

export type NewsStatus = 'draft' | 'published' | 'archived'

export type NewsArticle = {
  id: string
  slug: string
  title: string
  summary: string
  body: string
  coverFileId?: string
  status: NewsStatus
  authorId?: string
  tags: string[]
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

export type NewsListFilters = {
  status?: NewsStatus
  tag?: string
  limit?: number
  offset?: number
}

function qs(filters: NewsListFilters): string {
  const p = new URLSearchParams()
  if (filters.status) p.set('status', filters.status)
  if (filters.tag) p.set('tag', filters.tag)
  if (filters.limit != null) p.set('limit', String(filters.limit))
  if (filters.offset != null) p.set('offset', String(filters.offset))
  const s = p.toString()
  return s ? `?${s}` : ''
}

// Public
export async function apiListPublicNews(filters: NewsListFilters = {}): Promise<NewsArticle[]> {
  const res = await fetch(`/api/news${qs(filters)}`, { credentials: 'include' })
  if (!res.ok) throw new Error('Не удалось загрузить ленту.')
  const body = (await res.json()) as { ok: true; data: NewsArticle[] }
  return body.data
}

export async function apiGetPublicNews(slug: string): Promise<NewsArticle> {
  const res = await fetch(`/api/news/${encodeURIComponent(slug)}`, { credentials: 'include' })
  if (!res.ok) throw new Error('Материал не найден.')
  const body = (await res.json()) as { ok: true; data: NewsArticle }
  return body.data
}

// Admin
export async function apiListAdminNews(filters: NewsListFilters = {}): Promise<NewsArticle[]> {
  const res = await fetch(`/api/admin/news${qs(filters)}`, { credentials: 'include' })
  if (!res.ok) throw new Error('Не удалось загрузить материалы.')
  const body = (await res.json()) as { ok: true; data: NewsArticle[] }
  return body.data
}

export async function apiGetAdminNews(id: string): Promise<NewsArticle> {
  const res = await fetch(`/api/admin/news/${encodeURIComponent(id)}`, { credentials: 'include' })
  if (!res.ok) throw new Error('Материал не найден.')
  const body = (await res.json()) as { ok: true; data: NewsArticle }
  return body.data
}

export async function apiCreateNews(input: {
  slug: string
  title: string
  summary?: string
  body?: string
  coverFileId?: string
  tags?: string[]
  status?: NewsStatus
}): Promise<NewsArticle> {
  const csrfToken = await apiGetCsrfToken()
  const res = await fetch('/api/admin/news', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { message?: string }
    throw new Error(payload.message ?? 'Не удалось создать материал.')
  }
  const body = (await res.json()) as { ok: true; data: NewsArticle }
  return body.data
}

export async function apiUpdateNews(
  id: string,
  input: Partial<{
    slug: string
    title: string
    summary: string
    body: string
    coverFileId: string | null
    tags: string[]
    status: NewsStatus
  }>,
): Promise<NewsArticle> {
  const csrfToken = await apiGetCsrfToken()
  const res = await fetch(`/api/admin/news/${encodeURIComponent(id)}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { message?: string }
    throw new Error(payload.message ?? 'Не удалось обновить материал.')
  }
  const body = (await res.json()) as { ok: true; data: NewsArticle }
  return body.data
}

export async function apiDeleteNews(id: string): Promise<void> {
  const csrfToken = await apiGetCsrfToken()
  const res = await fetch(`/api/admin/news/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'X-CSRF-Token': csrfToken },
  })
  if (!res.ok) throw new Error('Не удалось удалить материал.')
}

export const NEWS_STATUS_LABELS: Record<NewsStatus, string> = {
  draft: 'Черновик',
  published: 'Опубликован',
  archived: 'Архив',
}
