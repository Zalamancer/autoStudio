import { Router } from 'express'
import { generateTemplates, type GenerationConfig } from '../services/templateGenerator'

const router = Router()

router.post('/', async (req, res) => {
  const config: GenerationConfig = req.body
  if (!config.concept?.trim()) {
    res.status(400).json({ error: 'concept is required' })
    return
  }

  try {
    console.log('[Generation] Starting with config:', JSON.stringify(config))
    const result = await generateTemplates(config)
    console.log(`[Generation] Complete: ${result.results.length} templates, round=${result.roundLabel}`)
    res.json(result)
  } catch (err: any) {
    console.error('[Generation] Error:', err)
    res.status(500).json({ error: err.message || 'Generation failed' })
  }
})

export default router
