import type { NextApiRequest, NextApiResponse } from 'next'
import { assertCsrf, requireSession } from '../_lib/authServer'
import { getAllContracts, getContractsByDeal, createContract } from '@features/contracts/contractData'
import type { ContractTemplateType, ApplicableLaw, ContractDeadline } from '@features/contracts/contractData'

type CreateContractBody = {
  dealId?: string
  templateType?: ContractTemplateType
  applicableLaw?: ApplicableLaw
  deadlines?: ContractDeadline[]
  notes?: string
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return handleGet(req, res)
  if (req.method === 'POST') return handlePost(req, res)
  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
}

function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const session = requireSession(req, res)
  if (!session) return

  const dealId = req.query.dealId as string | undefined
  const data = dealId ? getContractsByDeal(dealId) : getAllContracts()
  return res.status(200).json({ ok: true, data })
}

function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const session = requireSession(req, res, ['seller', 'buyer', 'admin'])
  if (!session) return

  if (!assertCsrf(req)) {
    return res.status(403).json({ error: 'CSRF_INVALID' })
  }

  const body = (req.body ?? {}) as CreateContractBody

  if (!body.dealId) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'dealId обязателен.' })
  }
  if (!body.templateType || !['export', 'investment', 'framework'].includes(body.templateType)) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Тип шаблона обязателен (export, investment, framework).' })
  }
  if (!body.applicableLaw || !['KZ', 'EN', 'UNCITRAL', 'ICC'].includes(body.applicableLaw)) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Применимое право обязательно.' })
  }

  const contract = createContract({
    dealId: body.dealId,
    templateType: body.templateType,
    applicableLaw: body.applicableLaw,
    deadlines: body.deadlines,
    notes: body.notes,
  })

  return res.status(201).json({ ok: true, data: contract })
}
