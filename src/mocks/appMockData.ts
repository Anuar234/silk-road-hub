import type { Product } from '@mocks/mockData'
import { products } from '@mocks/mockData'

// Russian display labels mirroring the productApi.ts ProductStatus enum.
// ТЗ §5.2 calls out four user-facing statuses (Черновик, Опубликовано,
// В переговорах, Архивировано); 'На модерации' and 'Отклонено' are admin
// transitions that the seller still needs to see while their card is being
// reviewed.
export type ProductStatus =
  | 'Черновик'
  | 'На модерации'
  | 'Опубликовано'
  | 'Отклонено'
  | 'В переговорах'
  | 'Архивировано'

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

