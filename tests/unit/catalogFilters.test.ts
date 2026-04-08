import { describe, expect, it } from 'vitest'
import {
  buildCatalogSearchParams,
  parseCatalogFilters,
  type CatalogFilterState,
} from '../../src/features/catalog/catalogFilters'

describe('catalog filter contract', () => {
  it('parses existing query params without breaking compatibility keys', () => {
    const params = new URLSearchParams(
      'tab=sellers&sector=fmcg&subcategory=fmcg-confectionery&country=KZ&hs=190531&q=cookies&verified=1&samples=1&privateLabel=1&responseTime=fast',
    )

    const parsed = parseCatalogFilters(params)

    expect(parsed.tab).toBe('sellers')
    expect(parsed.sectorId).toBe('fmcg')
    expect(parsed.subcategoryId).toBe('fmcg-confectionery')
    expect(parsed.countryCode).toBe('KZ')
    expect(parsed.hsCode).toBe('190531')
    expect(parsed.searchQuery).toBe('cookies')
    expect(parsed.verificationStatus).toBe('verified')
    expect(parsed.samplesOnly).toBe(true)
    expect(parsed.privateLabelOnly).toBe(true)
    expect(parsed.responseTime).toBe('fast')
  })

  it('builds stable query params for sharable catalog links', () => {
    const filters: CatalogFilterState = {
      tab: 'products',
      sectorId: 'agro',
      subcategoryId: 'agro-grains',
      countryCode: 'KZ',
      hsCode: '1001',
      moq: '20 tons',
      sellerQuery: 'kaz',
      searchQuery: 'wheat',
      incoterms: ['FOB', 'CIF'],
      certificates: ['Verified', 'ISO'],
      verificationStatus: 'verified',
      samplesOnly: false,
      privateLabelOnly: true,
      responseTime: 'standard',
    }

    const params = buildCatalogSearchParams(filters)

    expect(params.get('sector')).toBe('agro')
    expect(params.get('subcategory')).toBe('agro-grains')
    expect(params.get('country')).toBe('KZ')
    expect(params.get('hs')).toBe('1001')
    expect(params.get('moq')).toBe('20 tons')
    expect(params.get('seller')).toBe('kaz')
    expect(params.get('q')).toBe('wheat')
    expect(params.get('incoterms')).toBe('FOB,CIF')
    expect(params.get('certificates')).toBe('Verified,ISO')
    expect(params.get('verified')).toBe('1')
    expect(params.get('privateLabel')).toBe('1')
    expect(params.get('responseTime')).toBe('standard')
  })
})
