import { CATALOG_COUNTRIES, KZ_REGIONS, getSectorById, getSubcategoryById } from '../../data/catalogStructure'
import type { Product, ResponseTimeBucket, Seller, TrustBadge } from '../../data/mockData'

/**
 * This module is the catalog URL contract.
 * Parameter names and normalization rules here are user-visible because links,
 * bookmarks, and back-navigation rely on them across public and app surfaces.
 */
export type CatalogTab = 'products' | 'sellers'
export type VerificationStatus = 'all' | 'verified'
export type CatalogFilterChipKey =
  | 'searchQuery'
  | 'sectorId'
  | 'subcategoryId'
  | 'countryCode'
  | 'regionCode'
  | 'hsCode'
  | 'moq'
  | 'sellerQuery'
  | 'responseTime'
  | 'verificationStatus'
  | 'samplesOnly'
  | 'privateLabelOnly'
  | 'incoterms'
  | 'certificates'

export type CatalogFilterState = {
  tab: CatalogTab
  sectorId: string
  subcategoryId: string
  countryCode: string
  regionCode: string
  hsCode: string
  moq: string
  sellerQuery: string
  searchQuery: string
  incoterms: string[]
  certificates: TrustBadge[]
  verificationStatus: VerificationStatus
  samplesOnly: boolean
  privateLabelOnly: boolean
  responseTime: ResponseTimeBucket | ''
}

export type CatalogFilterChip = {
  id: string
  key: CatalogFilterChipKey
  label: string
  value?: string
}

export const DEFAULT_CATALOG_FILTERS: CatalogFilterState = {
  tab: 'products',
  sectorId: '',
  subcategoryId: '',
  countryCode: '',
  regionCode: '',
  hsCode: '',
  moq: '',
  sellerQuery: '',
  searchQuery: '',
  incoterms: [],
  certificates: [],
  verificationStatus: 'all',
  samplesOnly: false,
  privateLabelOnly: false,
  responseTime: '',
}

export const CATALOG_CERTIFICATE_OPTIONS: TrustBadge[] = ['Verified', 'Halal', 'ISO 22000', 'ISO']
export const CATALOG_INCOTERM_OPTIONS = ['EXW', 'FCA', 'FOB', 'CIF', 'CPT', 'DAP']
export const CATALOG_RESPONSE_TIME_OPTIONS: Array<{ value: ResponseTimeBucket; label: string }> = [
  { value: 'fast', label: 'До 24 часов' },
  { value: 'standard', label: '24–48 часов' },
  { value: 'extended', label: '48+ часов' },
]

function parseListParam(value: string | null): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeTab(value: string | null | undefined): CatalogTab {
  return value === 'sellers' ? 'sellers' : 'products'
}

function normalizeCountry(value: string | null | undefined): string {
  if (!value) return ''
  return CATALOG_COUNTRIES.some((country) => country.code === value) ? value : ''
}

function normalizeCertificates(values: string[]): TrustBadge[] {
  return values.filter((value): value is TrustBadge => CATALOG_CERTIFICATE_OPTIONS.includes(value as TrustBadge))
}

function normalizeIncoterms(values: string[]): string[] {
  return values
    .map((value) => value.trim().toUpperCase())
    .filter((value) => CATALOG_INCOTERM_OPTIONS.includes(value))
}

function normalizeResponseTime(value: string | null | undefined): ResponseTimeBucket | '' {
  return CATALOG_RESPONSE_TIME_OPTIONS.some((option) => option.value === value) ? (value as ResponseTimeBucket) : ''
}

export function normalizeCatalogFilters(filters: CatalogFilterState): CatalogFilterState {
  const next: CatalogFilterState = {
    ...DEFAULT_CATALOG_FILTERS,
    ...filters,
    tab: normalizeTab(filters.tab),
    countryCode: normalizeCountry(filters.countryCode),
    regionCode: filters.countryCode === 'KZ' && filters.regionCode && KZ_REGIONS.some((r) => r.code === filters.regionCode) ? filters.regionCode : '',
    certificates: normalizeCertificates(filters.certificates),
    incoterms: normalizeIncoterms(filters.incoterms),
    verificationStatus: filters.verificationStatus === 'verified' ? 'verified' : 'all',
    responseTime: normalizeResponseTime(filters.responseTime),
    hsCode: filters.hsCode.trim(),
    moq: filters.moq.trim(),
    sellerQuery: filters.sellerQuery.trim(),
    searchQuery: filters.searchQuery,
  }

  if (!next.sectorId || !getSectorById(next.sectorId)) {
    next.sectorId = ''
    next.subcategoryId = ''
  } else if (!next.subcategoryId || !getSubcategoryById(next.sectorId, next.subcategoryId)) {
    next.subcategoryId = ''
  }

  return next
}

