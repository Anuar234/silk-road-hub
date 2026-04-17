import { apiGetCsrfToken } from '@shared/api/authApi'

export type ProductStatus = 'draft' | 'moderation' | 'published' | 'rejected'

export type ServerProduct = {
  id: string
  slug: string
  name: string
  category: string
  hsCode: string
  moq: string
  incoterms: string
  price: string
  leadTimeDays: number
  packaging: string
  description: string
  imageUrls: string[]
  sellerId: string
  countryCode: string
  regionCode: string | null
  sectorId: string
  subcategoryId: string
  tags: string[]
  samplesAvailable: boolean
  privateLabel: boolean
  status: ProductStatus
  moderationComment: string | null
  createdAt: string
  updatedAt: string
}

export type CreateProductInput = {
  name: string
  category?: string
  hsCode?: string
  moq?: string
  incoterms?: string
  price?: string
  leadTimeDays?: number
  packaging?: string
  description?: string
  imageUrls?: string[]
  countryCode?: string
  regionCode?: string
  sectorId: string
  subcategoryId: string
  tags?: string[]
  samplesAvailable?: boolean
  privateLabel?: boolean
}

export type UpdateProductInput = Partial<CreateProductInput> & {
  status?: ProductStatus
  moderationComment?: string
}

async function csrfHeaders(): Promise<Record<string, string>> {
  const csrfToken = await apiGetCsrfToken()
  return { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken }
}

export async function apiGetProducts(statusFilter?: ProductStatus): Promise<ServerProduct[]> {
  const url = statusFilter ? `/api/products?status=${statusFilter}` : '/api/products'
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) throw new Error('Не удалось загрузить список товаров.')
  const data = (await res.json()) as { ok: true; data: ServerProduct[] }
  return data.data
}

export async function apiGetProduct(id: string): Promise<ServerProduct> {
  const res = await fetch(`/api/products/${id}`, { credentials: 'include' })
  if (!res.ok) throw new Error('Товар не найден.')
  const data = (await res.json()) as { ok: true; data: ServerProduct }
  return data.data
}

export async function apiCreateProduct(input: CreateProductInput): Promise<ServerProduct> {
  const headers = await csrfHeaders()
  const res = await fetch('/api/products', {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { message?: string }
    throw new Error(payload.message ?? 'Ошибка создания товара.')
  }
  const data = (await res.json()) as { ok: true; data: ServerProduct }
  return data.data
}

export async function apiUpdateProduct(id: string, input: UpdateProductInput): Promise<ServerProduct> {
  const headers = await csrfHeaders()
  const res = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers,
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('Ошибка обновления товара.')
  const data = (await res.json()) as { ok: true; data: ServerProduct }
  return data.data
}

export async function apiDeleteProduct(id: string): Promise<void> {
  const headers = await csrfHeaders()
  const res = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers,
  })
  if (!res.ok) throw new Error('Ошибка удаления товара.')
}

export async function apiSubmitProductForModeration(id: string): Promise<ServerProduct> {
  const headers = await csrfHeaders()
  const res = await fetch(`/api/products/${id}/submit`, {
    method: 'POST',
    credentials: 'include',
    headers,
  })
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { message?: string }
    throw new Error(payload.message ?? 'Ошибка отправки на модерацию.')
  }
  const data = (await res.json()) as { ok: true; data: ServerProduct }
  return data.data
}
