import { useCallback, useEffect, useState } from 'react'
import {
  apiGetCategories,
  apiGetCountries,
  apiGetRegions,
  type Category,
  type Country,
  type Region,
} from '@shared/api/referenceApi'

type Cache = {
  countries: Country[] | null
  categories: Category[] | null
  regionsByCountry: Map<string, Region[]>
}

const cache: Cache = {
  countries: null,
  categories: null,
  regionsByCountry: new Map(),
}

let inflight: Promise<void> | null = null

async function preloadCommon(): Promise<void> {
  if (cache.countries && cache.categories && cache.regionsByCountry.has('KZ')) return
  if (inflight) {
    await inflight
    return
  }
  inflight = (async () => {
    const [countries, categories, kzRegions] = await Promise.all([
      cache.countries ? Promise.resolve(cache.countries) : apiGetCountries(),
      cache.categories ? Promise.resolve(cache.categories) : apiGetCategories(),
      cache.regionsByCountry.get('KZ')
        ? Promise.resolve(cache.regionsByCountry.get('KZ')!)
        : apiGetRegions('KZ'),
    ])
    cache.countries = countries
    cache.categories = categories
    cache.regionsByCountry.set('KZ', kzRegions)
  })()
  try {
    await inflight
  } finally {
    inflight = null
  }
}

export type ReferencesState = {
  countries: Country[]
  categories: Category[]
  kzRegions: Region[]
  loading: boolean
  error: string | null
}

export function useReferences(): ReferencesState {
  const [, tick] = useState(0)
  const [loading, setLoading] = useState(!cache.countries || !cache.categories)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await preloadCommon()
      tick((n) => n + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки справочников')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return {
    countries: cache.countries ?? [],
    categories: cache.categories ?? [],
    kzRegions: cache.regionsByCountry.get('KZ') ?? [],
    loading,
    error,
  }
}

export function getCachedKzRegions(): Region[] {
  return cache.regionsByCountry.get('KZ') ?? []
}

export function getCachedCountries(): Country[] {
  return cache.countries ?? []
}
