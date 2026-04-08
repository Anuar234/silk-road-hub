import { createReadStream } from 'node:fs'
import { promises as fs } from 'node:fs'
import type { NextApiRequest, NextApiResponse } from 'next'
import { requireSession } from '../_lib/authServer'
import { getStoredFile } from '../_lib/fileStore'

function safeFilename(filename: string): string {
  return filename.replace(/[\r\n"]/g, '_')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
  }

  const session = requireSession(req, res)
  if (!session) return

  const id = typeof req.query.id === 'string' ? req.query.id : ''
  if (!id) {
    return res.status(400).json({ error: 'FILE_ID_REQUIRED' })
  }

  const record = await getStoredFile(id)
  if (!record) {
    return res.status(404).json({ error: 'FILE_NOT_FOUND' })
  }

  try {
    const stats = await fs.stat(record.storagePath)
    if (!stats.isFile()) {
      return res.status(404).json({ error: 'FILE_NOT_FOUND' })
    }
  } catch {
    return res.status(404).json({ error: 'FILE_NOT_FOUND' })
  }

  res.statusCode = 200
  res.setHeader('Content-Type', record.mime || 'application/octet-stream')
  res.setHeader('Content-Length', String(record.size))
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename(record.originalName)}"`)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'private, max-age=0, no-store')

  createReadStream(record.storagePath).pipe(res)
}
