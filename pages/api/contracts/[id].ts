import type { NextApiRequest, NextApiResponse } from 'next'
import { assertCsrf, requireSession } from '../_lib/authServer'
import { getContractById, updateContract } from '@features/contracts/contractData'
import type { Contract } from '@features/contracts/contractData'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string

  if (req.method === 'GET') return handleGet(req, res, id)
  if (req.method === 'PUT') return handlePut(req, res, id)

  res.setHeader('Allow', 'GET, PUT')
  return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
}

function handleGet(req: NextApiRequest, res: NextApiResponse, id: string) {
  const session = requireSession(req, res)
  if (!session) return

  const contract = getContractById(id)
  if (!contract) {
    return res.status(404).json({ error: 'NOT_FOUND' })
  }
  return res.status(200).json({ ok: true, data: contract })
}

function handlePut(req: NextApiRequest, res: NextApiResponse, id: string) {
  const session = requireSession(req, res)
  if (!session) return

  if (!assertCsrf(req)) {
    return res.status(403).json({ error: 'CSRF_INVALID' })
  }

  const body = (req.body ?? {}) as Partial<Contract>
  const updated = updateContract(id, body)

  if (!updated) {
    return res.status(404).json({ error: 'NOT_FOUND' })
  }

  return res.status(200).json({ ok: true, data: updated })
}
