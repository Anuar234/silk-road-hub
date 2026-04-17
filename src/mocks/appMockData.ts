import type { Product } from '@mocks/mockData'
import { products } from '@mocks/mockData'

export type ProductStatus = 'Черновик' | 'На модерации' | 'Опубликовано' | 'Отклонено'

export type AppProduct = Product & {
  status: ProductStatus
}

const statusById: Record<string, ProductStatus> = {
  'p-honey-500g': 'Опубликовано',
  'p-sunflower-oil': 'На модерации',
  'p-flour': 'Черновик',
  'p-tshirts': 'Отклонено',
}

export const appProducts: AppProduct[] = products.map((p) => ({
  ...p,
  status: statusById[p.id] ?? 'Черновик',
}))

