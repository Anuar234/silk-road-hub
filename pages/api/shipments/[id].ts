import type { NextApiRequest, NextApiResponse } from 'next'
import { assertCsrf, requireSession } from '../_lib/authServer'
import { getShipmentById, updateShipmentStage, addShipmentDocument } from '@features/logistics/logisticsData'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string

  if (req.method === 'GET') return handleGet(req, res, id)
  if (req.method === 'PUT') return handlePut(req, res, id)

  res.setHeader('Allow', 'GET, PUT')
  return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
}

function handleGet(req: NextApiRequest, res: NextApiResponse, id: string) {
  const session = requireSession(req, res)
  if (!session) return

  const shipment = getShipmentById(id)
  if (!shipment) {
    return res.status(404).json({ error: 'NOT_FOUND' })
  }
  return res.status(200).json({ ok: true, data: shipment })
}

function handlePut(req: NextApiRequest, res: NextApiResponse, id: string) {
  const session = requireSession(req, res)
  if (!session) return

  if (!assertCsrf(req)) {
    return res.status(403).json({ error: 'CSRF_INVALID' })
  }

  const body = (req.body ?? {}) as {
    stageId?: string
    stageStatus?: string
    stageLocation?: string
    stageDate?: string
    stageNotes?: string
    addDocumentFileId?: string
  }

  // Add document to shipment
  if (body.addDocumentFileId) {
    const ok = addShipmentDocument(id, body.addDocumentFileId)
    if (!ok) return res.status(404).json({ error: 'NOT_FOUND' })
    const shipment = getShipmentById(id)
    return res.status(200).json({ ok: true, data: shipment })
  }

  // Update a stage
  if (body.stageId) {
    const updated = updateShipmentStage(id, body.stageId, {
      status: body.stageStatus as 'pending' | 'in_progress' | 'completed' | undefined,
      location: body.stageLocation,
      date: body.stageDate,
      notes: body.stageNotes,
    })
    if (!updated) return res.status(404).json({ error: 'NOT_FOUND' })
    return res.status(200).json({ ok: true, data: updated })
  }

  return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Укажите stageId или addDocumentFileId.' })
}
