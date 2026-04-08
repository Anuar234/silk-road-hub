import http from 'node:http'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const distDir = path.resolve(__dirname, '..', 'out')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
}

function safeJoin(root, targetPath) {
  const safePath = path.normalize(targetPath).replace(/^([/\\])+/, '')
  const joined = path.resolve(root, safePath)
  if (!joined.startsWith(root)) return null
  return joined
}

async function fileExists(p) {
  try {
    const st = await fs.stat(p)
    return st.isFile()
  } catch {
    return false
  }
}

async function serveFile(res, absPath) {
  const ext = path.extname(absPath).toLowerCase()
  const mime = MIME[ext] ?? 'application/octet-stream'

  const buf = await fs.readFile(absPath)
  res.statusCode = 200
  res.setHeader('Content-Type', mime)

  // Minimal caching for static assets
  if (absPath.includes(`${path.sep}assets${path.sep}`)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
  } else {
    res.setHeader('Cache-Control', 'no-cache')
  }

  res.end(buf)
}

async function handler(req, res) {
  try {
    const rawUrl = req.url ?? '/'
    const url = new URL(rawUrl, 'http://localhost')
    const pathname = decodeURIComponent(url.pathname)

    // Root -> index.html
    if (pathname === '/' || pathname === '') {
      const indexPath = path.join(distDir, 'index.html')
      return await serveFile(res, indexPath)
    }

    const maybePath = safeJoin(distDir, pathname)
    if (maybePath && (await fileExists(maybePath))) {
      return await serveFile(res, maybePath)
    }

    // SPA fallback
    const indexPath = path.join(distDir, 'index.html')
    return await serveFile(res, indexPath)
  } catch (e) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end(`Offline server error: ${e?.message ?? String(e)}`)
  }
}

async function start() {
  const requested = Number(process.env.PORT ?? 4173)
  const host = process.env.HOST ?? '127.0.0.1'

  if (!(await fileExists(path.join(distDir, 'index.html')))) {
    console.error(`out/index.html not found. Run: npm run build`)
    process.exit(1)
  }

  for (let port = requested; port < requested + 20; port++) {
    const server = http.createServer(handler)
    const ok = await new Promise((resolve) => {
      server.once('error', () => resolve(false))
      server.listen(port, host, () => resolve(true))
    })

    if (ok) {
      console.log(`Silk Road Hub offline: http://${host}:${port}`)
      console.log(`Open: http://${host}:${port}/#/`)
      return
    }
  }

  console.error('No free port found for offline server.')
  process.exit(1)
}

start()

