/**
 * Render Job Service.
 *
 * Manages render job lifecycle: create, status, complete, fail, cancel.
 * Writes to the `render_jobs` table in Supabase.
 */

import { getSupabaseAdmin } from '../middleware/supabaseAuth'

export interface RenderJobSettings {
  aspectRatio?: string
  durationSeconds?: number
  fps?: number
  format?: 'mp4' | 'webm'
  [key: string]: unknown
}

export interface RenderJob {
  id: string
  user_id: string
  api_key_id: string | null
  status: 'queued' | 'running' | 'complete' | 'failed' | 'cancelled'
  prompt: string
  settings_json: RenderJobSettings
  plan_json: Record<string, unknown> | null
  result_url: string | null
  result_format: string | null
  result_size_bytes: number | null
  credits_cost: number
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  expires_at: string
}

/**
 * Create a new render job in the database.
 */
export async function createJob(
  userId: string,
  prompt: string,
  settings: RenderJobSettings,
  apiKeyId?: string,
  creditsCost: number = 200,
): Promise<string> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('render_jobs')
    .insert({
      user_id: userId,
      api_key_id: apiKeyId || null,
      prompt,
      settings_json: settings,
      credits_cost: creditsCost,
      status: 'queued',
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Failed to create render job: ${error?.message || 'unknown'}`)
  }

  return data.id
}

/**
 * Update the plan_json metadata for a render job.
 */
export async function updateJobMeta(jobId: string, meta: Record<string, unknown>): Promise<void> {
  const supabase = getSupabaseAdmin()
  await supabase.from('render_jobs').update({ plan_json: meta }).eq('id', jobId)
}

/**
 * Get the current status of a render job.
 */
export async function getJobStatus(jobId: string, userId: string): Promise<RenderJob | null> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('render_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', userId)
    .single()

  if (error || !data) return null
  return data as RenderJob
}

/**
 * Mark a job as running.
 */
export async function markRunning(jobId: string): Promise<void> {
  const supabase = getSupabaseAdmin()

  await supabase
    .from('render_jobs')
    .update({
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .eq('id', jobId)
}

/**
 * Mark a job as complete with the result URL.
 */
export async function markComplete(
  jobId: string,
  resultUrl: string,
  resultFormat: string,
  resultSizeBytes?: number,
  planJson?: Record<string, unknown>,
): Promise<void> {
  const supabase = getSupabaseAdmin()

  await supabase
    .from('render_jobs')
    .update({
      status: 'complete',
      result_url: resultUrl,
      result_format: resultFormat,
      result_size_bytes: resultSizeBytes || null,
      plan_json: planJson || null,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId)
}

/**
 * Mark a job as failed.
 */
export async function markFailed(jobId: string, errorMessage: string): Promise<void> {
  const supabase = getSupabaseAdmin()

  await supabase
    .from('render_jobs')
    .update({
      status: 'failed',
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId)
}

/**
 * Cancel a job (only if queued or running).
 */
export async function cancelJob(jobId: string, userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('render_jobs')
    .update({
      status: 'cancelled',
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('user_id', userId)
    .in('status', ['queued', 'running'])
    .select('id')

  return !error && (data?.length ?? 0) > 0
}

/**
 * List render jobs for a user.
 */
export async function listJobs(
  userId: string,
  limit: number = 20,
  offset: number = 0,
): Promise<{ jobs: RenderJob[]; total: number }> {
  const supabase = getSupabaseAdmin()

  const { data, error, count } = await supabase
    .from('render_jobs')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(`Failed to list jobs: ${error.message}`)

  return {
    jobs: (data || []) as RenderJob[],
    total: count || 0,
  }
}
