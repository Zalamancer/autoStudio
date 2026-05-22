/**
 * Projects API routes — /api/v1/projects
 *
 * CRUD: GET / (list), POST / (create), GET /:id, PATCH /:id, DELETE /:id
 * Wraps existing Supabase project queries.
 */

import { Router } from 'express'
import { z } from 'zod'
import { getSupabaseAdmin } from '../../middleware/supabaseAuth'

const router = Router()

// ── Schemas ──────────────────────────────────────────────────────────────────

const createProjectBody = z.object({
  name: z.string().min(1).max(200),
  aspectRatio: z.string().max(20).optional(),
  fps: z.number().int().min(1).max(120).optional(),
  width: z.number().int().min(100).max(7680).optional(),
  height: z.number().int().min(100).max(4320).optional(),
  templateId: z.string().max(200).optional(),
  configState: z.record(z.string(), z.any()).optional(),
  motionDesignDescription: z.record(z.string(), z.any()).optional(),
})

const updateProjectBody = z.object({
  name: z.string().min(1).max(200).optional(),
  aspectRatio: z.string().max(20).optional(),
  fps: z.number().int().min(1).max(120).optional(),
  width: z.number().int().min(100).max(7680).optional(),
  height: z.number().int().min(100).max(4320).optional(),
  templateId: z.string().max(200).optional(),
  configState: z.record(z.string(), z.any()).optional(),
  motionDesignDescription: z.record(z.string(), z.any()).optional(),
}).passthrough()

// ── GET / — List projects ────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
    const offset = parseInt(req.query.offset as string) || 0

    const supabase = getSupabaseAdmin()
    const { data, error, count } = await supabase
      .from('projects')
      .select('id, name, aspect_ratio, fps, width, height, template_id, config_state, created_at, updated_at', { count: 'exact' })
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      res.status(500).json({ error: 'Failed to list projects', code: 'INTERNAL_ERROR' })
      return
    }

    res.json({
      projects: (data || []).map((p) => ({
        id: p.id,
        name: p.name,
        aspectRatio: p.aspect_ratio,
        fps: p.fps,
        width: p.width,
        height: p.height,
        templateId: p.template_id,
        configState: p.config_state,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      })),
      total: count || 0,
    })
  } catch (err) {
    console.error('[Projects] List error:', err)
    res.status(500).json({ error: 'Failed to list projects', code: 'INTERNAL_ERROR' })
  }
})

// ── POST / — Create project ─────────────────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const parsed = createProjectBody.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request body',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      })
      return
    }

    const userId = (req as any).userId as string
    const { name, aspectRatio, fps, width, height, templateId, configState, motionDesignDescription } = parsed.data

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name,
        aspect_ratio: aspectRatio || '9:16',
        fps: fps || 30,
        width: width || 1080,
        height: height || 1920,
        template_id: templateId || null,
        config_state: configState || {},
        motion_design_description: motionDesignDescription || null,
      })
      .select('id, name, aspect_ratio, fps, width, height, template_id, config_state, created_at')
      .single()

    if (error || !data) {
      res.status(500).json({ error: 'Failed to create project', code: 'INTERNAL_ERROR' })
      return
    }

    res.status(201).json({
      id: data.id,
      name: data.name,
      aspectRatio: data.aspect_ratio,
      fps: data.fps,
      width: data.width,
      height: data.height,
      templateId: data.template_id,
      configState: data.config_state,
      createdAt: data.created_at,
    })
  } catch (err) {
    console.error('[Projects] Create error:', err)
    res.status(500).json({ error: 'Failed to create project', code: 'INTERNAL_ERROR' })
  }
})

// ── GET /:id — Project detail ────────────────────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      res.status(404).json({ error: 'Project not found', code: 'NOT_FOUND' })
      return
    }

    res.json({
      id: data.id,
      name: data.name,
      aspectRatio: data.aspect_ratio,
      fps: data.fps,
      width: data.width,
      height: data.height,
      templateId: data.template_id,
      configState: data.config_state,
      motionDesignDescription: data.motion_design_description,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    })
  } catch (err) {
    console.error('[Projects] Detail error:', err)
    res.status(500).json({ error: 'Failed to fetch project', code: 'INTERNAL_ERROR' })
  }
})

// ── PATCH /:id — Update project ──────────────────────────────────────────────

router.patch('/:id', async (req, res) => {
  try {
    const parsed = updateProjectBody.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request body',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      })
      return
    }

    const userId = (req as any).userId as string
    const updates: Record<string, unknown> = {}
    const { name, aspectRatio, fps, width, height, templateId, configState, motionDesignDescription } = parsed.data
    if (name !== undefined) updates.name = name
    if (aspectRatio !== undefined) updates.aspect_ratio = aspectRatio
    if (fps !== undefined) updates.fps = fps
    if (width !== undefined) updates.width = width
    if (height !== undefined) updates.height = height
    if (templateId !== undefined) updates.template_id = templateId
    if (configState !== undefined) updates.config_state = configState
    if (motionDesignDescription !== undefined) updates.motion_design_description = motionDesignDescription

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .select('id, name, aspect_ratio, fps, width, height, updated_at')
      .single()

    if (error || !data) {
      res.status(404).json({ error: 'Project not found', code: 'NOT_FOUND' })
      return
    }

    res.json({
      id: data.id,
      name: data.name,
      aspectRatio: data.aspect_ratio,
      fps: data.fps,
      width: data.width,
      height: data.height,
      updatedAt: data.updated_at,
    })
  } catch (err) {
    console.error('[Projects] Update error:', err)
    res.status(500).json({ error: 'Failed to update project', code: 'INTERNAL_ERROR' })
  }
})

// ── DELETE /:id — Delete project ─────────────────────────────────────────────

router.delete('/:id', async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('projects')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .select('id')

    if (error || !data || data.length === 0) {
      res.status(404).json({ error: 'Project not found', code: 'NOT_FOUND' })
      return
    }

    res.json({ id: req.params.id, deleted: true })
  } catch (err) {
    console.error('[Projects] Delete error:', err)
    res.status(500).json({ error: 'Failed to delete project', code: 'INTERNAL_ERROR' })
  }
})

export default router
