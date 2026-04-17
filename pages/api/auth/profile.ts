import type { NextApiRequest, NextApiResponse } from 'next'
import { assertCsrf, requireSession, getUserPayload, updateUserProfile } from '../_lib/authServer'
import type { ProfileUpdates } from '../_lib/authServer'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', 'PUT')
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
  }

  const session = requireSession(req, res)
  if (!session) return

  if (!assertCsrf(req)) {
    return res.status(403).json({ error: 'CSRF_INVALID' })
  }

  const body = (req.body ?? {}) as ProfileUpdates

  const updated = updateUserProfile(session.user.id, body)
  if (!updated) {
    return res.status(400).json({ error: 'PROFILE_UPDATE_FAILED', message: 'Профиль демо-пользователя нельзя изменить.' })
  }

  // Update session in-place so subsequent requests see updated data
  session.user = updated

  return res.status(200).json({ ok: true, data: getUserPayload(session) })
}
