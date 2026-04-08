import { CATALOG_SECTORS } from './catalogStructure'
import { deals, getAllDeals, getDealProduct, getDealSeller, type DealCase, type DealStatus } from './dealData'
import { getThreadMessages, threads } from './messagingData'
import { products, sellers, type Product, type Seller } from './mockData'

export type AdminUserRecord = {
  id: string
  role: 'buyer' | 'seller'
  name: string
  company?: string
  country?: string
  city?: string
  verified: boolean
  activeDeals: number
  completedDeals: number
  messages: number
}

export type AdminFunnelMetric = {
  label: string
  count: number
}

const KNOWN_BUYERS: AdminUserRecord[] = [
  {
    id: 'buyer-test',
    role: 'buyer',
    name: 'Test',
    company: 'Demo Buyer',
    country: 'Казахстан',
    city: 'Алматы',
    verified: true,
    activeDeals: 0,
    completedDeals: 0,
    messages: 0,
  },
]

export function getAdminUsers(): AdminUserRecord[] {
  const allDeals = getAllDeals()
  const sellerUsers = sellers.map((seller) => buildSellerRecord(seller, allDeals))
  const buyersMap = new Map(KNOWN_BUYERS.map((buyer) => [buyer.id, { ...buyer }]))

  for (const deal of allDeals) {
    const buyer = buyersMap.get(deal.buyerId)
    if (!buyer) continue
    if (deal.status === 'completed') buyer.completedDeals += 1
    else if (deal.status !== 'cancelled') buyer.activeDeals += 1
  }

  for (const thread of threads) {
    const buyer = buyersMap.get(thread.buyerId)
    if (buyer) buyer.messages += getThreadMessages(thread.id).length
  }

  return [...sellerUsers, ...buyersMap.values()].sort((a, b) => b.activeDeals - a.activeDeals || a.name.localeCompare(b.name, 'ru'))
}

function buildSellerRecord(seller: Seller, allDeals: DealCase[]): AdminUserRecord {
  const sellerDeals = allDeals.filter((deal) => deal.sellerId === seller.id || deal.buyerId === seller.id)
  const messagesCount = threads
    .filter((thread) => thread.sellerId === seller.id || thread.buyerId === seller.id)
    .reduce((sum, thread) => sum + getThreadMessages(thread.id).length, 0)

  return {
    id: seller.id,
    role: 'seller',
    name: seller.name,
    company: seller.name,
    country: seller.country,
    city: seller.city,
    verified: seller.isVerified ?? seller.trustBadges.includes('Verified'),
    activeDeals: sellerDeals.filter((deal) => !['completed', 'cancelled'].includes(deal.status)).length,
    completedDeals: sellerDeals.filter((deal) => deal.status === 'completed').length,
    messages: messagesCount,
  }
}

export function getAdminUserById(userId: string): AdminUserRecord | null {
  return getAdminUsers().find((user) => user.id === userId) ?? null
}

export function getCatalogProductsForAdmin(): Array<Product & { activeDealsCount: number; sectorName: string }> {
  return products.map((product) => {
    const activeDealsCount = deals.filter((deal) => deal.productId === product.id && !['completed', 'cancelled'].includes(deal.status)).length
    const sectorName = CATALOG_SECTORS.find((sector) => sector.id === product.sectorId)?.name ?? 'Другое'
    return { ...product, activeDealsCount, sectorName }
  })
}

export function getAdminProductById(productId: string): (Product & { activeDeals: DealCase[]; sectorName: string }) | null {
  const product = products.find((item) => item.id === productId)
  if (!product) return null
  const activeDeals = getAllDeals().filter((deal) => deal.productId === productId)
  const sectorName = CATALOG_SECTORS.find((sector) => sector.id === product.sectorId)?.name ?? 'Другое'
  return { ...product, activeDeals, sectorName }
}

export function getStatusCounts(): Record<DealStatus, number> {
  const counts = {
    new: 0,
    under_review: 0,
    waiting_buyer_info: 0,
    waiting_seller_info: 0,
    documents_preparation: 0,
    negotiating: 0,
    approved: 0,
    completed: 0,
    cancelled: 0,
  } satisfies Record<DealStatus, number>

  for (const deal of getAllDeals()) {
    counts[deal.status] += 1
  }

  return counts
}