export function parseCatalogFilters(params: URLSearchParams, defaultTab: CatalogTab = 'products'): CatalogFilterState {
  const parsed: CatalogFilterState = {
    tab: normalizeTab(params.get('tab') ?? defaultTab),
    sectorId: params.get('sector') ?? '',
    subcategoryId: params.get('subcategory') ?? '',
    countryCode: params.get('country') ?? '',
    regionCode: params.get('region') ?? '',
    hsCode: params.get('hs') ?? '',
    moq: params.get('moq') ?? '',
    sellerQuery: params.get('seller') ?? '',
    searchQuery: params.get('q') ?? '',
    incoterms: normalizeIncoterms(parseListParam(params.get('incoterms'))),
    certificates: normalizeCertificates(parseListParam(params.get('certificates'))),
    verificationStatus: params.get('verified') === '1' || params.get('verified') === 'verified' ? 'verified' : 'all',
    samplesOnly: params.get('samples') === '1',
    privateLabelOnly: params.get('privateLabel') === '1',
    responseTime: normalizeResponseTime(params.get('responseTime')),
  }

  return normalizeCatalogFilters(parsed)
}

export function buildCatalogSearchParams(filters: CatalogFilterState, defaultTab: CatalogTab = 'products'): URLSearchParams {
  const normalized = normalizeCatalogFilters(filters)
  const params = new URLSearchParams()

  if (normalized.tab !== defaultTab) params.set('tab', normalized.tab)
  if (normalized.sectorId) params.set('sector', normalized.sectorId)
  if (normalized.subcategoryId) params.set('subcategory', normalized.subcategoryId)
  if (normalized.countryCode) params.set('country', normalized.countryCode)
  if (normalized.regionCode) params.set('region', normalized.regionCode)
  if (normalized.hsCode) params.set('hs', normalized.hsCode)
  if (normalized.moq) params.set('moq', normalized.moq)
  if (normalized.sellerQuery) params.set('seller', normalized.sellerQuery)
  if (normalized.searchQuery.trim()) params.set('q', normalized.searchQuery.trim())
  if (normalized.incoterms.length > 0) params.set('incoterms', normalized.incoterms.join(','))
  if (normalized.certificates.length > 0) params.set('certificates', normalized.certificates.join(','))
  if (normalized.verificationStatus === 'verified') params.set('verified', '1')
  if (normalized.samplesOnly) params.set('samples', '1')
  if (normalized.privateLabelOnly) params.set('privateLabel', '1')
  if (normalized.responseTime) params.set('responseTime', normalized.responseTime)

  return params
}

export function updateCatalogFilters(
  params: URLSearchParams,
  updates: Partial<CatalogFilterState>,
  defaultTab: CatalogTab = 'products',
): CatalogFilterState {
  const current = parseCatalogFilters(params, defaultTab)
  return normalizeCatalogFilters({ ...current, ...updates })
}

export function buildCatalogUrl(
  basePath: string,
  params: URLSearchParams,
  updates: Partial<CatalogFilterState>,
  defaultTab: CatalogTab = 'products',
): string {
  const next = updateCatalogFilters(params, updates, defaultTab)
  const search = buildCatalogSearchParams(next, defaultTab).toString()
  return search ? `${basePath}?${search}` : basePath
}

export function hasActiveCatalogFilters(filters: CatalogFilterState): boolean {
  return Boolean(
    filters.sectorId ||
      filters.subcategoryId ||
      filters.countryCode ||
      filters.regionCode ||
      filters.hsCode ||
      filters.moq ||
      filters.sellerQuery ||
      filters.searchQuery.trim() ||
      filters.incoterms.length > 0 ||
      filters.certificates.length > 0 ||
      filters.verificationStatus === 'verified' ||
      filters.samplesOnly ||
      filters.privateLabelOnly ||
      filters.responseTime,
  )
}

