import type { NextApiRequest, NextApiResponse } from 'next'
import { assertCsrf, requireSession } from '../_lib/authServer'
import { getInvestmentById, updateInvestmentProject } from '../../../src/data/investmentData'
import type { InvestmentProject } from '../../../src/data/investmentData'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string

  if (req.method === 'GET') return handleGet(res, id)
  if (req.method === 'PUT') return handlePut(req, res, id)

  res.setHeader('Allow', 'GET, PUT')
  return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
}

function handleGet(res: NextApiResponse, id: string) {
  const project = getInvestmentById(id)
  if (!project) {
    return res.status(404).json({ error: 'NOT_FOUND' })
  }
  return res.status(200).json({ ok: true, data: project })
}

function handlePut(req: NextApiRequest, res: NextApiResponse, id: string) {
  const session = requireSession(req, res, ['admin'])
  if (!session) return

  if (!assertCsrf(req)) {
    return res.status(403).json({ error: 'CSRF_INVALID' })
  }

  const body = (req.body ?? {}) as Partial<InvestmentProject>
  const updated = updateInvestmentProject(id, body)

  if (!updated) {
    return res.status(404).json({ error: 'NOT_FOUND' })
  }

  return res.status(200).json({ ok: true, data: updated })
}
