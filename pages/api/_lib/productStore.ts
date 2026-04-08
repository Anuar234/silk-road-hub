import { randomBytes } from 'node:crypto'
import type { NextApiRequest, NextApiResponse } from 'next'

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
  category: string
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
  moderationComment?: string | null
}

const products = new Map<string, ServerProduct>()

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-zа-яёғқңүұһәіө0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

export function createProduct(sellerId: string, input: CreateProductInput): ServerProduct {
  const id = `prod-${randomBytes(8).toString('hex')}`
  const now = new Date().toISOString()
  const product: ServerProduct = {
    id,
    slug: `${slugify(input.name)}-${id.slice(5, 13)}`,
    name: input.name.trim(),
    category: input.category?.trim() ?? '',
    hsCode: input.hsCode?.trim() ?? '',
    moq: input.moq?.trim() ?? '',
    incoterms: input.incoterms?.trim() ?? 'EXW',
    price: input.price?.trim() ?? '',
    leadTimeDays: input.leadTimeDays ?? 0,
    packaging: input.packaging?.trim() ?? '',
    description: input.description?.trim() ?? '',
    imageUrls: input.imageUrls ?? [],
    sellerId,
    countryCode: input.countryCode?.trim() ?? 'KZ',
    regionCode: input.regionCode?.trim() ?? null,
    sectorId: input.sectorId,
    subcategoryId: input.subcategoryId,
    tags: input.tags ?? [],
    samplesAvailable: input.samplesAvailable ?? false,
    privateLabel: input.privateLabel ?? false,
    status: 'draft',
    moderationComment: null,
    createdAt: now,
    updatedAt: now,
  }
  products.set(id, product)
  return product
}

export function updateProduct(id: string, input: UpdateProductInput): ServerProduct | null {
  const product = products.get(id)
  if (!product) return null

  if (input.name !== undefined) product.name = input.name.trim()
  if (input.category !== undefined) product.category = input.category.trim()
  if (input.hsCode !== undefined) product.hsCode = input.hsCode.trim()
  if (input.moq !== undefined) product.moq = input.moq.trim()
  if (input.incoterms !== undefined) product.incoterms = input.incoterms.trim()
  if (input.price !== undefined) product.price = input.price.trim()
  if (input.leadTimeDays !== undefined) product.leadTimeDays = input.leadTimeDays
  if (input.packaging !== undefined) product.packaging = input.packaging.trim()
  if (input.description !== undefined) product.description = input.description.trim()
  if (input.imageUrls !== undefined) product.imageUrls = input.imageUrls
  if (input.countryCode !== undefined) product.countryCode = input.countryCode.trim()
  if (input.regionCode !== undefined) product.regionCode = input.regionCode.trim() || null
  if (input.sectorId !== undefined) product.sectorId = input.sectorId
  if (input.subcategoryId !== undefined) product.subcategoryId = input.subcategoryId
  if (input.tags !== undefined) product.tags = input.tags
  if (input.samplesAvailable !== undefined) product.samplesAvailable = input.samplesAvailable
  if (input.privateLabel !== undefined) product.privateLabel = input.privateLabel
  if (input.status !== undefined) product.status = input.status
  if (input.moderationComment !== undefined) product.moderationComment = input.moderationComment
  product.updatedAt = new Date().toISOString()

  return product
}

export function getProductById(id: string): ServerProduct | null {
  return products.get(id) ?? null
}

export function getProductsBySeller(sellerId: string): ServerProduct[] {
  return [...products.values()].filter((p) => p.sellerId === sellerId)
}

export function getAllProducts(statusFilter?: ProductStatus): ServerProduct[] {
  const all = [...products.values()]
  if (statusFilter) return all.filter((p) => p.status === statusFilter)
  return all
}

export function getPublishedProducts(): ServerProduct[] {
  return getAllProducts('published')
}

export function deleteProduct(id: string): boolean {
  return products.delete(id)
}

export default function notAnApiRoute(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Allow', '')
  return res.status(404).json({ error: 'NOT_FOUND' })
}
