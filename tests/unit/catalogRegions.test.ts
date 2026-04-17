import { describe, expect, it } from 'vitest'
import { KZ_REGIONS, getRegionByCode, CATALOG_COUNTRIES, getCountryCodeByName } from '@features/catalog/catalogStructure'
import { products } from '@mocks/mockData'
import { parseCatalogFilters, filterProducts } from '../../src/features/catalog/catalogFilters'

describe('Kazakhstan regions', () => {
  it('has 20 regions defined (17 oblasts + 3 cities)', () => {
    expect(KZ_REGIONS.length).toBe(20)
  })

  it('finds region by code', () => {
    const astana = getRegionByCode('KZ-AST')
    expect(astana).toBeDefined()
    expect(astana?.name).toBe('г. Астана')

    const almaty = getRegionByCode('KZ-ALA')
    expect(almaty?.name).toBe('г. Алматы')
  })

  it('returns undefined for invalid region code', () => {
    expect(getRegionByCode('INVALID')).toBeUndefined()
  })

  it('maps country names to codes', () => {
    expect(getCountryCodeByName('Казахстан')).toBe('KZ')
    expect(getCountryCodeByName('Турция')).toBe('TR')
    expect(getCountryCodeByName('Несуществующая')).toBeUndefined()
  })

  it('has 21 countries in catalog', () => {
    expect(CATALOG_COUNTRIES.length).toBe(21)
  })
})

describe('region filter in catalog', () => {
  it('KZ products have countryCode set', () => {
    const kzProducts = products.filter((p) => p.seller.country === 'Казахстан')
    expect(kzProducts.length).toBeGreaterThan(0)
    expect(kzProducts.every((p) => p.countryCode === 'KZ')).toBe(true)
  })

  it('KZ products have regionCode set', () => {
    const kzProducts = products.filter((p) => p.countryCode === 'KZ')
    const withRegion = kzProducts.filter((p) => p.regionCode)
    expect(withRegion.length).toBeGreaterThan(0)
  })

  it('filters products by region', () => {
    const params = new URLSearchParams('country=KZ&region=KZ-AST')
    const filters = parseCatalogFilters(params)

    expect(filters.countryCode).toBe('KZ')
    expect(filters.regionCode).toBe('KZ-AST')

    const filtered = filterProducts(products, filters)
    expect(filtered.length).toBeGreaterThanOrEqual(0)
    expect(filtered.every((p) => p.regionCode === 'KZ-AST' || !p.regionCode)).toBe(true)
  })

  it('clears region when country is not KZ', () => {
    const params = new URLSearchParams('country=TR&region=KZ-AST')
    const filters = parseCatalogFilters(params)

    expect(filters.countryCode).toBe('TR')
    expect(filters.regionCode).toBe('') // should be cleared
  })
})
