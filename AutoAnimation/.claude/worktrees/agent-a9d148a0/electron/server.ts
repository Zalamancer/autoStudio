import { fork, type ChildProcess } from 'child_process'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import net from 'net'

let serverProcess: ChildProcess | null = null
let serverPort: number | null = null
let hasRestarted = false

// ---------------------------------------------------------------------------
// Port helpers
// ---------------------------------------------------------------------------

function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = net.createServer()
    tester.once('error', () => resolve(false))
    tester.once('listening', () => {
      tester.close(() => resolve(true))
    })
    tester.listen(port)
  })
}

async function findFreePort(startPort: number): Promise<number> {
  let port = startPort
  while (!(await isPortFree(port))) {
    port++
  }
  return port
}

// ---------------------------------------------------------------------------
// Health polling
// ---------------------------------------------------------------------------

async function waitForServer(port: number, maxAttempts = 30): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`http://localhost:${port}/api/health`)
      if (res.ok) return
    } catch {
      // Server not ready yet -- retry
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`Server failed to become ready after ${maxAttempts} attempts`)
}

// ---------------------------------------------------------------------------
// Spawn
// ---------------------------------------------------------------------------

function spawnServer(serverPath: string, port: number): ChildProcess {
  const serverDir = path.dirname(serverPath)
  const child = fork(serverPath, [], {
    execArgv: ['--import', 'tsx'],
    cwd: serverDir,
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: app.isPackaged ? 'production' : 'development',
    },
    stdio: 'pipe',
  })

  child.stdout?.on('data', (data: Buffer) => {
    console.log(`[server stdout] ${data.toString().trimEnd()}`)
  })

  child.stderr?.on('data', (data: Buffer) => {
    console.error(`[server stderr] ${data.toString().trimEnd()}`)
  })

  child.on('error', (err) => {
    console.error('[server] process error:', err)
  })

  child.on('exit', (code, signal) => {
    console.warn(`[server] exited with code=${code} signal=${signal}`)

    // Attempt a single automatic restart on unexpected crash
    if (code !== 0 && code !== null && !hasRestarted) {
      hasRestarted = true
      console.log('[server] attempting automatic restart...')
      startServer()
        .then((p) => console.log(`[server] restarted on port ${p}`))
        .catch((err) => console.error('[server] restart failed:', err))
    }
  })

  return child
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function readServerEnvPort(serverDir: string): number {
  try {
    const envPath = path.join(serverDir, '.env')
    const envContent = fs.readFileSync(envPath, 'utf-8')
    const match = envContent.match(/^PORT=(\d+)/m)
    if (match) return parseInt(match[1], 10)
  } catch {
    // .env not found or unreadable
  }
  return 3001
}

export async function startServer(): Promise<number> {
  const serverPath = app.isPackaged
    ? path.join(process.resourcesPath, 'server/index.ts')
    : path.join(__dirname, '../server/index.ts')

  const serverDir = path.dirname(serverPath)
  // Server's dotenv uses override:true, so read its .env to know the actual port
  const port = readServerEnvPort(serverDir)

  serverProcess = spawnServer(serverPath, port)
  serverPort = port

  await waitForServer(port)
  console.log(`[server] ready on port ${port}`)

  return port
}

export async function stopServer(): Promise<void> {
  if (!serverProcess) return

  const proc = serverProcess
  serverProcess = null
  serverPort = null

  // Remove all listeners so the auto-restart handler doesn't fire
  proc.removeAllListeners('exit')
  proc.stdout?.removeAllListeners('data')
  proc.stderr?.removeAllListeners('data')
  proc.removeAllListeners('error')

  return new Promise<void>((resolve) => {
    const killTimeout = setTimeout(() => {
      console.warn('[server] SIGTERM timed out, sending SIGKILL')
      proc.kill('SIGKILL')
      resolve()
    }, 5000)

    proc.once('exit', () => {
      clearTimeout(killTimeout)
      resolve()
    })

    proc.kill('SIGTERM')
  })
}

export function getServerPort(): number | null {
  return serverPort
}
