/**
 * DeepMotion API proxy routes for cloud-based motion capture.
 * Proxies requests through our Express server to avoid CORS and protect API keys.
 *
 * Endpoints:
 *   POST /process         — Upload video and start motion capture processing
 *   GET  /status/:rid     — Poll processing status
 *   GET  /download/:rid   — Get download URLs for completed job
 */
import { Router, type Request, type Response } from 'express'

const router = Router()

const DM_BASE = 'https://service.deepmotion.com'

/**
 * Authenticate with DeepMotion using HTTP Basic auth.
 * Returns the session cookie string for subsequent requests.
 */
async function authenticate(): Promise<string> {
  const clientId = process.env.DEEPMOTION_CLIENT_ID
  const clientSecret = process.env.DEEPMOTION_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('DEEPMOTION_CLIENT_ID and DEEPMOTION_CLIENT_SECRET must be set')
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const res = await fetch(`${DM_BASE}/session/auth`, {
    method: 'GET',
    headers: { Authorization: `Basic ${credentials}` },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`DeepMotion auth failed (${res.status}): ${text}`)
  }

  // Extract session cookie from set-cookie header
  const setCookie = res.headers.get('set-cookie')
  if (!setCookie) throw new Error('DeepMotion auth returned no session cookie')
  return setCookie
}

// POST /process — Upload video and start motion capture
router.post('/process', async (req: Request, res: Response) => {
  console.log('[DeepMotion] POST /process received')

  try {
    const cookie = await authenticate()
    const videoBuffer = req.body as Buffer

    if (!videoBuffer || videoBuffer.length === 0) {
      return res.status(400).json({ error: 'No video data provided' })
    }

    // Step 1: Get upload URL
    const uploadRes = await fetch(`${DM_BASE}/upload`, {
      method: 'GET',
      headers: { Cookie: cookie },
    })
    if (!uploadRes.ok) {
      const text = await uploadRes.text()
      throw new Error(`Failed to get upload URL (${uploadRes.status}): ${text}`)
    }
    const uploadData = await uploadRes.json() as { url: string; fileId: string }

    // Step 2: PUT video buffer to signed URL
    const putRes = await fetch(uploadData.url, {
      method: 'PUT',
      body: videoBuffer,
      headers: { 'Content-Type': 'video/mp4' },
    })
    if (!putRes.ok) {
      const text = await putRes.text()
      throw new Error(`Failed to upload video (${putRes.status}): ${text}`)
    }

    // Step 3: Start processing
    const processRes = await fetch(`${DM_BASE}/process/${uploadData.fileId}`, {
      method: 'POST',
      headers: {
        Cookie: cookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.query), // pass any processing options as query params
    })
    if (!processRes.ok) {
      const text = await processRes.text()
      throw new Error(`Failed to start processing (${processRes.status}): ${text}`)
    }
    const processData = await processRes.json() as { rid: string }

    console.log(`[DeepMotion] Processing started, rid: ${processData.rid}`)
    res.json({ rid: processData.rid })
  } catch (err) {
    console.error('[DeepMotion] POST /process error:', err)
    res.status(500).json({ error: (err as Error).message })
  }
})

// GET /status/:rid — Poll processing status
router.get('/status/:rid', async (req: Request, res: Response) => {
  try {
    const cookie = await authenticate()
    const { rid } = req.params

    const statusRes = await fetch(`${DM_BASE}/status/${rid}`, {
      method: 'GET',
      headers: { Cookie: cookie },
    })
    if (!statusRes.ok) {
      const text = await statusRes.text()
      throw new Error(`Failed to get status (${statusRes.status}): ${text}`)
    }
    const data = await statusRes.json()
    res.json(data)
  } catch (err) {
    console.error('[DeepMotion] GET /status error:', err)
    res.status(500).json({ error: (err as Error).message })
  }
})

// GET /download/:rid — Get download URLs for completed job
router.get('/download/:rid', async (req: Request, res: Response) => {
  try {
    const cookie = await authenticate()
    const { rid } = req.params

    const downloadRes = await fetch(`${DM_BASE}/download/${rid}`, {
      method: 'GET',
      headers: { Cookie: cookie },
    })
    if (!downloadRes.ok) {
      const text = await downloadRes.text()
      throw new Error(`Failed to get download URLs (${downloadRes.status}): ${text}`)
    }
    const data = await downloadRes.json()
    res.json(data)
  } catch (err) {
    console.error('[DeepMotion] GET /download error:', err)
    res.status(500).json({ error: (err as Error).message })
  }
})

export default router