export function getCatalogFilterChips(filters: CatalogFilterState): CatalogFilterChip[] {
  const chips: CatalogFilterChip[] = []

  if (filters.searchQuery.trim()) {
    chips.push({ id: 'search', key: 'searchQuery', label: `Поиск: ${filters.searchQuery.trim()}` })
  }
  if (filters.sectorId) {
    const sector = getSectorById(filters.sectorId)
    chips.push({ id: 'sector', key: 'sectorId', label: sector?.name ?? filters.sectorId })
  }
  if (filters.subcategoryId) {
    const subcategory = getSubcategoryById(filters.sectorId, filters.subcategoryId)
    chips.push({ id: 'subcategory', key: 'subcategoryId', label: subcategory?.name ?? filters.subcategoryId })
  }
  if (filters.countryCode) {
    const country = CATALOG_COUNTRIES.find((item) => item.code === filters.countryCode)
    chips.push({ id: 'country', key: 'countryCode', label: country?.name ?? filters.countryCode })
  }
  if (filters.regionCode) {
    const region = KZ_REGIONS.find((r) => r.code === filters.regionCode)
    chips.push({ id: 'region', key: 'regionCode', label: region?.name ?? filters.regionCode })
  }
  if (filters.hsCode) chips.push({ id: 'hs', key: 'hsCode', label: `HS: ${filters.hsCode}` })
  if (filters.moq) chips.push({ id: 'moq', key: 'moq', label: `MOQ: ${filters.moq}` })
  if (filters.sellerQuery) chips.push({ id: 'seller', key: 'sellerQuery', label: `Продавец: ${filters.sellerQuery}` })
  if (filters.responseTime) {
    const option = CATALOG_RESPONSE_TIME_OPTIONS.find((item) => item.value === filters.responseTime)
    chips.push({ id: 'response', key: 'responseTime', label: option?.label ?? filters.responseTime })
  }
  if (filters.verificationStatus === 'verified') {
    chips.push({ id: 'verified', key: 'verificationStatus', label: 'Проверенные' })
  }
  if (filters.samplesOnly) chips.push({ id: 'samples', key: 'samplesOnly', label: 'Образцы доступны' })
  if (filters.privateLabelOnly) chips.push({ id: 'private', key: 'privateLabelOnly', label: 'Private label' })
  for (const incoterm of filters.incoterms) {
    chips.push({ id: `incoterm-${incoterm}`, key: 'incoterms', value: incoterm, label: incoterm })
  }
  for (const certificate of filters.certificates) {
    chips.push({ id: `certificate-${certificate}`, key: 'certificates', value: certificate, label: certificate })
  }

  return chips
}

export function removeCatalogChip(filters: CatalogFilterState, chip: CatalogFilterChip): CatalogFilterState {
  switch (chip.key) {
    case 'searchQuery':
      return { ...filters, searchQuery: '' }
    case 'sectorId':
      return { ...filters, sectorId: '', subcategoryId: '' }
    case 'subcategoryId':
      return { ...filters, subcategoryId: '' }
    case 'countryCode':
      return { ...filters, countryCode: '', regionCode: '' }
    case 'regionCode':
      return { ...filters, regionCode: '' }
    case 'hsCode':
      return { ...filters, hsCode: '' }
    case 'moq':
      return { ...filters, moq: '' }
    case 'sellerQuery':
      return { ...filters, sellerQuery: '' }
    case 'responseTime':
      return { ...filters, responseTime: '' }
    case 'verificationStatus':
      return { ...filters, verificationStatus: 'all' }
    case 'samplesOnly':
      return { ...filters, samplesOnly: false }
    case 'privateLabelOnly':
      return { ...filters, privateLabelOnly: false }
    case 'incoterms':
      return { ...filters, incoterms: filters.incoterms.filter((item) => item !== chip.value) }
    case 'certificates':
      return { ...filters, certificates: filters.certificates.filter((item) => item !== chip.value) }
  }
}

function normalizeHaystack(value: string): string {
  return value.toLowerCase().trim()
}

function matchesSearchProduct(product: Product, query: string): boolean {
  if (!query) return true
  const sectorName = getSectorById(product.sectorId)?.name ?? ''
  const subcategoryName = getSubcategoryById(product.sectorId, product.subcategoryId)?.name ?? ''
  const haystack = normalizeHaystack(
    [
      product.name,
      product.category,
      product.seller.name,
      product.seller.country,
      product.hsCode,
      sectorName,
      subcategoryName,
      ...(product.tags ?? []),
    ].join(' '),
  )
  return haystack.includes(normalizeHaystack(query))
}

