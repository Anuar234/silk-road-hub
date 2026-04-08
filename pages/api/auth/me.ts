import type { NextApiRequest, NextApiResponse } from 'next'
import { getSession, getUserPayload } from '../_lib/authServer'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
  }

  const session = getSession(req)
  if (!session) {
    return res.status(401).json({ error: 'UNAUTHORIZED' })
  }

  return res.status(200).json({ user: getUserPayload(session) })
}
