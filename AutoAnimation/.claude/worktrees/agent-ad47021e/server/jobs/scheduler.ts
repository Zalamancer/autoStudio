/**
 * Auto-Publish Background Job Scheduler.
 *
 * Polls for due executions every 60 seconds and processes them:
 *   1. Fetch due schedules from the database
 *   2. Generate a ClipPlan + voices via server-side orchestrator
 *   3. Store results in auto_publish_executions
 *   4. Mark as "done" or "error"
 *
 * Concurrency: 1 execution at a time to prevent resource exhaustion.
 * Retry: failed executions are retried up to 2 times with exponential backoff.
 */

import { getSupabaseAdmin } from '../middleware/supabaseAuth'
import { runOrchestration } from '../services/orchestratorRunner'
import { publishToPlatform } from '../services/socialPublisher'
import logger from '../lib/logger'

const POLL_INTERVAL_MS = 60_000 // 60 seconds
const MAX_RETRIES = 2

let pollInterval: ReturnType<typeof setInterval> | null = null
let isProcessing = false

/**
 * Check for and process due executions.
 */
async function processDueExecutions(): Promise<void> {
  if (isProcessing) {
    logger.debug('[Scheduler] Already processing, skipping tick')
    return
  }

  isProcessing = true

  try {
    const supabase = getSupabaseAdmin()

    // Find active schedules that are due
    const { data: dueSchedules, error } = await supabase
      .from('auto_publish_schedules')
      .select('*')
      .eq('is_active', true)
      .lte('next_run_at', new Date().toISOString())
      .limit(5)

    if (error) {
      logger.error({ error }, '[Scheduler] Failed to query due schedules')
      return
    }

    if (!dueSchedules || dueSchedules.length === 0) {
      // Fall through to check scheduled posts
    } else {
      logger.info(`[Scheduler] Found ${dueSchedules.length} due schedule(s)`)

      // Process one at a time
      for (const schedule of dueSchedules) {
        await processSchedule(schedule)
      }
    }

    // ── Check for one-off scheduled social posts ──
    await processScheduledPosts()
  } catch (err) {
    logger.error({ err }, '[Scheduler] Unexpected error in poll loop')
  } finally {
    isProcessing = false
  }
}

/**
 * Process a single schedule: create execution, run orchestration, update status.
 */
