import { Router } from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { trainRewardModel, predictTemplateScore, getModelStatus } from '../services/rewardModel'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEMPLATE_DIR = path.resolve(__dirname, '..', '..', 'src', 'motionGraphics', 'templates')

const router = Router()

/**
 * POST /api/reward-model/train
 * Train or retrain the reward model on all rated templates.
 */
router.post('/train', async (_req, res) => {
  try {
    const result = await trainRewardModel(TEMPLATE_DIR)
    res.json(result)
  } catch (err: any) {
    console.error('[RewardModel] Train error:', err)
    res.status(500).json({ error: err.message || 'Training failed' })
  }
})

/**
 * POST /api/reward-model/predict
 * Predict quality score for template code.
 * Body: { code: string }
 */
router.post('/predict', (req, res) => {
  const { code } = req.body
  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'code (string) required' })
    return
  }

  try {
    const result = predictTemplateScore(code)
    if (!result) {
      res.status(503).json({ error: 'Model not trained yet. POST /api/reward-model/train first.' })
      return
    }
    res.json(result)
  } catch (err: any) {
    console.error('[RewardModel] Predict error:', err)
    res.status(500).json({ error: err.message || 'Prediction failed' })
  }
})

/**
 * GET /api/reward-model/status
 * Get model training status, sample count, R², feature importance.
 */
router.get('/status', (_req, res) => {
  try {
    const status = getModelStatus()
    res.json(status)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Status check failed' })
  }
})

export default router
