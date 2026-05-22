/**
 * Meshy API proxy routes for 3D character generation, auto-rigging, and remeshing.
 *
 * Endpoints:
 *   POST /text-to-3d       — Start text-to-3D generation
 *   POST /image-to-3d      — Start image-to-3D generation
 *   GET  /task/:taskId     — Poll generation task status
 *   POST /auto-rig         — Start auto-rigging on a generated model
 *   GET  /rig/:taskId      — Poll rigging task status
 *   POST /remesh           — Start mesh decimation/remeshing
 *   GET  /remesh/:taskId   — Poll remesh task status
 */
import { Router, type Request, type Response } from 'express'

const router = Router()

const MESHY_API_BASE = 'https://api.meshy.ai/openapi/v2'
const MESHY_API_V1 = 'https://api.meshy.ai/openapi/v1'

function getMeshyKey(): string | null {
  return process.env.MESHY_API_KEY || null
}

async function meshyFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const apiKey = getMeshyKey()
  if (!apiKey) {
    throw new Error('MESHY_API_KEY is not configured')
  }

  const url = `${MESHY_API_BASE}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  return res as unknown as Response
}

// POST /text-to-3d — Start a text-to-3D generation task
router.post('/text-to-3d', async (req: Request, res: Response) => {
  try {
    const { prompt, style } = req.body

    if (!prompt) {
      res.status(400).json({ error: 'Missing required field: prompt' })
      return
    }

    if (!getMeshyKey()) {
      res.status(503).json({ error: 'MESHY_API_KEY is not configured' })
      return
    }

    console.log(`[Meshy] Starting text-to-3D: "${prompt}" (style: ${style || 'default'})`)

    const meshyRes = await fetch(`${MESHY_API_BASE}/text-to-3d`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getMeshyKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'refine',
        prompt,
        art_style: style || 'realistic',
        should_remesh: true,
      }),
    })

    if (!meshyRes.ok) {
      const errorText = await meshyRes.text()
      console.error('[Meshy] text-to-3d error:', errorText)
      res.status(meshyRes.status).json({ error: `Meshy API error: ${errorText}` })
      return
    }

    const data = await meshyRes.json()
    console.log(`[Meshy] Task created: ${data.result}`)

    res.json({ taskId: data.result, status: 'pending' })
  } catch (error) {
    console.error('[Meshy] text-to-3d error:', error)
    res.status(500).json({
      error: 'Failed to start 3D generation',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// POST /image-to-3d — Start an image-to-3D generation task
router.post('/image-to-3d', async (req: Request, res: Response) => {
  try {
    const { imageBase64 } = req.body

    if (!imageBase64) {
      res.status(400).json({ error: 'Missing required field: imageBase64' })
      return
    }

    if (!getMeshyKey()) {
      res.status(503).json({ error: 'MESHY_API_KEY is not configured' })
      return
    }

    console.log('[Meshy] Starting image-to-3D generation...')

    const meshyRes = await fetch(`${MESHY_API_BASE}/image-to-3d`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getMeshyKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageBase64,
        should_remesh: true,
      }),
    })

    if (!meshyRes.ok) {
      const errorText = await meshyRes.text()
      console.error('[Meshy] image-to-3d error:', errorText)
      res.status(meshyRes.status).json({ error: `Meshy API error: ${errorText}` })
      return
    }

    const data = await meshyRes.json()
    console.log(`[Meshy] Task created: ${data.result}`)

    res.json({ taskId: data.result, status: 'pending' })
  } catch (error) {
    console.error('[Meshy] image-to-3d error:', error)
    res.status(500).json({
      error: 'Failed to start 3D generation',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// GET /task/:taskId — Poll generation task status
router.get('/task/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params

    if (!getMeshyKey()) {
      res.status(503).json({ error: 'MESHY_API_KEY is not configured' })
      return
    }

    const meshyRes = await fetch(`${MESHY_API_BASE}/text-to-3d/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${getMeshyKey()}`,
      },
    })

    if (!meshyRes.ok) {
      const errorText = await meshyRes.text()
      res.status(meshyRes.status).json({ error: `Meshy API error: ${errorText}` })
      return
    }

    const data = await meshyRes.json()

    res.json({
      status: data.status === 'SUCCEEDED' ? 'complete'
            : data.status === 'FAILED' ? 'failed'
            : data.status === 'IN_PROGRESS' ? 'processing'
            : 'pending',
      progress: data.progress || 0,
      modelUrl: data.model_urls?.glb || undefined,
      thumbnailUrl: data.thumbnail_url || undefined,
      error: data.task_error?.message || undefined,
    })
  } catch (error) {
    console.error('[Meshy] task poll error:', error)
    res.status(500).json({
      error: 'Failed to check task status',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// POST /auto-rig — Start auto-rigging on a model
router.post('/auto-rig', async (req: Request, res: Response) => {
  try {
    const { modelUrl } = req.body

    if (!modelUrl) {
      res.status(400).json({ error: 'Missing required field: modelUrl' })
      return
    }

    if (!getMeshyKey()) {
      res.status(503).json({ error: 'MESHY_API_KEY is not configured' })
      return
    }

    console.log('[Meshy] Starting auto-rig...')

    const meshyRes = await fetch(`${MESHY_API_BASE}/rigging-and-animation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getMeshyKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input_model_url: modelUrl,
        input_type: 'glb',
      }),
    })

    if (!meshyRes.ok) {
      const errorText = await meshyRes.text()
      console.error('[Meshy] auto-rig error:', errorText)
      res.status(meshyRes.status).json({ error: `Meshy API error: ${errorText}` })
      return
    }

    const data = await meshyRes.json()
    console.log(`[Meshy] Rig task created: ${data.result}`)

    res.json({ taskId: data.result, status: 'pending' })
  } catch (error) {
    console.error('[Meshy] auto-rig error:', error)
    res.status(500).json({
      error: 'Failed to start auto-rigging',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// GET /rig/:taskId — Poll rigging task status
router.get('/rig/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params

    if (!getMeshyKey()) {
      res.status(503).json({ error: 'MESHY_API_KEY is not configured' })
      return
    }

    const meshyRes = await fetch(`${MESHY_API_BASE}/rigging-and-animation/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${getMeshyKey()}`,
      },
    })

    if (!meshyRes.ok) {
      const errorText = await meshyRes.text()
      res.status(meshyRes.status).json({ error: `Meshy API error: ${errorText}` })
      return
    }

    const data = await meshyRes.json()

    res.json({
      status: data.status === 'SUCCEEDED' ? 'complete'
            : data.status === 'FAILED' ? 'failed'
            : data.status === 'IN_PROGRESS' ? 'processing'
            : 'pending',
      riggedModelUrl: data.output?.glb || undefined,
      error: data.task_error?.message || undefined,
    })
  } catch (error) {
    console.error('[Meshy] rig poll error:', error)
    res.status(500).json({
      error: 'Failed to check rigging status',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// POST /remesh — Start mesh decimation to reduce polygon count
router.post('/remesh', async (req: Request, res: Response) => {
  try {
    const { modelUrl, targetPolycount = 30000 } = req.body

    if (!modelUrl) {
      res.status(400).json({ error: 'Missing required field: modelUrl' })
      return
    }

    if (!getMeshyKey()) {
      res.status(503).json({ error: 'MESHY_API_KEY is not configured' })
      return
    }

    console.log(`[Meshy] Starting remesh (target: ${targetPolycount} polys)...`)

    const meshyRes = await fetch(`${MESHY_API_V1}/remesh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getMeshyKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_url: modelUrl,
        target_polycount: Math.min(Math.max(targetPolycount, 100), 300000),
        topology: 'triangle',
        target_formats: ['glb'],
      }),
    })

    if (!meshyRes.ok) {
      const errorText = await meshyRes.text()
      console.error('[Meshy] remesh error:', errorText)
      res.status(meshyRes.status).json({ error: `Meshy API error: ${errorText}` })
      return
    }

    const data = await meshyRes.json()
    console.log(`[Meshy] Remesh task created: ${data.result}`)

    res.json({ taskId: data.result, status: 'pending' })
  } catch (error) {
    console.error('[Meshy] remesh error:', error)
    res.status(500).json({
      error: 'Failed to start remeshing',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// GET /remesh/:taskId — Poll remesh task status
router.get('/remesh/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params

    if (!getMeshyKey()) {
      res.status(503).json({ error: 'MESHY_API_KEY is not configured' })
      return
    }

    const meshyRes = await fetch(`${MESHY_API_V1}/remesh/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${getMeshyKey()}`,
      },
    })

    if (!meshyRes.ok) {
      const errorText = await meshyRes.text()
      res.status(meshyRes.status).json({ error: `Meshy API error: ${errorText}` })
      return
    }

    const data = await meshyRes.json()

    res.json({
      status: data.status === 'SUCCEEDED' ? 'complete'
            : data.status === 'FAILED' ? 'failed'
            : data.status === 'IN_PROGRESS' ? 'processing'
            : 'pending',
      progress: data.progress || 0,
      modelUrl: data.model_urls?.glb || undefined,
      error: data.task_error?.message || undefined,
    })
  } catch (error) {
    console.error('[Meshy] remesh poll error:', error)
    res.status(500).json({
      error: 'Failed to check remesh status',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export default router
