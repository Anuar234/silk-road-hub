import type { NextApiRequest, NextApiResponse } from 'next'
import { assertCsrf, registerUser, createSession, getUserPayload } from '../_lib/authServer'
import { checkRateLimit } from '../_lib/rateLimit'

type RegisterPayload = {
  email?: string
  password?: string
  displayName?: string
  role?: 'buyer' | 'seller'
  phone?: string
  companyName?: string
  bin?: string
  position?: string
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
  }

  if (!checkRateLimit(req, res, { prefix: 'register', maxRequests: 5, windowMs: 60_000 })) return

  if (!assertCsrf(req)) {
    return res.status(403).json({ error: 'CSRF_INVALID' })
  }

  const body = (req.body ?? {}) as RegisterPayload
  const email = body.email?.trim()
  const password = body.password
  const displayName = body.displayName?.trim()
  const role = body.role

  if (!email || !password || !displayName || !role) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Email, пароль, имя и роль обязательны.' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Пароль должен содержать минимум 6 символов.' })
  }

  if (!['buyer', 'seller'].includes(role)) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Роль должна быть buyer или seller.' })
  }

  const result = registerUser({
    email,
    password,
    displayName,
    role,
    phone: body.phone,
    companyName: body.companyName,
    bin: body.bin,
    position: body.position,
  })

  if ('error' in result) {
    return res.status(409).json({ error: result.error, message: 'Пользователь с таким email уже существует.' })
  }

  const session = createSession(res, result)
  return res.status(201).json({ ok: true, data: getUserPayload(session) })
}
