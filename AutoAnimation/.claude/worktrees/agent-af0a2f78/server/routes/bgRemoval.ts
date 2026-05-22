/**
 * Background removal route — proxies to a self-hosted rembg Python server.
 *
 * The Express server spawns `python3 rembg_server.py` as a child process on startup.
 * If Python or rembg isn't installed, the server logs a warning and the frontend
 * falls back to local ONNX mode. No crash.
 *
 * Endpoints:
 *   POST /       — Proxy base64 image to rembg for HD background removal
 *   GET  /status — Check if rembg server is alive and healthy
 */
import { Router, type Request, type Response } from 'express'
import { spawn, type ChildProcess } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const router = Router()

const REMBG_PORT = 7100
const REMBG_URL = `http://127.0.0.1:${REMBG_PORT}`

let rembgProcess: ChildProcess | null = null
let rembgHealthy = false

// ── Child process management ──

/**
 * Spawn the rembg Flask server as a detached child process.
 * Polls /health until the server is ready (up to 30 seconds).
 */
export async function startRembgServer(): Promise<void> {
  const __dir = path.dirname(fileURLToPath(import.meta.url))
  const scriptPath = path.resolve(__dir, '..', 'python', 'rembg_server.py')

  try {
    rembgProcess = spawn('python3', [scriptPath, String(REMBG_PORT)], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    })

    rembgProcess.stdout?.on('data', (chunk: Buffer) => {
      const line = chunk.toString().trim()
      if (line) console.log(`[rembg] ${line}`)
    })

    rembgProcess.stderr?.on('data', (chunk: Buffer) => {
      const line = chunk.toString().trim()
      // Flask prints its startup banner to stderr — not an error
      if (line) console.log(`[rembg] ${line}`)
    })

    rembgProcess.on('error', (err) => {
      console.warn(`⚠️  rembg process error: ${err.message}`)
      rembgHealthy = false
      rembgProcess = null
    })

    rembgProcess.on('exit', (code) => {
      console.warn(`⚠️  rembg process exited with code ${code}`)
      rembgHealthy = false
      rembgProcess = null
    })

    // Poll for readiness (every 2s, up to 30s)
    const maxAttempts = 15
    for (let i = 0; i < maxAttempts; i++) {
      await sleep(2000)
      try {
        const res = await fetch(`${REMBG_URL}/health`)
        if (res.ok) {
          rembgHealthy = true
          console.log(`   rembg: ready on port ${REMBG_PORT}`)
          return
        }
      } catch {
        // Not ready yet
      }
    }

    console.warn('⚠️  rembg server did not become healthy within 30s')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`⚠️  Failed to start rembg server: ${msg}`)
    console.warn('   HD background removal will fall back to local ONNX mode.')
    rembgProcess = null
    rembgHealthy = false
  }
}

export function isRembgConfigured(): boolean {
  return rembgHealthy
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// Clean up on process exit
process.on('exit', () => {
  if (rembgProcess && !rembgProcess.killed) {
    rembgProcess.kill()
  }
})

// ── Routes ──

// GET /status — Check if the rembg server is alive
router.get('/status', (_req: Request, res: Response) => {
  res.json({ configured: rembgHealthy })
})

// POST / — Remove background via rembg server
router.post('/', async (req: Request, res: Response) => {
  try {
    const { imageBase64 } = req.body

    if (!imageBase64) {
      res.status(400).json({ error: 'Missing required field: imageBase64' })
      return
    }

    if (!rembgHealthy) {
      res.status(503).json({ error: 'rembg server is not available' })
      return
    }

    console.log('[BgRemoval] Sending image to rembg server...')

    // Strip data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')

    const rembgRes = await fetch(`${REMBG_URL}/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Data }),
    })

    if (!rembgRes.ok) {
      const errorData = await rembgRes.json().catch(() => ({ error: 'rembg request failed' }))
      console.error('[BgRemoval] rembg error:', errorData)
      res.status(rembgRes.status).json({ error: errorData.error || 'rembg error' })
      return
    }

    const resultData = await rembgRes.json()

    console.log('[BgRemoval] Background removed successfully via rembg')

    res.json({
      image: resultData.image,
      mimeType: 'image/png',
    })
  } catch (error) {
    console.error('[BgRemoval] Error:', error)
    res.status(500).json({
      error: 'Background removal failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export default router
