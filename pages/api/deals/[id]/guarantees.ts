import type { NextApiRequest, NextApiResponse } from 'next'
import { assertCsrf, requireSession } from '../../_lib/authServer'
import { getDealGuarantees, setDealGuarantee } from '@features/deals/dealData'
import type { GuaranteeType } from '@features/deals/dealData'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const dealId = req.query.id as string

  if (req.method === 'GET') return handleGet(req, res, dealId)
  if (req.method === 'PUT') return handlePut(req, res, dealId)

  res.setHeader('Allow', 'GET, PUT')
  return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
}

function handleGet(req: NextApiRequest, res: NextApiResponse, dealId: string) {
  const session = requireSession(req, res)
  if (!session) return

  const guarantees = getDealGuarantees(dealId)
  return res.status(200).json({ ok: true, data: guarantees })
}

function handlePut(req: NextApiRequest, res: NextApiResponse, dealId: string) {
  const session = requireSession(req, res)
  if (!session) return

  if (!assertCsrf(req)) {
    return res.status(403).json({ error: 'CSRF_INVALID' })
  }

  const body = (req.body ?? {}) as { type?: GuaranteeType; enabled?: boolean; notes?: string }

  if (!body.type || !['export_credit', 'insurance', 'letter_of_credit', 'bank_guarantee'].includes(body.type)) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Тип гарантии обязателен.' })
  }

  const guarantees = setDealGuarantee(dealId, body.type, body.enabled ?? false, body.notes)
  return res.status(200).json({ ok: true, data: guarantees })
}
