/**
 * Image-to-Video generation route.
 * Proxies requests to Fal.ai's Kling Video API (or compatible image-to-video service).
 * Follows the same async job pattern as aiAnimation.ts.
 */

import { Router, type Request, type Response } from 'express'

const router = Router()

const FAL_API_BASE = 'https://queue.fal.run'
const FAL_MODEL = 'fal-ai/kling-video/v1.6/standard/image-to-video'

function getFalApiKey(): string {
  return process.env.FAL_API_KEY || ''
}

interface I2VJob {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  result?: { video: { url: string } }
  error?: string
  progress?: number
}

// In-memory job cache
const jobCache = new Map<string, I2VJob>()

// Motion type to prompt enhancement mapping
const MOTION_PROMPT_MAP: Record<string, string> = {
  'camera-pan': 'Smooth horizontal camera pan across the scene',
  'camera-zoom': 'Slow cinematic zoom into the center of the scene',
  'subtle-motion': 'Gentle subtle motion with slight element movement',
  'full-animation': 'Full animation with dynamic movement and action',
  'parallax': 'Parallax depth effect with layers moving at different speeds',
  'cinematic': 'Cinematic camera movement with dramatic angles and smooth transitions',
}

// POST /generate — submit image-to-video generation
router.post('/generate', async (req: Request, res: Response) => {
  const apiKey = getFalApiKey()
  if (!apiKey) {
    res.status(503).json({ error: 'FAL_API_KEY is not configured' })
    return
  }

  const {
    imageBase64,
    prompt,
    durationSeconds,
    aspectRatio,
    provider,
    motionType,
  } = req.body

  if (!imageBase64) {
    res.status(400).json({ error: 'imageBase64 is required' })
    return
  }

  try {
    // Convert base64 to data URL if it isn't already
    const imageUrl = imageBase64.startsWith('data:')
      ? imageBase64
      : `data:image/png;base64,${imageBase64}`

    // Build enhanced prompt from motion type + user prompt
    const motionPrompt = motionType ? MOTION_PROMPT_MAP[motionType] || '' : ''
    const finalPrompt = [prompt, motionPrompt].filter(Boolean).join('. ') || 'Gentle natural motion'

    // Select model based on provider (currently only Kling via Fal.ai is implemented)
    const modelPath = provider === 'kling' || provider === 'auto' || !provider
      ? FAL_MODEL
      : FAL_MODEL

    const response = await fetch(`${FAL_API_BASE}/${modelPath}`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageUrl,
        prompt: finalPrompt,
        duration: durationSeconds ? String(durationSeconds) : '5',
        aspect_ratio: aspectRatio || '16:9',
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      res.status(response.status).json({ error: `Fal.ai error: ${errText}` })
      return
    }

    const data = await response.json() as { request_id: string; status?: string }
    const jobId = data.request_id

    jobCache.set(jobId, {
      id: jobId,
      status: 'queued',
    })

    res.status(202).json({ jobId, provider: provider || 'kling' })
  } catch (err) {
    console.error('[ImageToVideo] Generate error:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Generation failed' })
  }
})

// GET /status/:jobId — poll job status
router.get('/status/:jobId', async (req: Request, res: Response) => {
  const apiKey = getFalApiKey()
  if (!apiKey) {
    res.status(503).json({ error: 'FAL_API_KEY is not configured' })
    return
  }

  const { jobId } = req.params

  try {
    const response = await fetch(
      `${FAL_API_BASE}/${FAL_MODEL}/requests/${jobId}/status`,
      {
        headers: { Authorization: `Key ${apiKey}` },
      },
    )

    if (!response.ok) {
      res.status(response.status).json({ error: 'Failed to check status' })
      return
    }

    const data = await response.json() as {
      status: string
      logs?: Array<{ message: string }>
    }

    const cached = jobCache.get(jobId) || { id: jobId, status: 'queued' as const }

    if (data.status === 'COMPLETED') {
      cached.status = 'completed'
    } else if (data.status === 'FAILED') {
      cached.status = 'failed'
      cached.error = data.logs?.[data.logs.length - 1]?.message || 'Generation failed'
    } else if (data.status === 'IN_PROGRESS') {
      cached.status = 'processing'
    }

    jobCache.set(jobId, cached)
    res.json(cached)
  } catch (err) {
    console.error('[ImageToVideo] Status error:', err)
    res.status(500).json({ error: 'Status check failed' })
  }
})

// GET /result/:jobId — get completed result
router.get('/result/:jobId', async (req: Request, res: Response) => {
  const apiKey = getFalApiKey()
  if (!apiKey) {
    res.status(503).json({ error: 'FAL_API_KEY is not configured' })
    return
  }

  const { jobId } = req.params

  try {
    const response = await fetch(
      `${FAL_API_BASE}/${FAL_MODEL}/requests/${jobId}`,
      {
        headers: { Authorization: `Key ${apiKey}` },
      },
    )

    if (!response.ok) {
      res.status(response.status).json({ error: 'Failed to fetch result' })
      return
    }

    const data = await response.json() as { video?: { url: string } }

    if (data.video?.url) {
      const cached = jobCache.get(jobId) || { id: jobId, status: 'completed' as const }
      cached.status = 'completed'
      cached.result = { video: { url: data.video.url } }
      jobCache.set(jobId, cached)
      res.json({ videoUrl: data.video.url })
    } else {
      res.status(404).json({ error: 'Video not ready yet' })
    }
  } catch (err) {
    console.error('[ImageToVideo] Result error:', err)
    res.status(500).json({ error: 'Failed to fetch result' })
  }
})

export default router
