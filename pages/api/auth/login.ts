import type { NextApiRequest, NextApiResponse } from 'next'
import { assertCsrf, authenticateCredentials, createSession, getUserPayload, isDemoAuthEnabled } from '../_lib/authServer'
import { checkRateLimit } from '../_lib/rateLimit'

type LoginPayload = {
  email?: string
  password?: string
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
  }

  if (!checkRateLimit(req, res, { prefix: 'login', maxRequests: 10, windowMs: 60_000 })) return

  if (!assertCsrf(req)) {
    return res.status(403).json({ error: 'CSRF_INVALID' })
  }

  const body = (req.body ?? {}) as LoginPayload
  const email = body.email?.trim()
  const password = body.password
  if (!email || !password) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Email and password are required.' })
  }

  const user = authenticateCredentials(email, password)
  if (!user) {
    const message = isDemoAuthEnabled()
      ? 'Неверный логин или пароль'
      : 'Демо-вход отключен, настройте серверную базу пользователей.'
    return res.status(401).json({ error: 'INVALID_CREDENTIALS', message })
  }

  const session = createSession(res, user)
  return res.status(200).json({ user: getUserPayload(session) })
}
