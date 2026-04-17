import type { AuthState } from '@features/auth/auth'
import { getAllDeals, getDealById, getDealsByBuyer, getDealsBySeller, type DealCase } from '@features/deals/dealData'
import { getExistingThread, getParticipantId, getSellerIdFromAuth, getThreadMessages, threads, type Thread } from '@features/messaging/messagingData'

/**
 * Role-aware selector layer over the in-memory platform data.
 * These helpers capture current visibility rules and therefore should be
 * treated as behavior contracts during migration rather than convenience utils.
 */
export function getDealsForAuth(auth: AuthState): DealCase[] {
  const myId = getParticipantId(auth)
  const mySellerId = getSellerIdFromAuth(auth)

  if (auth.role === 'seller' && mySellerId) {
    const asBuyer = getDealsByBuyer(mySellerId)
    const asSeller = getDealsBySeller(mySellerId)
    const combined = new Map<string, DealCase>()

    for (const deal of [...asBuyer, ...asSeller]) {
      combined.set(deal.id, deal)
    }

    return [...combined.values()].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }

  return getDealsByBuyer(myId)
}

export function getThreadsForAuth(auth: AuthState): Thread[] {
  const myId = getParticipantId(auth)
  const mySellerId = getSellerIdFromAuth(auth)

  return threads
    .filter((thread) => {
      if (thread.buyerId === myId || thread.sellerId === myId) return true
      if (mySellerId && (thread.buyerId === mySellerId || thread.sellerId === mySellerId)) return true
      return false
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export function getUnreadCountForAuth(auth: AuthState): number {
  const myThreads = getThreadsForAuth(auth)
  const ownRole = auth.role === 'seller' ? 'seller' : auth.role === 'admin' ? 'admin' : 'buyer'

  return myThreads.reduce((count, thread) => {
    return (
      count +
      getThreadMessages(thread.id).filter((message) => !message.isRead && !message.isSystemMessage && message.senderRole !== ownRole).length
    )
  }, 0)
}

export function getExistingDealThreadForAuth(auth: AuthState, sellerId: string, productId: string): { thread: Thread | null; deal: DealCase | null } {
  if (!auth.isAuthenticated) {
    return { thread: null, deal: null }
  }

  const buyerId = getParticipantId(auth)
  const thread = getExistingThread(buyerId, sellerId, productId)
  const deal = thread?.relatedDealId ? getDealById(thread.relatedDealId) ?? null : null

  return { thread, deal }
}

export function getProblemDeals(daysThreshold = 5): DealCase[] {
  const now = Date.now()
  const maxAgeMs = daysThreshold * 24 * 60 * 60 * 1000
  return getAllDeals()
    .filter((deal) => !['completed', 'cancelled'].includes(deal.status))
    .filter((deal) => now - new Date(deal.updatedAt).getTime() > maxAgeMs)
}