function matchesSearchSeller(seller: Seller, sellerProducts: Product[], query: string): boolean {
  if (!query) return true
  const sellerText = [
    seller.name,
    seller.city,
    seller.country,
    seller.about ?? '',
    getSectorById(seller.mainSectorId ?? '')?.name ?? '',
    ...(seller.topCategoryNames ?? []),
  ].join(' ')
  const productText = sellerProducts
    .flatMap((product) => [
      product.name,
      product.hsCode,
      getSectorById(product.sectorId)?.name ?? '',
      getSubcategoryById(product.sectorId, product.subcategoryId)?.name ?? '',
      ...(product.tags ?? []),
    ])
    .join(' ')
  return normalizeHaystack(`${sellerText} ${productText}`).includes(normalizeHaystack(query))
}

function matchesHsCode(hsCode: string, filterValue: string): boolean {
  if (!filterValue) return true
  const normalizedCode = hsCode.replace(/\s+/g, '')
  const normalizedFilter = filterValue.replace(/\s+/g, '')
  return normalizedCode.startsWith(normalizedFilter)
}

function matchesTextValue(value: string, filterValue: string): boolean {
  if (!filterValue) return true
  return normalizeHaystack(value).includes(normalizeHaystack(filterValue))
}

function productMatchesCoreFilters(product: Product, filters: CatalogFilterState): boolean {
  if (filters.sectorId && product.sectorId !== filters.sectorId) return false
  if (filters.subcategoryId && product.subcategoryId !== filters.subcategoryId) return false
  if (filters.countryCode && product.countryCode !== filters.countryCode) return false
  if (filters.regionCode && product.regionCode !== filters.regionCode) return false
  if (!matchesHsCode(product.hsCode, filters.hsCode)) return false
  if (!matchesTextValue(product.moq, filters.moq)) return false
  if (filters.incoterms.length > 0 && !filters.incoterms.every((item) => product.incotermsList?.includes(item))) return false
  if (filters.certificates.length > 0 && !filters.certificates.every((item) => product.certificates?.includes(item))) return false
  if (filters.verificationStatus === 'verified' && !product.isVerified) return false
  if (filters.samplesOnly && !product.samplesAvailable) return false
  if (filters.privateLabelOnly && !product.privateLabel) return false
  if (filters.responseTime && product.seller.responseTimeBucket !== filters.responseTime) return false
  if (!matchesTextValue(product.seller.name, filters.sellerQuery)) return false
  return true
}

export function filterProducts(products: Product[], filters: CatalogFilterState): Product[] {
  return products.filter((product) => productMatchesCoreFilters(product, filters) && matchesSearchProduct(product, filters.searchQuery))
}

export function filterSellers(sellers: Seller[], products: Product[], filters: CatalogFilterState): Seller[] {
  return sellers.filter((seller) => {
    const sellerProducts = products.filter((product) => product.seller.id === seller.id)
    if (filters.countryCode && seller.countryCode !== filters.countryCode) return false
    if (filters.verificationStatus === 'verified' && !seller.isVerified) return false
    if (filters.responseTime && seller.responseTimeBucket !== filters.responseTime) return false
    if (!matchesTextValue(seller.name, filters.sellerQuery)) return false
    if (filters.certificates.length > 0) {
      const hasCertificates =
        filters.certificates.every((item) => seller.certificates?.includes(item)) ||
        sellerProducts.some((product) => filters.certificates.every((item) => product.certificates?.includes(item)))
      if (!hasCertificates) return false
    }

    const productScopedFilters: CatalogFilterState = { ...filters, searchQuery: '' }
    const hasMatchingProduct = sellerProducts.some((product) => productMatchesCoreFilters(product, productScopedFilters))
    const needsProductMatch = Boolean(
      filters.sectorId ||
        filters.subcategoryId ||
        filters.hsCode ||
        filters.moq ||
        filters.incoterms.length > 0 ||
        filters.samplesOnly ||
        filters.privateLabelOnly,
    )
    if (needsProductMatch && !hasMatchingProduct) return false

    return matchesSearchSeller(seller, sellerProducts, filters.searchQuery)
  })
}
