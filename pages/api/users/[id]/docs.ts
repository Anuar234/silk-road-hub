import type { NextApiRequest, NextApiResponse } from 'next'
import { assertCsrf, requireSession, addUserCompanyDoc, getUserById } from '../../_lib/authServer'

type DocsPayload = {
  fileId?: string
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
  }

  const session = requireSession(req, res)
  if (!session) return

  if (!assertCsrf(req)) {
    return res.status(403).json({ error: 'CSRF_INVALID' })
  }

  const userId = req.query.id as string

  // Users can only add docs to their own profile, admins can do it for anyone
  if (session.user.id !== userId && session.user.role !== 'admin') {
    return res.status(403).json({ error: 'FORBIDDEN' })
  }

  const body = (req.body ?? {}) as DocsPayload
  if (!body.fileId) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'fileId обязателен.' })
  }

  const ok = addUserCompanyDoc(userId, body.fileId)
  if (!ok) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Пользователь не найден.' })
  }

  const user = getUserById(userId)
  return res.status(200).json({ ok: true, data: user })
}
