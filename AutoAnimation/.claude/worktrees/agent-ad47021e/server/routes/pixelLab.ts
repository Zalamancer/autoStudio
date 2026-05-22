/**
 * PixelLab API proxy routes for pixel art generation, animation, and editing.
 *
 * Actual PixelLab REST API v1 endpoints:
 *   POST /generate-image-pixflux  — Generate pixel art from text
 *   POST /generate-image-bitforge — Generate with style transfer
 *   POST /animate-with-text       — Text-driven animation (returns frames)
 *   POST /animate-with-skeleton   — Skeleton-driven animation
 *   POST /rotate                  — Rotate character to different angle
 *   POST /inpaint                 — Edit specific areas
 *   POST /estimate-skeleton       — Extract skeleton keypoints
 *   GET  /balance                 — Check credit balance
 */
import { Router, type Request, type Response } from 'express'

const router = Router()

const PIXELLAB_API_BASE = 'https://api.pixellab.ai/v1'

function getPixelLabKey(): string | null {
  return process.env.PIXELLAB_API_KEY || null
}

function checkKey(res: Response): boolean {
  if (!getPixelLabKey()) {
    res.status(503).json({ error: 'PIXELLAB_API_KEY is not configured' })
    return false
  }
  return true
}

async function pixelLabFetch(path: string, options: RequestInit = {}): Promise<globalThis.Response> {
  const apiKey = getPixelLabKey()
  if (!apiKey) throw new Error('PIXELLAB_API_KEY is not configured')

  return fetch(`${PIXELLAB_API_BASE}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

// ─── Image Generation ───────────────────────────────────────────────────────

// POST /generate-pixflux — Generate pixel art from text
router.post('/generate-pixflux', async (req: Request, res: Response) => {
  try {
    if (!checkKey(res)) return
    console.log(`[PixelLab] generate-image-pixflux: "${req.body.description}"`)

    const plRes = await pixelLabFetch('/generate-image-pixflux', {
      method: 'POST',
      body: JSON.stringify(req.body),
    })

    if (!plRes.ok) {
      const errorText = await plRes.text()
      console.error('[PixelLab] pixflux error:', errorText)
      res.status(plRes.status).json({ error: `PixelLab API error: ${errorText}` })
      return
    }

    const data = await plRes.json()
    res.json(data)
  } catch (error) {
    console.error('[PixelLab] pixflux error:', error)
    res.status(500).json({
      error: 'Failed to generate image',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// POST /generate-bitforge — Generate with style transfer
router.post('/generate-bitforge', async (req: Request, res: Response) => {
  try {
    if (!checkKey(res)) return
    console.log(`[PixelLab] generate-image-bitforge: "${req.body.description}"`)

    const plRes = await pixelLabFetch('/generate-image-bitforge', {
      method: 'POST',
      body: JSON.stringify(req.body),
    })

    if (!plRes.ok) {
      const errorText = await plRes.text()
      console.error('[PixelLab] bitforge error:', errorText)
      res.status(plRes.status).json({ error: `PixelLab API error: ${errorText}` })
      return
    }

    const data = await plRes.json()
    res.json(data)
  } catch (error) {
    console.error('[PixelLab] bitforge error:', error)
    res.status(500).json({
      error: 'Failed to generate image',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// ─── Animation ──────────────────────────────────────────────────────────────

// POST /animate-text — Animate from text description
router.post('/animate-text', async (req: Request, res: Response) => {
  try {
    if (!checkKey(res)) return
    console.log(`[PixelLab] animate-with-text: "${req.body.action}"`)

    const plRes = await pixelLabFetch('/animate-with-text', {
      method: 'POST',
      body: JSON.stringify(req.body),
    })

    if (!plRes.ok) {
      const errorText = await plRes.text()
      console.error('[PixelLab] animate-text error:', errorText)
      res.status(plRes.status).json({ error: `PixelLab API error: ${errorText}` })
      return
    }

    const data = await plRes.json()
    res.json(data)
  } catch (error) {
    console.error('[PixelLab] animate-text error:', error)
    res.status(500).json({
      error: 'Failed to animate',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// POST /animate-skeleton — Animate with skeleton keypoints
router.post('/animate-skeleton', async (req: Request, res: Response) => {
  try {
    if (!checkKey(res)) return
    console.log('[PixelLab] animate-with-skeleton')

    const plRes = await pixelLabFetch('/animate-with-skeleton', {
      method: 'POST',
      body: JSON.stringify(req.body),
    })

    if (!plRes.ok) {
      const errorText = await plRes.text()
      console.error('[PixelLab] animate-skeleton error:', errorText)
      res.status(plRes.status).json({ error: `PixelLab API error: ${errorText}` })
      return
    }

    const data = await plRes.json()
    res.json(data)
  } catch (error) {
    console.error('[PixelLab] animate-skeleton error:', error)
    res.status(500).json({
      error: 'Failed to animate with skeleton',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// ─── Image Operations ───────────────────────────────────────────────────────

// POST /rotate — Rotate character to a different angle
router.post('/rotate', async (req: Request, res: Response) => {
  try {
    if (!checkKey(res)) return
    console.log('[PixelLab] rotate')

    const plRes = await pixelLabFetch('/rotate', {
      method: 'POST',
      body: JSON.stringify(req.body),
    })

    if (!plRes.ok) {
      const errorText = await plRes.text()
      console.error('[PixelLab] rotate error:', errorText)
      res.status(plRes.status).json({ error: `PixelLab API error: ${errorText}` })
      return
    }

    const data = await plRes.json()
    res.json(data)
  } catch (error) {
    console.error('[PixelLab] rotate error:', error)
    res.status(500).json({
      error: 'Failed to rotate',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// POST /inpaint — Edit specific areas of pixel art
router.post('/inpaint', async (req: Request, res: Response) => {
  try {
    if (!checkKey(res)) return
    console.log('[PixelLab] inpaint')

    const plRes = await pixelLabFetch('/inpaint', {
      method: 'POST',
      body: JSON.stringify(req.body),
    })

    if (!plRes.ok) {
      const errorText = await plRes.text()
      console.error('[PixelLab] inpaint error:', errorText)
      res.status(plRes.status).json({ error: `PixelLab API error: ${errorText}` })
      return
    }

    const data = await plRes.json()
    res.json(data)
  } catch (error) {
    console.error('[PixelLab] inpaint error:', error)
    res.status(500).json({
      error: 'Failed to inpaint',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// POST /estimate-skeleton — Extract skeleton keypoints from image
router.post('/estimate-skeleton', async (req: Request, res: Response) => {
  try {
    if (!checkKey(res)) return
    console.log('[PixelLab] estimate-skeleton')

    const plRes = await pixelLabFetch('/estimate-skeleton', {
      method: 'POST',
      body: JSON.stringify(req.body),
    })

    if (!plRes.ok) {
      const errorText = await plRes.text()
      console.error('[PixelLab] estimate-skeleton error:', errorText)
      res.status(plRes.status).json({ error: `PixelLab API error: ${errorText}` })
      return
    }

    const data = await plRes.json()
    res.json(data)
  } catch (error) {
    console.error('[PixelLab] estimate-skeleton error:', error)
    res.status(500).json({
      error: 'Failed to estimate skeleton',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// ─── Account ────────────────────────────────────────────────────────────────

// GET /balance — Check account credit balance
router.get('/balance', async (_req: Request, res: Response) => {
  try {
    if (!checkKey(res)) return

    const plRes = await pixelLabFetch('/balance')

    if (!plRes.ok) {
      const errorText = await plRes.text()
      res.status(plRes.status).json({ error: `PixelLab API error: ${errorText}` })
      return
    }

    const data = await plRes.json()
    res.json(data)
  } catch (error) {
    console.error('[PixelLab] balance error:', error)
    res.status(500).json({
      error: 'Failed to get balance',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export default router
