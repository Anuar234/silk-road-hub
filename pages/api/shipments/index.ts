import type { NextApiRequest, NextApiResponse } from 'next'
import { assertCsrf, requireSession } from '../_lib/authServer'
import { getAllShipments, getShipmentsByDeal, createShipment } from '../../../src/data/logisticsData'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return handleGet(req, res)
  if (req.method === 'POST') return handlePost(req, res)
  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
}

function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const session = requireSession(req, res)
  if (!session) return

  const dealId = req.query.dealId as string | undefined
  const data = dealId ? getShipmentsByDeal(dealId) : getAllShipments()
  return res.status(200).json({ ok: true, data })
}

function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const session = requireSession(req, res)
  if (!session) return

  if (!assertCsrf(req)) {
    return res.status(403).json({ error: 'CSRF_INVALID' })
  }

  const body = (req.body ?? {}) as { dealId?: string; routeTemplateId?: string; origin?: string; destination?: string }

  if (!body.dealId) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'dealId обязателен.' })
  }

  const shipment = createShipment({
    dealId: body.dealId,
    routeTemplateId: body.routeTemplateId,
    origin: body.origin,
    destination: body.destination,
  })

  return res.status(201).json({ ok: true, data: shipment })
}
