/**
 * Auto-Publish Scheduling routes: CRUD for recurring video generation schedules.
 *
 * Endpoints:
 *   GET    /schedules           — List all schedules for current user
 *   POST   /schedules           — Create a new schedule
 *   PATCH  /schedules/:id       — Update a schedule
 *   DELETE /schedules/:id       — Delete a schedule
 *   GET    /due                 — Get executions due to run
 *   GET    /schedules/:id/executions — Get execution history
 *   POST   /executions/:id/start    — Mark execution as started
 *   POST   /executions/:id/complete — Mark execution as completed
 *   POST   /executions/:id/fail     — Mark execution as failed
 *   GET    /stats               — Get auto-publish stats for user
 */
import { Router, type Request, type Response } from 'express'
import { randomUUID } from 'node:crypto'
import { validate } from '../middleware/validate'
import { requireAuth } from '../middleware/supabaseAuth'
import { getSupabaseAdmin } from '../middleware/supabaseAuth'
import {
  autoPublishCreateBody,
  autoPublishUpdateBody,
  autoPublishCompleteBody,
  autoPublishFailBody,
} from '../schemas'

const router = Router()

// All routes require authentication
router.use(requireAuth)

// ── Helpers ──

function advanceNextRunAt(cronExpression: string, timezone: string): string {
  // Simple frequency-based advancement (not full cron parsing)
  const now = new Date()
  let nextMs: number

  switch (cronExpression) {
    case '0 9 * * *':       nextMs = 24 * 60 * 60 * 1000; break       // daily
    case '0 9 */2 * *':     nextMs = 2 * 24 * 60 * 60 * 1000; break   // every 2 days
    case '0 9 */3 * *':     nextMs = 3 * 24 * 60 * 60 * 1000; break   // every 3 days
    case '0 9 * * 1':       nextMs = 7 * 24 * 60 * 60 * 1000; break   // weekly
    default:                nextMs = 24 * 60 * 60 * 1000               // fallback: daily
  }

  return new Date(now.getTime() + nextMs).toISOString()
}

// ── GET /schedules ──

router.get('/schedules', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('auto_publish_schedules')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const schedules = (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      topicPrompt: row.topic_prompt,
      platforms: row.platforms,
      frequency: row.frequency,
      cronExpression: row.cron_expression,
      nextRunAt: row.next_run_at,
      timezone: row.timezone,
      orchestratorSettings: row.orchestrator_settings,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    res.json(schedules)
  } catch (err) {
    console.error('[AutoPublish] GET /schedules error:', err)
    res.status(500).json({ error: 'Failed to fetch schedules' })
  }
})

// ── POST /schedules ──

router.post('/schedules', validate({ body: autoPublishCreateBody }), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()
    const { topicPrompt, platforms, frequency, cronExpression, timezone, orchestratorSettings } = req.body

    const id = randomUUID()
    const nextRunAt = advanceNextRunAt(cronExpression, timezone)

    const { data, error } = await supabase
      .from('auto_publish_schedules')
      .insert({
        id,
        user_id: userId,
        topic_prompt: topicPrompt,
        platforms,
        frequency,
        cron_expression: cronExpression,
        next_run_at: nextRunAt,
        timezone,
        orchestrator_settings: orchestratorSettings || {},
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    res.json({
      id: data.id,
      userId: data.user_id,
      topicPrompt: data.topic_prompt,
      platforms: data.platforms,
      frequency: data.frequency,
      cronExpression: data.cron_expression,
      nextRunAt: data.next_run_at,
      timezone: data.timezone,
      orchestratorSettings: data.orchestrator_settings,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    })
  } catch (err) {
    console.error('[AutoPublish] POST /schedules error:', err)
    res.status(500).json({ error: 'Failed to create schedule' })
  }
})

// ── PATCH /schedules/:id ──

router.put('/schedules/:id', validate({ body: autoPublishUpdateBody }), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()
    const { id } = req.params
    const updates = req.body

    // Map camelCase to snake_case
    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (updates.topicPrompt !== undefined) dbUpdates.topic_prompt = updates.topicPrompt
    if (updates.platforms !== undefined) dbUpdates.platforms = updates.platforms
    if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency
    if (updates.cronExpression !== undefined) dbUpdates.cron_expression = updates.cronExpression
    if (updates.timezone !== undefined) dbUpdates.timezone = updates.timezone
    if (updates.orchestratorSettings !== undefined) dbUpdates.orchestrator_settings = updates.orchestratorSettings
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive

    const { data, error } = await supabase
      .from('auto_publish_schedules')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    if (!data) { res.status(404).json({ error: 'Schedule not found' }); return }

    res.json({
      id: data.id,
      userId: data.user_id,
      topicPrompt: data.topic_prompt,
      platforms: data.platforms,
      frequency: data.frequency,
      cronExpression: data.cron_expression,
      nextRunAt: data.next_run_at,
      timezone: data.timezone,
      orchestratorSettings: data.orchestrator_settings,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    })
  } catch (err) {
    console.error('[AutoPublish] PATCH /schedules/:id error:', err)
    res.status(500).json({ error: 'Failed to update schedule' })
  }
})

// ── DELETE /schedules/:id ──

router.delete('/schedules/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()
    const { id } = req.params

    const { error } = await supabase
      .from('auto_publish_schedules')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error

    res.json({ ok: true })
  } catch (err) {
    console.error('[AutoPublish] DELETE /schedules/:id error:', err)
    res.status(500).json({ error: 'Failed to delete schedule' })
  }
})

