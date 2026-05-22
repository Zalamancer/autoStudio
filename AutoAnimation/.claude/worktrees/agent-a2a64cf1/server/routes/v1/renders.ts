/**
 * Render API routes — POST /api/v1/renders
 *
 * Submit render jobs, poll status, download results, cancel jobs.
 */

import { Router } from 'express'
import { z } from 'zod'
import * as renderJobService from '../../services/renderJobService'
import { enqueueRenderJob } from '../../workers/renderWorker'
import { validateMotionDesignDescription } from '../../services/motionDesignValidator'

const router = Router()

// ── Schemas ──────────────────────────────────────────────────────────────────

const settingsSchema = z.object({
  aspectRatio: z.string().max(20).optional(),
  durationSeconds: z.number().min(1).max(300).optional(),
  fps: z.number().int().min(1).max(120).optional(),
  format: z.enum(['mp4', 'webm']).optional(),
}).passthrough()

const promptJobBody = z.object({
  prompt: z.string().min(1).max(10000),
  settings: settingsSchema.optional(),
  webhookUrl: z.string().url().max(2000).optional(),
})

const templateJobBody = z.object({
  motionDesignDescription: z.record(z.string(), z.any()),
  configOverrides: z.record(z.string(), z.any()).optional(),
  settings: settingsSchema.optional(),
  webhookUrl: z.string().url().max(2000).optional(),
})

// ── POST / — Submit a render job ─────────────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const isTemplate = 'motionDesignDescription' in req.body
    const parsed = isTemplate
      ? templateJobBody.safeParse(req.body)
      : promptJobBody.safeParse(req.body)
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
    const data = parsed.data

    let prompt: string
    let settings = data.settings || {}

    if ('motionDesignDescription' in data) {
      // ── Template-based render ────────────────────────────────────────
      const validation = validateMotionDesignDescription(data.motionDesignDescription)
      if (!validation.valid) {
        res.status(400).json({
          error: validation.error || 'Invalid motion design description',
          code: 'VALIDATION_ERROR',
        })
        return
      }

      const descName =
        (data.motionDesignDescription as any).name || 'untitled'
      prompt = `[template-render] ${descName}`

      // Create job in database
      const jobId = await renderJobService.createJob(
        userId,
        prompt,
        settings,
        apiKeyId,
      )

      // Store template description + overrides as plan metadata
      await renderJobService.updateJobMeta(jobId, {
        motionDesignDescription: validation.sanitized,
        configOverrides: data.configOverrides || null,
      })

      // Enqueue for processing
      enqueueRenderJob(jobId, userId, prompt, settings)

      res.status(201).json({
        jobId,
        status: 'queued',
        estimatedSeconds: 120,
        createdAt: new Date().toISOString(),
      })
      return
    }

    // ── Prompt-based render (existing flow) ──────────────────────────
    prompt = data.prompt

    // Create job in database
    const jobId = await renderJobService.createJob(
      userId,
      prompt,
      settings,
      apiKeyId,
    )

    // Enqueue for processing
    enqueueRenderJob(jobId, userId, prompt, settings)

    res.status(201).json({
      jobId,
      status: 'queued',
      estimatedSeconds: 120,
      createdAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[Renders] Submit error:', err)
    res.status(500).json({
      error: 'Failed to submit render job',
      code: 'INTERNAL_ERROR',
    })
  }
})

// ── GET /:jobId — Poll job status ────────────────────────────────────────────

router.get('/:jobId', async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const job = await renderJobService.getJobStatus(req.params.jobId, userId)

    if (!job) {
      res.status(404).json({ error: 'Job not found', code: 'NOT_FOUND' })
      return
    }

    res.json({
      jobId: job.id,
      status: job.status,
      prompt: job.prompt,
      resultUrl: job.result_url,
      resultFormat: job.result_format,
      creditsCost: job.credits_cost,
      errorMessage: job.error_message,
      createdAt: job.created_at,
      startedAt: job.started_at,
      completedAt: job.completed_at,
      expiresAt: job.expires_at,
    })
  } catch (err) {
    console.error('[Renders] Status error:', err)
    res.status(500).json({ error: 'Failed to fetch job status', code: 'INTERNAL_ERROR' })
  }
})

// ── GET /:jobId/download — Download result (redirect to signed URL) ──────────

router.get('/:jobId/download', async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const job = await renderJobService.getJobStatus(req.params.jobId, userId)

    if (!job) {
      res.status(404).json({ error: 'Job not found', code: 'NOT_FOUND' })
      return
    }

    if (job.status !== 'complete' || !job.result_url) {
      res.status(400).json({
        error: 'Job is not complete or has no result',
        code: 'NOT_READY',
        status: job.status,
      })
      return
    }

    // Redirect to the result URL
    res.redirect(302, job.result_url)
  } catch (err) {
    console.error('[Renders] Download error:', err)
    res.status(500).json({ error: 'Failed to download result', code: 'INTERNAL_ERROR' })
  }
})

// ── DELETE /:jobId — Cancel a job ────────────────────────────────────────────

router.delete('/:jobId', async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const cancelled = await renderJobService.cancelJob(req.params.jobId, userId)

    if (!cancelled) {
      res.status(404).json({
        error: 'Job not found or cannot be cancelled',
        code: 'NOT_FOUND',
      })
      return
    }

    res.json({ jobId: req.params.jobId, status: 'cancelled' })
  } catch (err) {
    console.error('[Renders] Cancel error:', err)
    res.status(500).json({ error: 'Failed to cancel job', code: 'INTERNAL_ERROR' })
  }
})

export default router
