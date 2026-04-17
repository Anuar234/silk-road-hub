import { describe, expect, it } from 'vitest'
import {
  createPaymentPlan,
  getPaymentPlan,
  updatePaymentStage,
  DEFAULT_PAYMENT_STAGES,
  getDealGuarantees,
  setDealGuarantee,
  GUARANTEE_TYPES,
} from '@features/deals/dealData'

describe('payment stages', () => {
  it('creates a payment plan with correct stage amounts', () => {
    const plan = createPaymentPlan('deal-pay-1', 100_000, DEFAULT_PAYMENT_STAGES)

    expect(plan.dealId).toBe('deal-pay-1')
    expect(plan.totalUsd).toBe(100_000)
    expect(plan.stages.length).toBe(3)

    expect(plan.stages[0].label).toBe('Аванс (предоплата)')
    expect(plan.stages[0].percentage).toBe(30)
    expect(plan.stages[0].amountUsd).toBe(30_000)
    expect(plan.stages[0].status).toBe('pending')

    expect(plan.stages[1].percentage).toBe(50)
    expect(plan.stages[1].amountUsd).toBe(50_000)

    expect(plan.stages[2].percentage).toBe(20)
    expect(plan.stages[2].amountUsd).toBe(20_000)
  })

  it('retrieves payment plan by deal', () => {
    createPaymentPlan('deal-pay-get', 50_000, DEFAULT_PAYMENT_STAGES)
    const plan = getPaymentPlan('deal-pay-get')
    expect(plan).not.toBeNull()
    expect(plan?.totalUsd).toBe(50_000)
  })

  it('returns null for non-existent plan', () => {
    expect(getPaymentPlan('nonexistent-deal')).toBeNull()
  })

  it('updates payment stage status', () => {
    const plan = createPaymentPlan('deal-pay-update', 80_000, DEFAULT_PAYMENT_STAGES)
    const stageId = plan.stages[0].id

    const updated = updatePaymentStage('deal-pay-update', stageId, {
      status: 'invoiced',
      dueDate: '2026-05-01',
    })

    expect(updated).not.toBeNull()
    const stage = updated!.stages.find((s) => s.id === stageId)
    expect(stage?.status).toBe('invoiced')
    expect(stage?.dueDate).toBe('2026-05-01')
  })

  it('marks stage as paid', () => {
    const plan = createPaymentPlan('deal-pay-paid', 60_000, DEFAULT_PAYMENT_STAGES)
    const stageId = plan.stages[0].id

    updatePaymentStage('deal-pay-paid', stageId, {
      status: 'paid',
      paidAt: '2026-04-15',
    })

    const result = getPaymentPlan('deal-pay-paid')
    const stage = result!.stages.find((s) => s.id === stageId)
    expect(stage?.status).toBe('paid')
    expect(stage?.paidAt).toBe('2026-04-15')
  })
})

describe('guarantees', () => {
  it('sets and retrieves deal guarantees', () => {
    const list = setDealGuarantee('deal-guar-1', 'export_credit', true, 'KazakhExport одобрено')

    expect(list.length).toBe(1)
    expect(list[0].type).toBe('export_credit')
    expect(list[0].enabled).toBe(true)
    expect(list[0].notes).toBe('KazakhExport одобрено')
    expect(list[0].provider).toBe('KazakhExport')
  })

  it('toggles guarantee on/off', () => {
    setDealGuarantee('deal-guar-toggle', 'insurance', true)
    let list = getDealGuarantees('deal-guar-toggle')
    expect(list.find((g) => g.type === 'insurance')?.enabled).toBe(true)

    setDealGuarantee('deal-guar-toggle', 'insurance', false)
    list = getDealGuarantees('deal-guar-toggle')
    expect(list.find((g) => g.type === 'insurance')?.enabled).toBe(false)
  })

  it('supports multiple guarantee types', () => {
    setDealGuarantee('deal-guar-multi', 'export_credit', true)
    setDealGuarantee('deal-guar-multi', 'letter_of_credit', true)
    setDealGuarantee('deal-guar-multi', 'bank_guarantee', false)

    const list = getDealGuarantees('deal-guar-multi')
    expect(list.length).toBe(3)
    expect(list.filter((g) => g.enabled).length).toBe(2)
  })

  it('returns empty array for deal without guarantees', () => {
    expect(getDealGuarantees('nonexistent')).toEqual([])
  })

  it('has 4 guarantee types defined', () => {
    expect(GUARANTEE_TYPES.length).toBe(4)
  })
})
