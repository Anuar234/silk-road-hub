import { describe, expect, it } from 'vitest'
import {
  createShipment,
  getShipmentById,
  getShipmentsByDeal,
  updateShipmentStage,
  addShipmentDocument,
  ROUTE_TEMPLATES,
} from '@features/logistics/logisticsData'

describe('logistics workflow', () => {
  it('creates a shipment from a route template', () => {
    const template = ROUTE_TEMPLATES[0] // KZ → CN
    const shipment = createShipment({
      dealId: 'deal-logistics-1',
      routeTemplateId: template.id,
    })

    expect(shipment.id).toMatch(/^ship-/)
    expect(shipment.dealId).toBe('deal-logistics-1')
    expect(shipment.origin).toBe(template.origin)
    expect(shipment.destination).toBe(template.destination)
    expect(shipment.routeName).toBe(template.name)
    expect(shipment.stages.length).toBe(template.stages.length)
    expect(shipment.stages.every((s) => s.status === 'pending')).toBe(true)
    expect(shipment.documentIds).toEqual([])
  })

  it('creates a shipment without template', () => {
    const shipment = createShipment({
      dealId: 'deal-logistics-2',
      origin: 'Алматы',
      destination: 'Москва',
    })

    expect(shipment.origin).toBe('Алматы')
    expect(shipment.destination).toBe('Москва')
    expect(shipment.stages.length).toBe(4) // default stages
  })

  it('retrieves shipments by deal', () => {
    createShipment({ dealId: 'deal-multi-ship', routeTemplateId: ROUTE_TEMPLATES[0].id })
    createShipment({ dealId: 'deal-multi-ship', routeTemplateId: ROUTE_TEMPLATES[1].id })

    const byDeal = getShipmentsByDeal('deal-multi-ship')
    expect(byDeal.length).toBe(2)
  })

  it('updates shipment stage status', () => {
    const shipment = createShipment({
      dealId: 'deal-stage-update',
      routeTemplateId: ROUTE_TEMPLATES[0].id,
    })

    const stageId = shipment.stages[0].id
    const updated = updateShipmentStage(shipment.id, stageId, {
      status: 'completed',
      location: 'Склад Алматы',
      date: '2026-04-01',
      notes: 'Отгружено',
    })

    expect(updated).not.toBeNull()
    const stage = updated!.stages.find((s) => s.id === stageId)
    expect(stage?.status).toBe('completed')
    expect(stage?.location).toBe('Склад Алматы')
    expect(stage?.date).toBe('2026-04-01')
  })

  it('adds document to shipment', () => {
    const shipment = createShipment({
      dealId: 'deal-ship-doc',
      routeTemplateId: ROUTE_TEMPLATES[2].id,
    })

    const ok = addShipmentDocument(shipment.id, 'file-cmr-001')
    expect(ok).toBe(true)

    const fromStore = getShipmentById(shipment.id)
    expect(fromStore?.documentIds).toContain('file-cmr-001')
  })

  it('returns null for non-existent shipment update', () => {
    const result = updateShipmentStage('nonexistent', 'stage-1', { status: 'completed' })
    expect(result).toBeNull()
  })

  it('has at least 5 route templates', () => {
    expect(ROUTE_TEMPLATES.length).toBeGreaterThanOrEqual(5)
  })
})
