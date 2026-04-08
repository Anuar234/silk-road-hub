import { describe, expect, it } from 'vitest'
import { getExistingDealThreadForAuth, getThreadsForAuth } from '../../src/data/platformSelectors'
import type { AuthState } from '../../src/auth/auth'

const buyerAuth: AuthState = {
  isAuthenticated: true,
  email: 'Test',
  displayName: 'Test',
  role: 'buyer',
  verified: false,
  emailVerified: false,
  companyName: null,
  bin: null,
  position: null,
}

describe('platform selector contract', () => {
  it('returns only threads visible to the current auth context', () => {
    const threads = getThreadsForAuth(buyerAuth)

    expect(threads.length).toBeGreaterThan(0)
    expect(threads.every((thread) => thread.buyerId === 'buyer-test')).toBe(true)
  })

  it('finds an existing thread/deal pair for a known buyer and product', () => {
    const linkedFlow = getExistingDealThreadForAuth(buyerAuth, 'kazagro-foods', 'p-honey-500g')

    expect(linkedFlow.thread?.id).toBe('thread-1')
    expect(linkedFlow.deal?.id).toBe('deal-1')
  })

  it('returns empty flow for anonymous users', () => {
    const anonAuth: AuthState = {
      ...buyerAuth,
      isAuthenticated: false,
      email: null,
      displayName: null,
      role: null,
    }

    const linkedFlow = getExistingDealThreadForAuth(anonAuth, 'kazagro-foods', 'p-honey-500g')

    expect(linkedFlow.thread).toBeNull()
    expect(linkedFlow.deal).toBeNull()
  })
})
