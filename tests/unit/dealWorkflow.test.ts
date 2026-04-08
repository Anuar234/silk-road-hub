import { describe, expect, it } from 'vitest'
import {
  addDealDocument,
  createDeal,
  getDealById,
  updateDealStatus,
  updateDocumentStatus,
} from '../../src/data/dealData'

describe('deal workflow contract', () => {
  it('creates a deal with the expected initial workflow shape', () => {
    const deal = createDeal('buyer-test', 'kazagro-foods', 'p-honey-500g', 'thread-1', {
      quantity: '1 container',
      destinationCountry: 'Germany',
      targetTimeline: 'Q4 2026',
      incoterms: 'FOB Almaty',
      buyerComment: 'Urgent order',
    })

    expect(deal.id).toMatch(/^deal-/)
    expect(deal.status).toBe('new')
    expect(deal.threadId).toBe('thread-1')
    expect(deal.readiness.buyerInfoComplete).toBe(true)
    expect(deal.readiness.productInfoComplete).toBe(true)
    expect(getDealById(deal.id)?.id).toBe(deal.id)
  })

  it('tracks status changes and uploaded documents consistently', () => {
    const deal = createDeal('buyer-test', 'sunflower-oil-kz', 'p-sunflower-oil', 'thread-2', {
      quantity: '2 containers',
      destinationCountry: 'Turkey',
      targetTimeline: 'May 2026',
      incoterms: 'FOB Almaty',
      buyerComment: 'Need docs quickly',
    })

    const updated = updateDealStatus(deal.id, 'under_review', 'Администратор', 'Начата проверка', 'admin')
    expect(updated?.status).toBe('under_review')
    expect(updated?.statusHistory.at(-1)?.to).toBe('under_review')

    const doc = addDealDocument(deal.id, {
      name: 'Contract',
      type: 'contract',
      status: 'uploaded',
      uploadedAt: new Date().toISOString(),
      uploadedByRole: 'buyer',
      note: 'Uploaded from test',
    })

    const persisted = getDealById(deal.id)

    expect(doc?.id).toMatch(/^doc-/)
    expect(persisted?.documents.some((item) => item.id === doc?.id)).toBe(true)
    expect(persisted?.readiness.docsUploaded).toBe(true)

    const reviewed = updateDocumentStatus(deal.id, doc!.id, 'approved', 'Looks good')
    const afterReview = getDealById(deal.id)

    expect(reviewed?.status).toBe('approved')
    expect(reviewed?.reviewComment).toBe('Looks good')
    expect(afterReview?.readiness.docsApproved).toBe(true)
  })
})
