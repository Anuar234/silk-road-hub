import { spawn } from 'node:child_process'
import net from 'node:net'

function runBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn('npm run build', {
      shell: true,
      stdio: 'inherit',
    })

    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`Build failed with exit code ${code ?? 'unknown'}`))
    })
  })
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once('error', () => resolve(false))
    server.listen(port, '127.0.0.1', () => {
      server.close(() => resolve(true))
    })
  })
}

async function findFreePort(start = 4173, attempts = 20) {
  for (let index = 0; index < attempts; index += 1) {
    const port = start + index
    const free = await isPortFree(port)
    if (free) return port
  }
  throw new Error('No free port available for demo launcher.')
}

function openBrowser(url) {
  if (process.platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', url], {
      detached: true,
      stdio: 'ignore',
    }).unref()
    return
  }

  if (process.platform === 'darwin') {
    spawn('open', [url], { detached: true, stdio: 'ignore' }).unref()
    return
  }

  spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref()
}

function startServerAndOpenBrowser(port) {
  const server = spawn(`npm run start -- --hostname 127.0.0.1 --port ${port}`, {
    shell: true,
    stdio: ['inherit', 'pipe', 'pipe'],
  })

  let opened = false

  server.stdout.on('data', (chunk) => {
    const text = chunk.toString()
    process.stdout.write(text)

    if (!opened) {
      if (text.includes('Ready') || text.includes('ready')) {
        opened = true
        const url = `http://127.0.0.1:${port}/#/`
        console.log(`Opening browser: ${url}`)
        openBrowser(url)
      }
    }
  })

  server.stderr.on('data', (chunk) => {
    process.stderr.write(chunk.toString())
  })

  const stop = () => {
    if (!server.killed) {
      server.kill()
    }
  }

  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)

  server.on('exit', (code) => {
    process.exit(code ?? 0)
  })
}

async function main() {
  try {
    await runBuild()
    const port = await findFreePort()
    startServerAndOpenBrowser(port)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
