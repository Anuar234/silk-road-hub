import { promises as fs } from 'node:fs'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import type { NextApiRequest, NextApiResponse } from 'next'

type StoredFileRecord = {
  id: string
  originalName: string
  mime: string
  size: number
  ext: string
  storagePath: string
  uploadedBy: string
  uploadedAt: string
}

const ROOT = process.cwd()
const STORAGE_DIR = path.join(ROOT, 'storage')
const UPLOAD_DIR = path.join(STORAGE_DIR, 'uploads')
const INDEX_FILE = path.join(STORAGE_DIR, 'file-index.json')

const records = new Map<string, StoredFileRecord>()
let initialized = false

async function ensureInitialized() {
  if (initialized) return
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  try {
    const raw = await fs.readFile(INDEX_FILE, 'utf8')
    const parsed = JSON.parse(raw) as StoredFileRecord[]
    parsed.forEach((record) => records.set(record.id, record))
  } catch {
    // No index yet.
  }
  initialized = true
}

async function persistIndex() {
  await fs.mkdir(STORAGE_DIR, { recursive: true })
  const payload = JSON.stringify([...records.values()], null, 2)
  await fs.writeFile(INDEX_FILE, payload, 'utf8')
}

function normalizeExt(filename: string): string {
  const ext = path.extname(filename).toLowerCase().replace('.', '')
  return ext || 'bin'
}

export async function createStoredFile(args: {
  tempPath: string
  originalName: string
  mime: string
  size: number
  uploadedBy: string
}): Promise<StoredFileRecord> {
  await ensureInitialized()
  const id = randomBytes(16).toString('hex')
  const ext = normalizeExt(args.originalName)
  const safeName = `${id}.${ext}`
  const destinationPath = path.join(UPLOAD_DIR, safeName)
  await fs.rename(args.tempPath, destinationPath)
  const record: StoredFileRecord = {
    id,
    originalName: args.originalName,
    mime: args.mime,
    size: args.size,
    ext,
    storagePath: destinationPath,
    uploadedBy: args.uploadedBy,
    uploadedAt: new Date().toISOString(),
  }
  records.set(id, record)
  await persistIndex()
  return record
}

export async function getStoredFile(id: string): Promise<StoredFileRecord | null> {
  await ensureInitialized()
  return records.get(id) ?? null
}

export default function notAnApiRoute(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Allow', '')
  return res.status(404).json({ error: 'NOT_FOUND' })
}
