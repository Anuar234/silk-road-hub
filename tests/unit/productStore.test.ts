import { describe, expect, it } from 'vitest'
import {
  createProduct,
  getProductById,
  getProductsBySeller,
  getAllProducts,
  updateProduct,
  deleteProduct,
} from '../../pages/api/_lib/productStore'

describe('product store CRUD', () => {
  it('creates a product with draft status', () => {
    const product = createProduct('seller-1', {
      name: 'Test Honey',
      category: 'FMCG',
      sectorId: 'agro',
      subcategoryId: 'agro-honey',
      hsCode: '040900',
      moq: '1000 units',
      price: '$2.50',
      countryCode: 'KZ',
      regionCode: 'KZ-AST',
    })

    expect(product.id).toMatch(/^prod-/)
    expect(product.slug).toContain('test-honey')
    expect(product.status).toBe('draft')
    expect(product.sellerId).toBe('seller-1')
    expect(product.countryCode).toBe('KZ')
    expect(product.regionCode).toBe('KZ-AST')
    expect(product.samplesAvailable).toBe(false)
    expect(product.privateLabel).toBe(false)
  })

  it('retrieves product by id', () => {
    const product = createProduct('seller-2', {
      name: 'Test Oil',
      category: 'Agro',
      sectorId: 'agro',
      subcategoryId: 'agro-oilseed',
    })

    const found = getProductById(product.id)
    expect(found?.name).toBe('Test Oil')
  })

  it('returns null for non-existent product', () => {
    expect(getProductById('nonexistent')).toBeNull()
  })

  it('gets products by seller', () => {
    createProduct('seller-filter', { name: 'A', category: '', sectorId: 'agro', subcategoryId: 'agro-grains' })
    createProduct('seller-filter', { name: 'B', category: '', sectorId: 'fmcg', subcategoryId: 'fmcg-dairy' })
    createProduct('seller-other', { name: 'C', category: '', sectorId: 'tech', subcategoryId: 'tech-chips' })

    const products = getProductsBySeller('seller-filter')
    expect(products.length).toBe(2)
    expect(products.every((p) => p.sellerId === 'seller-filter')).toBe(true)
  })

  it('updates product fields', () => {
    const product = createProduct('seller-update', {
      name: 'Original Name',
      category: 'FMCG',
      sectorId: 'fmcg',
      subcategoryId: 'fmcg-dairy',
    })

    const updated = updateProduct(product.id, {
      name: 'Updated Name',
      price: '$5.00',
      samplesAvailable: true,
      privateLabel: true,
    })

    expect(updated?.name).toBe('Updated Name')
    expect(updated?.price).toBe('$5.00')
    expect(updated?.samplesAvailable).toBe(true)
    expect(updated?.privateLabel).toBe(true)
  })

  it('updates product status (admin moderation)', () => {
    const product = createProduct('seller-mod', {
      name: 'For Moderation',
      category: '',
      sectorId: 'metals',
      subcategoryId: 'metals-ferrous',
    })

    const moderated = updateProduct(product.id, {
      status: 'published',
      moderationComment: 'Approved',
    })

    expect(moderated?.status).toBe('published')
    expect(moderated?.moderationComment).toBe('Approved')
  })

  it('deletes a product', () => {
    const product = createProduct('seller-del', {
      name: 'To Delete',
      category: '',
      sectorId: 'tech',
      subcategoryId: 'tech-iot',
    })

    expect(deleteProduct(product.id)).toBe(true)
    expect(getProductById(product.id)).toBeNull()
    expect(deleteProduct(product.id)).toBe(false)
  })

  it('filters all products by status', () => {
    const p1 = createProduct('seller-status', { name: 'Draft', category: '', sectorId: 'agro', subcategoryId: 'agro-grains' })
    createProduct('seller-status', { name: 'Draft2', category: '', sectorId: 'agro', subcategoryId: 'agro-grains' })
    updateProduct(p1.id, { status: 'published' })

    const published = getAllProducts('published')
    expect(published.some((p) => p.id === p1.id)).toBe(true)

    const drafts = getAllProducts('draft')
    expect(drafts.every((p) => p.status === 'draft')).toBe(true)
  })
})
