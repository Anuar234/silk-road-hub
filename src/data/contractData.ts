import { notifyPlatformDataChange } from './storeEvents'

export type ContractStatus = 'draft' | 'negotiation' | 'signed' | 'active' | 'completed' | 'terminated'
export type ContractTemplateType = 'export' | 'investment' | 'framework'
export type ApplicableLaw = 'KZ' | 'EN' | 'UNCITRAL' | 'ICC'

export type ContractDeadline = {
  id: string
  label: string
  date: string
  completed: boolean
}

export type Contract = {
  id: string
  dealId: string
  templateType: ContractTemplateType
  applicableLaw: ApplicableLaw
  status: ContractStatus
  signedDocFileId: string | null
  deadlines: ContractDeadline[]
  notes: string
  createdAt: string
  updatedAt: string
}

const contracts: Contract[] = []

let nextId = 1

export function getContractsByDeal(dealId: string): Contract[] {
  return contracts.filter((c) => c.dealId === dealId)
}

export function getContractById(id: string): Contract | undefined {
  return contracts.find((c) => c.id === id)
}

export function getAllContracts(): Contract[] {
  return [...contracts]
}

export function createContract(input: {
  dealId: string
  templateType: ContractTemplateType
  applicableLaw: ApplicableLaw
  deadlines?: ContractDeadline[]
  notes?: string
}): Contract {
  const now = new Date().toISOString()
  const contract: Contract = {
    id: `contract-${String(nextId++).padStart(4, '0')}`,
    dealId: input.dealId,
    templateType: input.templateType,
    applicableLaw: input.applicableLaw,
    status: 'draft',
    signedDocFileId: null,
    deadlines: input.deadlines ?? [],
    notes: input.notes ?? '',
    createdAt: now,
    updatedAt: now,
  }
  contracts.push(contract)
  notifyPlatformDataChange()
  return contract
}

export function updateContract(id: string, updates: Partial<Omit<Contract, 'id' | 'createdAt'>>): Contract | null {
  const idx = contracts.findIndex((c) => c.id === id)
  if (idx === -1) return null
  contracts[idx] = {
    ...contracts[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  notifyPlatformDataChange()
  return contracts[idx]
}
