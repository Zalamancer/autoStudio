/**
 * Render Worker.
 *
 * Processes render jobs: calls runOrchestration, uploads result to Supabase Storage,
 * marks job complete, fires webhook.
 *
 * Uses inline async processing (no BullMQ/Redis required).
 * For production with Redis, swap to a BullMQ worker using the same processJob function.
 */

import { runOrchestration } from '../services/orchestratorRunner'
import * as renderJobService from '../services/renderJobService'
import { deliverWebhook } from '../services/webhookDelivery'
import { getSupabaseAdmin, isSocialConfigured } from '../middleware/supabaseAuth'

/** In-memory queue for render jobs */
const jobQueue: Array<{
  jobId: string
  userId: string
  prompt: string
  settings: Record<string, unknown>
}> = []

let isProcessing = false

/**
 * Enqueue a render job for processing.
 */
export function enqueueRenderJob(
  jobId: string,
  userId: string,
  prompt: string,
  settings: Record<string, unknown>,
): void {
  jobQueue.push({ jobId, userId, prompt, settings })
  processNext()
}

/**
 * Process the next job in the queue.
 */
async function processNext(): Promise<void> {
  if (isProcessing || jobQueue.length === 0) return

  isProcessing = true
  const job = jobQueue.shift()!

  try {
    await processJob(job.jobId, job.userId, job.prompt, job.settings)
  } catch (err) {
    console.error(`[RenderWorker] Fatal error processing job ${job.jobId}:`, err)
  } finally {
    isProcessing = false
    // Process next job if any
    if (jobQueue.length > 0) {
      processNext()
    }
  }
}

/**
 * Process a single render job.
 */
async function processJob(
  jobId: string,
  userId: string,
  prompt: string,
  settings: Record<string, unknown>,
): Promise<void> {
  console.log(`[RenderWorker] Starting job ${jobId}`)

  try {
    // Mark as running
    await renderJobService.markRunning(jobId)

    // Check if this is a template-based render (motionDesignDescription already provided)
    const isTemplateRender = 'motionDesignDescription' in settings
    let plan: Record<string, unknown>
    let creditsUsed = 0

    if (isTemplateRender) {
      // Template render: skip AI orchestration, use the provided description directly
      console.log(`[RenderWorker] Template render — skipping orchestration`)
      plan = {
        motionDesignDescription: settings.motionDesignDescription,
        configOverrides: settings.configOverrides || {},
        settings: {
          format: settings.format || 'mp4',
          fps: settings.fps || 30,
          durationSeconds: settings.durationSeconds || 5,
        },
      }
      creditsUsed = 50 // template renders cost less
    } else {
      // Prompt-based render: run AI orchestration
      const result = await runOrchestration(prompt, settings)
      plan = result.plan
      creditsUsed = result.creditsUsed
    }

    // Upload result plan as JSON to Supabase Storage
    let resultUrl: string | null = null
    let resultSizeBytes: number | undefined

    if (isSocialConfigured()) {
      const supabase = getSupabaseAdmin()
      const planJson = JSON.stringify(plan, null, 2)
      const planBuffer = Buffer.from(planJson, 'utf-8')
      resultSizeBytes = planBuffer.length

      const storagePath = `renders/${userId}/${jobId}.json`
      const { error: uploadError } = await supabase.storage
        .from('renders')
        .upload(storagePath, planBuffer, {
          contentType: 'application/json',
          upsert: true,
        })

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('renders')
          .getPublicUrl(storagePath)
        resultUrl = urlData?.publicUrl || null
      }
    }

    // Mark job complete
    await renderJobService.markComplete(
      jobId,
      resultUrl || `render://${jobId}`,
      'json',
      resultSizeBytes,
      plan,
    )

    // Fire webhook
    await deliverWebhook(userId, 'render.complete', {
      event: 'render.complete',
      jobId,
      resultUrl: resultUrl || undefined,
      cost: { credits: creditsUsed },
      timestamp: new Date().toISOString(),
    })

    console.log(`[RenderWorker] Job ${jobId} completed successfully`)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[RenderWorker] Job ${jobId} failed:`, errorMessage)

    await renderJobService.markFailed(jobId, errorMessage)

    // Fire failure webhook
    await deliverWebhook(userId, 'render.failed', {
      event: 'render.failed',
      jobId,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    })
  }
}
