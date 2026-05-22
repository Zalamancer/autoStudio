import { Router } from 'express'
import { getSupabaseAdmin, isSocialConfigured } from '../middleware/supabaseAuth'

const router = Router()

/**
 * POST /api/template-ratings
 * Save a single template rating (called immediately on each rating)
 * Body: { templateId: string, scores: { impact, finish, flow, versatility, appeal }, verdict: string }
 */
router.post('/', async (req, res) => {
  if (!isSocialConfigured()) {
    res.status(503).json({ error: 'Supabase not configured' })
    return
  }

  const { templateId, scores, verdict } = req.body
  if (!templateId || !verdict) {
    res.status(400).json({ error: 'templateId and verdict required' })
    return
  }

  try {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('template_ratings').upsert(
      {
        template_id: templateId,
        verdict,
        impact: scores?.impact ?? null,
        finish: scores?.finish ?? null,
        flow: scores?.depth ?? scores?.flow ?? null,
        versatility: scores?.versatility ?? null,
        appeal: scores?.appeal ?? null,
        rated_at: new Date().toISOString(),
      },
      { onConflict: 'template_id' },
    )

    if (error) {
      console.error('[Ratings] Upsert failed:', error)
      res.status(500).json({ error: error.message })
      return
    }

    res.json({ ok: true })
  } catch (err) {
    console.error('[Ratings] Save error:', err)
    res.status(500).json({ error: 'Failed to save rating' })
  }
})

/**
 * GET /api/template-ratings
 * Load all ratings
 */
router.get('/', async (_req, res) => {
  if (!isSocialConfigured()) {
    res.status(503).json({ error: 'Supabase not configured' })
    return
  }

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('template_ratings')
      .select('template_id, verdict, impact, finish, flow, versatility, appeal')

    if (error) {
      console.error('[Ratings] Fetch failed:', error)
      res.status(500).json({ error: error.message })
      return
    }

    // Convert to { [templateId]: { verdict, scores } } format
    const ratings: Record<string, any> = {}
    for (const row of data ?? []) {
      const hasScores = row.impact != null
      ratings[row.template_id] = {
        verdict: row.verdict,
        scores: hasScores
          ? {
              impact: row.impact,
              finish: row.finish,
              depth: row.flow,
              versatility: row.versatility,
              appeal: row.appeal,
            }
          : null,
      }
    }

    res.json(ratings)
  } catch (err) {
    console.error('[Ratings] Load error:', err)
    res.status(500).json({ error: 'Failed to load ratings' })
  }
})

/**
 * POST /api/template-ratings/bulk
 * Import bulk ratings (for migrating existing .template-ratings.json)
 * Body: { ratings: { [templateId]: { verdict, scores? } } }
 */
router.post('/bulk', async (req, res) => {
  if (!isSocialConfigured()) {
    res.status(503).json({ error: 'Supabase not configured' })
    return
  }

  const { ratings } = req.body
  if (!ratings || typeof ratings !== 'object') {
    res.status(400).json({ error: 'ratings object required' })
    return
  }

  try {
    const supabase = getSupabaseAdmin()
    const rows = Object.entries(ratings).map(([id, val]: [string, any]) => ({
      template_id: id,
      verdict: typeof val === 'string' ? val : val.verdict,
      impact: val?.scores?.impact ?? null,
      finish: val?.scores?.finish ?? null,
      flow: val?.scores?.depth ?? val?.scores?.flow ?? null,
      versatility: val?.scores?.versatility ?? null,
      appeal: val?.scores?.appeal ?? null,
      rated_at: new Date().toISOString(),
    }))

    // Upsert in batches of 500
    for (let i = 0; i < rows.length; i += 500) {
      const batch = rows.slice(i, i + 500)
      const { error } = await supabase.from('template_ratings').upsert(batch, { onConflict: 'template_id' })
      if (error) {
        console.error(`[Ratings] Bulk batch ${i} failed:`, error)
        res.status(500).json({ error: error.message })
        return
      }
    }

    res.json({ ok: true, count: rows.length })
  } catch (err) {
    console.error('[Ratings] Bulk import error:', err)
    res.status(500).json({ error: 'Failed to bulk import' })
  }
})

/**
 * DELETE /api/template-ratings
 * Clear all ratings from Supabase (for starting fresh).
 */
router.delete('/', async (_req, res) => {
  if (!isSocialConfigured()) {
    res.status(503).json({ error: 'Supabase not configured' })
    return
  }

  try {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('template_ratings').delete().neq('template_id', '')
    if (error) {
      console.error('[Ratings] Clear failed:', error)
      res.status(500).json({ error: error.message })
      return
    }
    res.json({ ok: true, message: 'All ratings cleared' })
  } catch (err) {
    console.error('[Ratings] Clear error:', err)
    res.status(500).json({ error: 'Failed to clear ratings' })
  }
})

export default router
