/**
 * Translation API routes — /api/v1/translate
 *
 * POST / — submit a translation job for a project
 */

import { Router } from 'express'
import { z } from 'zod'
import * as renderJobService from '../../services/renderJobService'

const router = Router()

// ── Schemas ──────────────────────────────────────────────────────────────────

const translateBody = z.object({
  projectId: z.string().min(1).max(200),
  targetLanguage: z.string().min(2).max(10),
  settings: z.object({
    minSpeed: z.number().min(0.5).max(2.0).optional(),
    maxSpeed: z.number().min(0.5).max(2.0).optional(),
    maxOverlapSeconds: z.number().min(0).max(2.0).optional(),
  }).optional(),
})

// ── POST / — Submit translation job ──────────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const parsed = translateBody.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request body',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      })
      return
    }

    const userId = (req as any).userId as string
    const apiKeyId = (req as any).apiKeyId as string | undefined
    const { projectId, targetLanguage, settings } = parsed.data

    // Create a render job for the translation
    const jobId = await renderJobService.createJob(
      userId,
      `translate:${projectId}:${targetLanguage}`,
      {
        type: 'translation',
        projectId,
        targetLanguage,
        ...settings,
      },
      apiKeyId,
      50, // Translation credits cost
    )

    res.status(201).json({
      jobId,
      status: 'queued',
      projectId,
      targetLanguage,
      estimatedSeconds: 60,
    })
  } catch (err) {
    console.error('[Translate] Submit error:', err)
    res.status(500).json({ error: 'Failed to submit translation job', code: 'INTERNAL_ERROR' })
  }
})

export default router
