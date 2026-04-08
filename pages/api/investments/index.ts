import type { NextApiRequest, NextApiResponse } from 'next'
import { assertCsrf, requireSession } from '../_lib/authServer'
import { investmentProjects, addInvestmentProject } from '../../../src/data/investmentData'
import type { InvestmentProject } from '../../../src/data/investmentData'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return handleGet(req, res)
  if (req.method === 'POST') return handlePost(req, res)
  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
}

function handleGet(_req: NextApiRequest, res: NextApiResponse) {
  // Public endpoint — investment catalog is visible to everyone
  return res.status(200).json({ ok: true, data: investmentProjects })
}

function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const session = requireSession(req, res, ['seller', 'admin'])
  if (!session) return

  if (!assertCsrf(req)) {
    return res.status(403).json({ error: 'CSRF_INVALID' })
  }

  const body = (req.body ?? {}) as Partial<InvestmentProject>

  if (!body.title?.trim()) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Название проекта обязательно.' })
  }
  if (!body.sector) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Отрасль обязательна.' })
  }
  if (!body.regionCode) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Регион обязателен.' })
  }

  const project = addInvestmentProject({
    title: body.title.trim(),
    description: body.description?.trim() ?? '',
    sector: body.sector,
    regionCode: body.regionCode,
    volumeUsd: body.volumeUsd ?? 0,
    stage: body.stage ?? 'concept',
    source: body.source ?? 'private',
    initiator: body.initiator?.trim() ?? session.user.displayName,
    contactEmail: body.contactEmail?.trim() ?? session.user.email,
    documentIds: body.documentIds ?? [],
    tags: body.tags ?? [],
  })

  return res.status(201).json({ ok: true, data: project })
}
