export type Country = {
  code: string
  nameRu: string
  nameEn: string
  sortOrder: number
  isActive: boolean
}

export type Region = {
  code: string
  countryCode: string
  nameRu: string
  nameEn: string
  sortOrder: number
  isActive: boolean
}

export type Category = {
  id: string
  nameRu: string
  nameEn: string
  icon: string
  sortOrder: number
  isActive: boolean
}

export async function apiGetCountries(): Promise<Country[]> {
  const res = await fetch('/api/countries', { credentials: 'include' })
  if (!res.ok) throw new Error('Не удалось загрузить список стран.')
  const body = (await res.json()) as { ok: true; data: Country[] }
  return body.data
}

export async function apiGetRegions(countryCode?: string): Promise<Region[]> {
  const qs = countryCode ? `?countryCode=${encodeURIComponent(countryCode)}` : ''
  const res = await fetch(`/api/regions${qs}`, { credentials: 'include' })
  if (!res.ok) throw new Error('Не удалось загрузить список регионов.')
  const body = (await res.json()) as { ok: true; data: Region[] }
  return body.data
}

export async function apiGetCategories(): Promise<Category[]> {
  const res = await fetch('/api/categories', { credentials: 'include' })
  if (!res.ok) throw new Error('Не удалось загрузить список категорий.')
  const body = (await res.json()) as { ok: true; data: Category[] }
  return body.data
}
