import type { NextApiRequest, NextApiResponse } from 'next'
import { requireSession, getAllUsers } from '../_lib/authServer'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
  }

  const session = requireSession(req, res, ['admin'])
  if (!session) return

  const users = getAllUsers()
  return res.status(200).json({ ok: true, data: users })
}
