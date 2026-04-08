import type { NextApiRequest, NextApiResponse } from 'next'
import { assertCsrf, clearSession } from '../_lib/authServer'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
  }

  if (!assertCsrf(req)) {
    return res.status(403).json({ error: 'CSRF_INVALID' })
  }

  clearSession(res, req)
  return res.status(204).end()
}
