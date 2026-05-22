/**
 * Characters API routes — /api/v1/characters
 *
 * GET /     — list saved characters
 * GET /:id  — character detail
 */

import { Router } from 'express'
import { getSupabaseAdmin } from '../../middleware/supabaseAuth'

const router = Router()

// ── GET / — List saved characters ────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('sprites')
      .select('id, project_id, part_type, label, image_url, created_at')
      .eq('project_id', userId) // Characters are stored per-user/project
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      // If table doesn't exist or query fails, return empty
      res.json({ characters: [] })
      return
    }

    res.json({
      characters: (data || []).map((c) => ({
        id: c.id,
        partType: c.part_type,
        label: c.label,
        thumbnailUrl: c.image_url,
        createdAt: c.created_at,
      })),
    })
  } catch (err) {
    console.error('[Characters] List error:', err)
    res.status(500).json({ error: 'Failed to list characters', code: 'INTERNAL_ERROR' })
  }
})

// ── GET /:id — Character detail ──────────────────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('sprites')
      .select('*')
      .eq('id', req.params.id)
      .eq('project_id', userId)
      .single()

    if (error || !data) {
      res.status(404).json({ error: 'Character not found', code: 'NOT_FOUND' })
      return
    }

    res.json({
      id: data.id,
      partType: data.part_type,
      label: data.label,
      imageUrl: data.image_url,
      createdAt: data.created_at,
    })
  } catch (err) {
    console.error('[Characters] Detail error:', err)
    res.status(500).json({ error: 'Failed to fetch character', code: 'INTERNAL_ERROR' })
  }
})

export default router
