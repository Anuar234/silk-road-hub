import { describe, expect, it } from 'vitest'
import {
  createContract,
  getContractById,
  getContractsByDeal,
  getAllContracts,
  updateContract,
} from '@features/contracts/contractData'

describe('contract workflow', () => {
  it('creates a contract with default draft status', () => {
    const contract = createContract({
      dealId: 'deal-test-1',
      templateType: 'export',
      applicableLaw: 'KZ',
    })

    expect(contract.id).toMatch(/^contract-/)
    expect(contract.dealId).toBe('deal-test-1')
    expect(contract.templateType).toBe('export')
    expect(contract.applicableLaw).toBe('KZ')
    expect(contract.status).toBe('draft')
    expect(contract.signedDocFileId).toBeNull()
    expect(contract.deadlines).toEqual([])
  })

  it('retrieves contracts by deal', () => {
    createContract({ dealId: 'deal-multi', templateType: 'export', applicableLaw: 'KZ' })
    createContract({ dealId: 'deal-multi', templateType: 'investment', applicableLaw: 'EN' })
    createContract({ dealId: 'deal-other', templateType: 'framework', applicableLaw: 'ICC' })

    const byDeal = getContractsByDeal('deal-multi')
    expect(byDeal.length).toBe(2)
    expect(byDeal.every((c) => c.dealId === 'deal-multi')).toBe(true)
  })

  it('updates contract status and notes', () => {
    const contract = createContract({
      dealId: 'deal-update',
      templateType: 'framework',
      applicableLaw: 'UNCITRAL',
      notes: 'Initial notes',
    })

    const updated = updateContract(contract.id, {
      status: 'signed',
      signedDocFileId: 'file-signed-001',
      notes: 'Updated notes',
    })

    expect(updated?.status).toBe('signed')
    expect(updated?.signedDocFileId).toBe('file-signed-001')
    expect(updated?.notes).toBe('Updated notes')

    const fromStore = getContractById(contract.id)
    expect(fromStore?.status).toBe('signed')
  })

  it('returns null for non-existent contract update', () => {
    const result = updateContract('nonexistent', { status: 'active' })
    expect(result).toBeNull()
  })

  it('getAllContracts returns all contracts', () => {
    const all = getAllContracts()
    expect(all.length).toBeGreaterThan(0)
  })
})