export function getAdminFunnel(): AdminFunnelMetric[] {
  const allDeals = getAllDeals()
  const conversationCount = threads.length
  const dealCount = allDeals.length
  const documentCount = allDeals.filter((deal) => deal.statusHistory.some((entry) => entry.to === 'documents_preparation') || ['documents_preparation', 'approved', 'completed'].includes(deal.status)).length
  const completedCount = allDeals.filter((deal) => deal.status === 'completed').length

  return [
    { label: 'Переписка', count: conversationCount },
    { label: 'Сделка', count: dealCount },
    { label: 'Документы', count: documentCount },
    { label: 'Завершено', count: completedCount },
  ]
}

export function getAverageResponseHours(): number | null {
  const durations: number[] = []
  for (const thread of threads) {
    const messages = getThreadMessages(thread.id)
    for (let index = 1; index < messages.length; index += 1) {
      const previous = messages[index - 1]
      const current = messages[index]
      if (previous.senderRole === current.senderRole) continue
      durations.push((new Date(current.createdAt).getTime() - new Date(previous.createdAt).getTime()) / (1000 * 60 * 60))
    }
  }
  if (!durations.length) return null
  return durations.reduce((sum, hours) => sum + hours, 0) / durations.length
}

export function getAverageMessageToDealHours(): number | null {
  const durations = threads
    .filter((thread) => thread.relatedDealId)
    .map((thread) => {
      const firstMessage = getThreadMessages(thread.id)[0]
      const relatedDeal = getAllDeals().find((deal) => deal.id === thread.relatedDealId)
      if (!firstMessage || !relatedDeal) return null
      return (new Date(relatedDeal.createdAt).getTime() - new Date(firstMessage.createdAt).getTime()) / (1000 * 60 * 60)
    })
    .filter((value): value is number => value !== null)

  if (!durations.length) return null
  return durations.reduce((sum, hours) => sum + hours, 0) / durations.length
}

export function getAverageDocumentPreparationDays(): number | null {
  const durations = getAllDeals()
    .map((deal) => {
      const docStart = deal.statusHistory.find((entry) => entry.to === 'documents_preparation')
      const endStatus = deal.statusHistory.find((entry) => entry.to === 'approved' || entry.to === 'completed')
      if (!docStart || !endStatus) return null
      return (new Date(endStatus.changedAt).getTime() - new Date(docStart.changedAt).getTime()) / (1000 * 60 * 60 * 24)
    })
    .filter((value): value is number => value !== null)

  if (!durations.length) return null
  return durations.reduce((sum, days) => sum + days, 0) / durations.length
}

export function getAdminMessagesView() {
  return threads
    .map((thread) => {
      const deal = thread.relatedDealId ? getAllDeals().find((item) => item.id === thread.relatedDealId) ?? null : null
      const product = getThreadProductSafe(thread.id)
      const seller = sellers.find((item) => item.id === thread.sellerId) ?? null
      const threadMessages = getThreadMessages(thread.id)
      return {
        thread,
        deal,
        product,
        seller,
        messages: threadMessages,
        lastMessage: threadMessages[threadMessages.length - 1] ?? null,
      }
    })
    .sort((a, b) => new Date(b.thread.updatedAt).getTime() - new Date(a.thread.updatedAt).getTime())
}

function getThreadProductSafe(threadId: string) {
  const thread = threads.find((item) => item.id === threadId)
  if (!thread?.productId) return null
  return products.find((product) => product.id === thread.productId) ?? null
}

export function getTopProductsByDeals(limit = 5) {
  const map = new Map<string, { product: Product; count: number }>()
  for (const deal of getAllDeals()) {
    const product = getDealProduct(deal)
    if (!product) continue
    const existing = map.get(product.id)
    if (existing) existing.count += 1
    else map.set(product.id, { product, count: 1 })
  }
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, limit)
}

export function getTopSellersByDeals(limit = 5) {
  const map = new Map<string, { seller: Seller; count: number }>()
  for (const deal of getAllDeals()) {
    const seller = getDealSeller(deal)
    if (!seller) continue
    const existing = map.get(seller.id)
    if (existing) existing.count += 1
    else map.set(seller.id, { seller, count: 1 })
  }
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, limit)
}
