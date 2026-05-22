import { Router, type Request, type Response } from 'express'
import { getHandler, getConfiguredStatus } from '../services/aiProviders/index'

const router = Router()

const VALID_CAPABILITIES = new Set([
  'text-to-image',
  'image-to-image',
  'text-to-video',
  'image-to-video',
  'text-to-3d',
  'image-upscale',
  'background-removal',
  'inpainting',
  'lip-sync',
])

// GET /api/ai/status — which providers are configured
router.get('/status', (_req: Request, res: Response) => {
  res.json(getConfiguredStatus())
})

// POST /api/ai/:capability — execute a generation request
router.post('/:capability', async (req: Request, res: Response) => {
  try {
    const { capability } = req.params
    const { provider, model, ...params } = req.body

    if (!VALID_CAPABILITIES.has(capability)) {
      res.status(400).json({ error: `Invalid capability: ${capability}` })
      return
    }

    if (!provider || typeof provider !== 'string') {
      res.status(400).json({ error: 'Missing required field: provider' })
      return
    }

    if (!model || typeof model !== 'string') {
      res.status(400).json({ error: 'Missing required field: model' })
      return
    }

    const handler = getHandler(provider)
    if (!handler) {
      res.status(400).json({ error: `Unknown provider: ${provider}` })
      return
    }

    if (!handler.isConfigured()) {
      res.status(503).json({
        error: `Provider ${provider} is not configured. Set the API key in server/.env`,
      })
      return
    }

    console.log(`[ai-provider] ${capability} via ${provider}/${model}`)
    const result = await handler.execute(capability, model, params)
    res.json(result)
  } catch (err) {
    console.error('[ai-provider] Execute error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

// GET /api/ai/job/:jobId — poll job status
router.get('/job/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params
    const provider = req.query.provider as string

    if (!provider) {
      // Try to infer provider from jobId prefix
      const prefix = jobId.split(':')[0]
      const handler = getHandler(prefix) || getHandler(provider)
      if (!handler) {
        res.status(400).json({ error: 'Cannot determine provider. Pass ?provider=fal-ai' })
        return
      }
      const status = await handler.getJobStatus(jobId)
      res.json(status)
      return
    }

    const handler = getHandler(provider)
    if (!handler) {
      res.status(400).json({ error: `Unknown provider: ${provider}` })
      return
    }

    const status = await handler.getJobStatus(jobId)
    res.json(status)
  } catch (err) {
    console.error('[ai-provider] Job status error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

export default router
