import { promises as fs } from 'node:fs'
import type { NextApiRequest, NextApiResponse } from 'next'
import formidable, { type File } from 'formidable'
import { fileTypeFromBuffer } from 'file-type'
import { assertCsrf, requireSession } from '../_lib/authServer'
import { createStoredFile } from '../_lib/fileStore'

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set(['pdf', 'png', 'jpg', 'jpeg', 'docx'])
const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

export const config = {
  api: {
    bodyParser: false,
  },
}

function getExtension(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop()
  return ext ?? ''
}

async function parseForm(req: NextApiRequest): Promise<{ file: File; fields: formidable.Fields }> {
  const form = formidable({
    multiples: false,
    maxFiles: 1,
    maxFileSize: MAX_UPLOAD_BYTES,
  })

  const { fields, files } = await new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
    form.parse(req, (error: Error | null, parsedFields: formidable.Fields, parsedFiles: formidable.Files) => {
      if (error) {
        reject(error)
        return
      }
      resolve({ fields: parsedFields, files: parsedFiles })
    })
  })

  const raw = files.file
  const file = Array.isArray(raw) ? raw[0] : raw
  if (!file) {
    throw new Error('FILE_REQUIRED')
  }
  return { file, fields }
}

async function isMimeAndMagicAllowed(file: File): Promise<{ ok: boolean; mime: string }> {
  const sourceMime = file.mimetype ?? 'application/octet-stream'
  const extension = getExtension(file.originalFilename ?? '')
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return { ok: false, mime: sourceMime }
  }
  const buffer = await fs.readFile(file.filepath)
  const slice = buffer.subarray(0, 4100)
  const detected = await fileTypeFromBuffer(slice)
  const detectedMime = detected?.mime ?? sourceMime
  if (!ALLOWED_MIME.has(detectedMime)) {
    // DOCX is ZIP-based; if detector is uncertain, allow by declared docx mime.
    if (!(extension === 'docx' && sourceMime.includes('officedocument'))) {
      return { ok: false, mime: detectedMime }
    }
  }
  return { ok: true, mime: detectedMime }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
  }

  const session = requireSession(req, res)
  if (!session) return

  if (!assertCsrf(req)) {
    return res.status(403).json({ error: 'CSRF_INVALID' })
  }

  try {
    const { file } = await parseForm(req)
    if (file.size > MAX_UPLOAD_BYTES) {
      return res.status(413).json({ error: 'FILE_TOO_LARGE', maxBytes: MAX_UPLOAD_BYTES })
    }

    const validation = await isMimeAndMagicAllowed(file)
    if (!validation.ok) {
      await fs.unlink(file.filepath).catch(() => undefined)
      return res.status(415).json({ error: 'UNSUPPORTED_FILE_TYPE' })
    }

    const record = await createStoredFile({
      tempPath: file.filepath,
      originalName: file.originalFilename ?? 'document',
      mime: validation.mime,
      size: file.size,
      uploadedBy: session.user.id,
    })

    return res.status(201).json({
      fileId: record.id,
      filename: record.originalName,
      size: record.size,
      mime: record.mime,
      downloadUrl: `/api/files/${record.id}`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UPLOAD_FAILED'
    if (message.includes('maxFileSize')) {
      return res.status(413).json({ error: 'FILE_TOO_LARGE', maxBytes: MAX_UPLOAD_BYTES })
    }
    if (message === 'FILE_REQUIRED') {
      return res.status(400).json({ error: 'FILE_REQUIRED' })
    }
    return res.status(500).json({ error: 'UPLOAD_FAILED' })
  }
}
