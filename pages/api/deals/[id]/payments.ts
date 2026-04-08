import type { NextApiRequest, NextApiResponse } from 'next'
import { assertCsrf, requireSession } from '../../_lib/authServer'
import { getPaymentPlan, createPaymentPlan, updatePaymentStage, DEFAULT_PAYMENT_STAGES } from '../../../../src/data/dealData'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const dealId = req.query.id as string

  if (req.method === 'GET') return handleGet(req, res, dealId)
  if (req.method === 'POST') return handlePost(req, res, dealId)
  if (req.method === 'PUT') return handlePut(req, res, dealId)

  res.setHeader('Allow', 'GET, POST, PUT')
  return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
}

function handleGet(req: NextApiRequest, res: NextApiResponse, dealId: string) {
  const session = requireSession(req, res)
  if (!session) return

  const plan = getPaymentPlan(dealId)
  return res.status(200).json({ ok: true, data: plan })
}

function handlePost(req: NextApiRequest, res: NextApiResponse, dealId: string) {
  const session = requireSession(req, res)
  if (!session) return

  if (!assertCsrf(req)) {
    return res.status(403).json({ error: 'CSRF_INVALID' })
  }

  const body = (req.body ?? {}) as { totalUsd?: number; stages?: { label: string; percentage: number }[] }

  if (!body.totalUsd || body.totalUsd <= 0) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'totalUsd обязателен и должен быть > 0.' })
  }

  const stages = body.stages ?? DEFAULT_PAYMENT_STAGES
  const plan = createPaymentPlan(dealId, body.totalUsd, stages)
  return res.status(201).json({ ok: true, data: plan })
}

function handlePut(req: NextApiRequest, res: NextApiResponse, dealId: string) {
  const session = requireSession(req, res)
  if (!session) return

  if (!assertCsrf(req)) {
    return res.status(403).json({ error: 'CSRF_INVALID' })
  }

  const body = (req.body ?? {}) as { stageId?: string; status?: string; dueDate?: string; paidAt?: string }

  if (!body.stageId) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'stageId обязателен.' })
  }

  const plan = updatePaymentStage(dealId, body.stageId, {
    status: body.status as 'pending' | 'invoiced' | 'paid' | 'confirmed' | undefined,
    dueDate: body.dueDate,
    paidAt: body.paidAt,
  })

  if (!plan) {
    return res.status(404).json({ error: 'NOT_FOUND' })
  }

  return res.status(200).json({ ok: true, data: plan })
}
