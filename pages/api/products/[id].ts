import type { NextApiRequest, NextApiResponse } from 'next'
import { assertCsrf, requireSession } from '../_lib/authServer'
import { getProductById, updateProduct, deleteProduct } from '../_lib/productStore'
import type { UpdateProductInput } from '../_lib/productStore'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string

  if (req.method === 'GET') return handleGet(req, res, id)
  if (req.method === 'PUT') return handlePut(req, res, id)
  if (req.method === 'DELETE') return handleDelete(req, res, id)

  res.setHeader('Allow', 'GET, PUT, DELETE')
  return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
}

function handleGet(req: NextApiRequest, res: NextApiResponse, id: string) {
  const product = getProductById(id)
  if (!product) {
    return res.status(404).json({ error: 'NOT_FOUND' })
  }

  // Published products are visible to everyone; otherwise require auth
  if (product.status !== 'published') {
    const session = requireSession(req, res)
    if (!session) return
    // Only owner or admin can see non-published
    if (session.user.id !== product.sellerId && session.user.role !== 'admin') {
      return res.status(403).json({ error: 'FORBIDDEN' })
    }
  }

  return res.status(200).json({ ok: true, data: product })
}

function handlePut(req: NextApiRequest, res: NextApiResponse, id: string) {
  const session = requireSession(req, res, ['seller', 'admin'])
  if (!session) return

  if (!assertCsrf(req)) {
    return res.status(403).json({ error: 'CSRF_INVALID' })
  }

  const product = getProductById(id)
  if (!product) {
    return res.status(404).json({ error: 'NOT_FOUND' })
  }

  // Sellers can only edit their own products
  if (session.user.role === 'seller' && session.user.id !== product.sellerId) {
    return res.status(403).json({ error: 'FORBIDDEN' })
  }

  const body = (req.body ?? {}) as UpdateProductInput

  // Only admin can change status and moderation comment
  if (session.user.role !== 'admin') {
    delete body.status
    delete body.moderationComment
  }

  const updated = updateProduct(id, body)
  return res.status(200).json({ ok: true, data: updated })
}

function handleDelete(req: NextApiRequest, res: NextApiResponse, id: string) {
  const session = requireSession(req, res, ['seller', 'admin'])
  if (!session) return

  if (!assertCsrf(req)) {
    return res.status(403).json({ error: 'CSRF_INVALID' })
  }

  const product = getProductById(id)
  if (!product) {
    return res.status(404).json({ error: 'NOT_FOUND' })
  }

  if (session.user.role === 'seller' && session.user.id !== product.sellerId) {
    return res.status(403).json({ error: 'FORBIDDEN' })
  }

  deleteProduct(id)
  return res.status(204).end()
}
