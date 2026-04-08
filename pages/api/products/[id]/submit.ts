import type { NextApiRequest, NextApiResponse } from 'next'
import { assertCsrf, requireSession } from '../../_lib/authServer'
import { getProductById, updateProduct } from '../../_lib/productStore'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
  }

  const session = requireSession(req, res, ['seller'])
  if (!session) return

  if (!assertCsrf(req)) {
    return res.status(403).json({ error: 'CSRF_INVALID' })
  }

  const id = req.query.id as string
  const product = getProductById(id)

  if (!product) {
    return res.status(404).json({ error: 'NOT_FOUND' })
  }

  if (session.user.id !== product.sellerId) {
    return res.status(403).json({ error: 'FORBIDDEN' })
  }

  if (product.status !== 'draft' && product.status !== 'rejected') {
    return res.status(400).json({ error: 'INVALID_STATUS', message: 'Отправить на модерацию можно только черновик или отклонённый товар.' })
  }

  const updated = updateProduct(id, { status: 'moderation', moderationComment: null })
  return res.status(200).json({ ok: true, data: updated })
}
