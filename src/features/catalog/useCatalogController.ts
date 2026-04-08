import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useDebounce } from '../../hooks/useDebounce'
import { products, sellers } from '../../data/mockData'
import {
  type CatalogTab,
  DEFAULT_CATALOG_FILTERS,
  buildCatalogSearchParams,
  filterProducts,
  filterSellers,
  getCatalogFilterChips,
  hasActiveCatalogFilters,
  normalizeCatalogFilters,
  parseCatalogFilters,
  removeCatalogChip,
} from './catalogFilters'

/**
 * Shared controller for both public and authenticated catalog screens.
 * It binds query params, debounced search, filtering, and UI chips into one
 * place so route parity can be preserved during framework migration.
 */
export function useCatalogController(basePath: string) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  const rawFilters = useMemo(() => parseCatalogFilters(params), [params])
  const debouncedSearch = useDebounce(rawFilters.searchQuery.trim().toLowerCase(), 300)
  const filters = useMemo(
    () => normalizeCatalogFilters({ ...rawFilters, searchQuery: debouncedSearch }),
    [debouncedSearch, rawFilters],
  )

  const chips = useMemo(() => getCatalogFilterChips(rawFilters), [rawFilters])
  const hasFilters = useMemo(() => hasActiveCatalogFilters(rawFilters), [rawFilters])
  const filteredProducts = useMemo(() => filterProducts(products, filters), [filters])
  const filteredSellers = useMemo(() => filterSellers(sellers, products, filters), [filters])
  const currentCatalogUrl = `${location.pathname}${location.search}`

  const goToFilters = useCallback(
    (nextFilters: typeof rawFilters) => {
      const search = buildCatalogSearchParams(nextFilters).toString()
      navigate(search ? `${basePath}?${search}` : basePath, { replace: true })
    },
    [basePath, navigate],
  )

  const updateFilters = useCallback(
    (updates: Partial<typeof rawFilters>) => {
      goToFilters(normalizeCatalogFilters({ ...rawFilters, ...updates }))
    },
    [goToFilters, rawFilters],
  )

  const resetFilters = useCallback(() => {
    goToFilters(DEFAULT_CATALOG_FILTERS)
  }, [goToFilters])

  const removeChip = useCallback(
    (chip: (typeof chips)[number]) => {
      goToFilters(removeCatalogChip(rawFilters, chip))
    },
    [chips, goToFilters, rawFilters],
  )

  const setTab = useCallback((tab: CatalogTab) => updateFilters({ tab }), [updateFilters])
  const activeCount = rawFilters.tab === 'products' ? filteredProducts.length : filteredSellers.length

  return {
    rawFilters,
    filteredProducts,
    filteredSellers,
    chips,
    hasFilters,
    currentCatalogUrl,
    updateFilters,
    resetFilters,
    removeChip,
    setTab,
    activeCount,
  }
}
