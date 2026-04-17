import type { Product } from '@mocks/mockData'
import { products } from '@mocks/mockData'
import type { AuthState } from '@features/auth/auth'
import { notifyPlatformDataChange } from '@features/platform/storeEvents'

/**
 * In-memory messaging store used by buyer, seller, and admin flows.
 * Threads and messages are part of the current product contract because deal
 * creation, admin escalation, and unread counters all derive from them.
 */
/** ID текущего покупателя в демо (логин Test или BuyerVerified). */
export const DEMO_BUYER_ID = 'buyer-test'

const SELLER_LOGIN_TO_ID: Record<string, string> = {
  Test123: 'test-company-seller',
}

/**
 * Returns the participant ID for the current user in the messaging/deal system.
 * Buyers always get DEMO_BUYER_ID.
 * Sellers get their mapped seller ID from the login.
 */
export function getParticipantId(auth: AuthState): string {
  if (auth.role === 'admin') return 'admin-panel'
  if (auth.role === 'seller' && auth.email) {
    return SELLER_LOGIN_TO_ID[auth.email] ?? auth.email
  }
  return DEMO_BUYER_ID
}

/**
 * Returns the seller ID for the current seller user (or null if not a seller).
 */
export function getSellerIdFromAuth(auth: AuthState): string | null {
  if (auth.role !== 'seller' || !auth.email) return null
  return SELLER_LOGIN_TO_ID[auth.email] ?? auth.email
}

export type Thread = {
  id: string
  buyerId: string
  sellerId: string
  productId: string | null
  relatedDealId?: string
  createdAt: string
  updatedAt: string
}

export type Message = {
  id: string
  threadId: string
  senderId: string
  senderRole: 'buyer' | 'seller' | 'admin'
  body: string
  createdAt: string
  isRead: boolean
  isSystemMessage?: boolean
}

export const threads: Thread[] = [
  {
    id: 'thread-1',
    buyerId: DEMO_BUYER_ID,
    sellerId: 'kazagro-foods',
    productId: 'p-honey-500g',
    relatedDealId: 'deal-1',
    createdAt: '2025-03-01T10:00:00Z',
    updatedAt: '2025-03-08T10:30:00Z',
  },
  {
    id: 'thread-2',
    buyerId: DEMO_BUYER_ID,
    sellerId: 'sunflower-oil-kz',
    productId: 'p-sunflower-oil',
    relatedDealId: 'deal-2',
    createdAt: '2025-03-03T09:00:00Z',
    updatedAt: '2025-03-10T08:05:00Z',
  },
]

export const messages: Message[] = [
  { id: 'm1', threadId: 'thread-1', senderId: DEMO_BUYER_ID, senderRole: 'buyer', body: 'Добрый день. Интересует партия мёда под private label. Какой MOQ?', createdAt: '2025-03-01T10:00:00Z', isRead: true },
  { id: 'm2', threadId: 'thread-1', senderId: 'kazagro-foods', senderRole: 'seller', body: 'Здравствуйте! MOQ от 10 000 единиц. Можем подготовить образцы и маркировку.', createdAt: '2025-03-01T12:30:00Z', isRead: true },
  { id: 'm3', threadId: 'thread-1', senderId: DEMO_BUYER_ID, senderRole: 'buyer', body: 'Отправьте, пожалуйста, коммерческое предложение на 15 000 шт.', createdAt: '2025-03-02T14:30:00Z', isRead: true },
  { id: 'm4-sys', threadId: 'thread-1', senderId: 'system', senderRole: 'admin', body: 'Создана сделка #deal-1 — Мёд натуральный, 15 000 единиц → Германия', createdAt: '2025-03-04T11:00:00Z', isRead: true, isSystemMessage: true },
  { id: 'm5-admin', threadId: 'thread-1', senderId: 'admin-panel', senderRole: 'admin', body: 'Добрый день. Администрация Silk Road Hub подключилась к сделке. Проверяем документы обеих сторон, свяжемся в ближайшее время.', createdAt: '2025-03-05T14:00:00Z', isRead: true },
  { id: 'm6', threadId: 'thread-2', senderId: DEMO_BUYER_ID, senderRole: 'buyer', body: 'Нужно подсолнечное масло, 2 контейнера. FOB Алматы возможно?', createdAt: '2025-03-03T09:00:00Z', isRead: true },
  { id: 'm7', threadId: 'thread-2', senderId: 'sunflower-oil-kz', senderRole: 'seller', body: 'Да, FOB Алматы работаем. В течение 24 часов пришлю расчёт.', createdAt: '2025-03-03T09:15:00Z', isRead: true },
  { id: 'm8-sys', threadId: 'thread-2', senderId: 'system', senderRole: 'admin', body: 'Создана сделка #deal-2 — Подсолнечное масло, 2 контейнера → Турция', createdAt: '2025-03-10T08:00:00Z', isRead: true, isSystemMessage: true },
]

export function getThreadProduct(thread: Thread): Product | null {
  if (!thread.productId) return null
  return products.find((p) => p.id === thread.productId) ?? null
}

export function getThreadMessages(threadId: string): Message[] {
  return messages.filter((m) => m.threadId === threadId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

export function addMessage(threadId: string, senderId: string, senderRole: 'buyer' | 'seller' | 'admin', body: string): Message {
  // New messages immediately affect unread counters, thread ordering, and
  // downstream admin/buyer/seller workflow visibility.
  const msg: Message = {
    id: `m-${Date.now()}`,
    threadId,
    senderId,
    senderRole,
    body,
    createdAt: new Date().toISOString(),
    isRead: false,
  }
  messages.push(msg)
  const thread = threads.find((t) => t.id === threadId)
  if (thread) {
    thread.updatedAt = msg.createdAt
  }
  notifyPlatformDataChange()
  return msg
}

export function addSystemMessage(threadId: string, body: string): Message {
  const msg: Message = {
    id: `m-sys-${Date.now()}`,
    threadId,
    senderId: 'system',
    senderRole: 'admin',
    body,
    createdAt: new Date().toISOString(),
    isRead: false,
    isSystemMessage: true,
  }
  messages.push(msg)
  const thread = threads.find((t) => t.id === threadId)
  if (thread) thread.updatedAt = msg.createdAt
  notifyPlatformDataChange()
  return msg
}

export function linkThreadToDeal(threadId: string, dealId: string): void {
  const thread = threads.find((t) => t.id === threadId)
  if (thread) thread.relatedDealId = dealId
  notifyPlatformDataChange()
}

export function getExistingThread(buyerId: string, sellerId: string, productId: string | null): Thread | null {
  return (
    threads.find((thread) => thread.buyerId === buyerId && thread.sellerId === sellerId && (productId ? thread.productId === productId : true)) ??
    null
  )
}

export function findOrCreateThread(buyerId: string, sellerId: string, productId: string | null): Thread {
  // Reuse-first behavior is important: the UI depends on stable thread identity
  // when deciding whether to open an existing dialog or create a fresh one.
  let t = getExistingThread(buyerId, sellerId, productId)
  if (t) return t
  t = {
    id: `thread-${Date.now()}`,
    buyerId,
    sellerId,
    productId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  threads.push(t)
  notifyPlatformDataChange()
  return t
}