// ── GET /due ──
// Returns executions that are due to run (active schedules whose next_run_at is in the past)

router.get('/due', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()

    // Find active schedules that are due
    const { data: dueSchedules, error } = await supabase
      .from('auto_publish_schedules')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .lte('next_run_at', new Date().toISOString())

    if (error) throw error
    if (!dueSchedules || dueSchedules.length === 0) {
      res.json([])
      return
    }

    // Create pending executions for each due schedule
    const executions = []
    for (const schedule of dueSchedules) {
      const executionId = randomUUID()

      const { data: execution, error: execError } = await supabase
        .from('auto_publish_executions')
        .insert({
          id: executionId,
          schedule_id: schedule.id,
          status: 'pending',
          started_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (execError) {
        console.error('[AutoPublish] Failed to create execution:', execError)
        continue
      }

      // Advance the schedule's next_run_at
      await supabase
        .from('auto_publish_schedules')
        .update({
          next_run_at: advanceNextRunAt(schedule.cron_expression, schedule.timezone),
          updated_at: new Date().toISOString(),
        })
        .eq('id', schedule.id)

      executions.push({
        id: execution.id,
        scheduleId: execution.schedule_id,
        status: execution.status,
        prompt: execution.prompt,
        error: execution.error,
        creditsUsed: execution.credits_used,
        publishedPostIds: execution.published_post_ids || [],
        startedAt: execution.started_at,
        completedAt: execution.completed_at,
      })
    }

    res.json(executions)
  } catch (err) {
    console.error('[AutoPublish] GET /due error:', err)
    res.status(500).json({ error: 'Failed to check due executions' })
  }
})

// ── GET /schedules/:id/executions ──

router.get('/schedules/:id/executions', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()
    const { id } = req.params

    // Verify ownership
    const { data: schedule } = await supabase
      .from('auto_publish_schedules')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (!schedule) { res.status(404).json({ error: 'Schedule not found' }); return }

    const { data, error } = await supabase
      .from('auto_publish_executions')
      .select('*')
      .eq('schedule_id', id)
      .order('started_at', { ascending: false })
      .limit(50)

    if (error) throw error

    const executions = (data || []).map((row: any) => ({
      id: row.id,
      scheduleId: row.schedule_id,
      status: row.status,
      prompt: row.prompt,
      error: row.error,
      creditsUsed: row.credits_used,
      publishedPostIds: row.published_post_ids || [],
      startedAt: row.started_at,
      completedAt: row.completed_at,
    }))

    res.json(executions)
  } catch (err) {
    console.error('[AutoPublish] GET /schedules/:id/executions error:', err)
    res.status(500).json({ error: 'Failed to fetch executions' })
  }
})

// ── POST /executions/:id/start ──

router.post('/executions/:id/start', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin()
    const { id } = req.params

    const { error } = await supabase
      .from('auto_publish_executions')
      .update({ status: 'generating', started_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    res.json({ ok: true })
  } catch (err) {
    console.error('[AutoPublish] POST /executions/:id/start error:', err)
    res.status(500).json({ error: 'Failed to start execution' })
  }
})

// ── POST /executions/:id/complete ──

router.post('/executions/:id/complete', validate({ body: autoPublishCompleteBody }), async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin()
    const { id } = req.params
    const { creditsUsed, publishedPostIds } = req.body

    const { error } = await supabase
      .from('auto_publish_executions')
      .update({
        status: 'done',
        credits_used: creditsUsed,
        published_post_ids: publishedPostIds,
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error
    res.json({ ok: true })
  } catch (err) {
    console.error('[AutoPublish] POST /executions/:id/complete error:', err)
    res.status(500).json({ error: 'Failed to complete execution' })
  }
})

// ── POST /executions/:id/fail ──

router.post('/executions/:id/fail', validate({ body: autoPublishFailBody }), async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin()
    const { id } = req.params
    const { error: failError } = req.body

    const { error } = await supabase
      .from('auto_publish_executions')
      .update({
        status: 'error',
        error: failError,
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error
    res.json({ ok: true })
  } catch (err) {
    console.error('[AutoPublish] POST /executions/:id/fail error:', err)
    res.status(500).json({ error: 'Failed to mark execution as failed' })
  }
})

// ── GET /stats ──

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()

    // Get all schedules for user
    const { data: schedules } = await supabase
      .from('auto_publish_schedules')
      .select('id, next_run_at, is_active')
      .eq('user_id', userId)

    const scheduleIds = (schedules || []).map((s: any) => s.id)

    let totalExecutions = 0
    let successfulExecutions = 0
    let totalCreditsUsed = 0

    if (scheduleIds.length > 0) {
      const { data: executions } = await supabase
        .from('auto_publish_executions')
        .select('status, credits_used')
        .in('schedule_id', scheduleIds)

      for (const exec of executions || []) {
        totalExecutions++
        if (exec.status === 'done') successfulExecutions++
        totalCreditsUsed += exec.credits_used || 0
      }
    }

    // Find next scheduled run
    const activeSchedules = (schedules || []).filter((s: any) => s.is_active)
    const nextScheduledRun = activeSchedules.length > 0
      ? activeSchedules.reduce((earliest: string, s: any) =>
          s.next_run_at < earliest ? s.next_run_at : earliest,
        activeSchedules[0].next_run_at)
      : undefined

    res.json({
      totalExecutions,
      successfulExecutions,
      totalCreditsUsed,
      nextScheduledRun,
    })
  } catch (err) {
    console.error('[AutoPublish] GET /stats error:', err)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

export default router
