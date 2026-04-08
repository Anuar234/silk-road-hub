import type { NextApiRequest, NextApiResponse } from 'next'
import { assertCsrf, requireSession, updateUserVerification } from '../../_lib/authServer'
import type { VerificationStatus } from '../../_lib/authServer'

type VerifyPayload = {
  status?: VerificationStatus
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', 'PUT')
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
  }

  const session = requireSession(req, res, ['admin'])
  if (!session) return

  if (!assertCsrf(req)) {
    return res.status(403).json({ error: 'CSRF_INVALID' })
  }

  const userId = req.query.id as string
  const body = (req.body ?? {}) as VerifyPayload

  if (!body.status || !['pending', 'verified', 'rejected'].includes(body.status)) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Статус должен быть pending, verified или rejected.' })
  }

  const user = updateUserVerification(userId, body.status)
  if (!user) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Пользователь не найден.' })
  }

  return res.status(200).json({ ok: true, data: user })
}
