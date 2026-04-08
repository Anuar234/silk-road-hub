import type { NextApiRequest, NextApiResponse } from 'next'
import { assertCsrf, requireSession } from '../_lib/authServer'
import { createProduct, getAllProducts, getProductsBySeller } from '../_lib/productStore'
import type { CreateProductInput } from '../_lib/productStore'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res)
  }
  if (req.method === 'POST') {
    return handlePost(req, res)
  }
  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
}

function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const session = requireSession(req, res)
  if (!session) return

  const { role } = session.user
  const statusFilter = req.query.status as string | undefined

  // Admin sees all products; sellers see only their own
  if (role === 'admin') {
    const products = statusFilter ? getAllProducts(statusFilter as 'draft' | 'moderation' | 'published' | 'rejected') : getAllProducts()
    return res.status(200).json({ ok: true, data: products })
  }

  if (role === 'seller') {
    const products = getProductsBySeller(session.user.id)
    return res.status(200).json({ ok: true, data: products })
  }

  // Buyers see only published
  const products = getAllProducts('published')
  return res.status(200).json({ ok: true, data: products })
}

function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const session = requireSession(req, res, ['seller'])
  if (!session) return

  if (!assertCsrf(req)) {
    return res.status(403).json({ error: 'CSRF_INVALID' })
  }

  const body = (req.body ?? {}) as CreateProductInput

  if (!body.name?.trim()) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Название товара обязательно.' })
  }
  if (!body.sectorId) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Сектор обязателен.' })
  }
  if (!body.subcategoryId) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Подкатегория обязательна.' })
  }

  const product = createProduct(session.user.id, body)
  return res.status(201).json({ ok: true, data: product })
}