async function processSchedule(schedule: any): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { randomUUID } = await import('node:crypto')
  const executionId = randomUUID()

  try {
    // Create a pending execution
    const { error: insertErr } = await supabase
      .from('auto_publish_executions')
      .insert({
        id: executionId,
        schedule_id: schedule.id,
        status: 'generating',
        prompt: schedule.topic_prompt,
        started_at: new Date().toISOString(),
      })

    if (insertErr) {
      logger.error({ error: insertErr }, '[Scheduler] Failed to create execution')
      return
    }

    // Advance the schedule's next_run_at
    const nextRunAt = advanceNextRun(schedule.cron_expression)
    await supabase
      .from('auto_publish_schedules')
      .update({
        next_run_at: nextRunAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', schedule.id)

    // Run the orchestration
    logger.info(`[Scheduler] Running orchestration for schedule ${schedule.id}, execution ${executionId}`)

    const result = await runOrchestration(
      schedule.topic_prompt,
      schedule.orchestrator_settings || {},
    )

    // Mark execution as done
    await supabase
      .from('auto_publish_executions')
      .update({
        status: 'done',
        credits_used: result.creditsUsed,
        completed_at: new Date().toISOString(),
      })
      .eq('id', executionId)

    logger.info(`[Scheduler] Execution ${executionId} completed successfully`)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    logger.error({ err }, `[Scheduler] Execution ${executionId} failed`)

    // Check retry count
    const { data: execution } = await supabase
      .from('auto_publish_executions')
      .select('retry_count')
      .eq('id', executionId)
      .single()

    const retryCount = execution?.retry_count || 0

    if (retryCount < MAX_RETRIES) {
      // Re-queue for retry with exponential backoff
      const backoffMs = Math.pow(2, retryCount) * 60_000 // 1min, 2min, 4min
      await supabase
        .from('auto_publish_executions')
        .update({
          status: 'pending',
          error: `Retry ${retryCount + 1}/${MAX_RETRIES}: ${errorMessage}`,
          retry_count: retryCount + 1,
          started_at: new Date(Date.now() + backoffMs).toISOString(),
        })
        .eq('id', executionId)

      logger.info(`[Scheduler] Execution ${executionId} queued for retry ${retryCount + 1}/${MAX_RETRIES}`)
    } else {
      // Max retries exhausted — mark as error
      await supabase
        .from('auto_publish_executions')
        .update({
          status: 'error',
          error: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq('id', executionId)

      logger.warn(`[Scheduler] Execution ${executionId} permanently failed after ${MAX_RETRIES} retries`)
    }
  }
}

/**
 * Process one-off scheduled social media posts that are due.
 *
 * Queries the scheduled_posts table for posts where scheduled_at <= now
 * and status = 'pending', then calls the actual platform publish APIs
 * via the socialPublisher service.
 */
async function processScheduledPosts(): Promise<void> {
  const supabase = getSupabaseAdmin()

  const { data: duePosts, error } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .limit(5)

  if (error) {
    logger.error({ error }, '[Scheduler] Failed to query scheduled posts')
    return
  }

  if (!duePosts || duePosts.length === 0) return

  logger.info(`[Scheduler] Found ${duePosts.length} due scheduled post(s)`)

  for (const post of duePosts) {
    try {
      // Mark as publishing
      await supabase
        .from('scheduled_posts')
        .update({ status: 'publishing' })
        .eq('id', post.id)

      logger.info(`[Scheduler] Publishing scheduled post ${post.id} to ${post.platform}`)

      // Call the actual platform publish API
      const result = await publishToPlatform(
        post.user_id,
        post.platform,
        post.video_url,
        post.options || {},
      )

      if (result.success) {
        await supabase
          .from('scheduled_posts')
          .update({
            status: 'published',
            result: {
              success: true,
              postId: result.postId,
              postUrl: result.postUrl,
              publishedAt: new Date().toISOString(),
            },
          })
          .eq('id', post.id)

        logger.info(
          `[Scheduler] Scheduled post ${post.id} published successfully (postId: ${result.postId})`,
        )
      } else {
        // Publish returned a failure (e.g. unsupported platform, API rejection)
        await supabase
          .from('scheduled_posts')
          .update({
            status: 'failed',
            result: { success: false, error: result.error },
          })
          .eq('id', post.id)

        logger.warn(`[Scheduler] Scheduled post ${post.id} publish returned failure: ${result.error}`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logger.error({ err }, `[Scheduler] Scheduled post ${post.id} failed`)

      await supabase
        .from('scheduled_posts')
        .update({
          status: 'failed',
          result: { success: false, error: errorMessage },
        })
        .eq('id', post.id)
    }
  }
}

/**
 * Advance next_run_at based on cron expression.
 */
function advanceNextRun(cronExpression: string): string {
  const now = Date.now()
  let intervalMs: number

  switch (cronExpression) {
    case '0 9 * * *':     intervalMs = 24 * 60 * 60 * 1000; break       // daily
    case '0 9 */2 * *':   intervalMs = 2 * 24 * 60 * 60 * 1000; break   // every 2 days
    case '0 9 */3 * *':   intervalMs = 3 * 24 * 60 * 60 * 1000; break   // every 3 days
    case '0 9 * * 1':     intervalMs = 7 * 24 * 60 * 60 * 1000; break   // weekly
    default:              intervalMs = 24 * 60 * 60 * 1000               // fallback: daily
  }

  return new Date(now + intervalMs).toISOString()
}

/**
 * Start the background scheduler.
 */
export function startScheduler(): void {
  if (pollInterval) {
    logger.warn('[Scheduler] Already running')
    return
  }

  logger.info(`[Scheduler] Starting auto-publish scheduler (poll every ${POLL_INTERVAL_MS / 1000}s)`)

  // Run immediately on startup
  processDueExecutions()

  // Then poll on interval
  pollInterval = setInterval(processDueExecutions, POLL_INTERVAL_MS)
}

/**
 * Stop the background scheduler (graceful shutdown).
 */
export function stopScheduler(): void {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
    logger.info('[Scheduler] Stopped auto-publish scheduler')
  }
}
