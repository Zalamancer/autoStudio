/**
 * Webhook management routes.
 *
 * POST /  — register webhook URL
 * GET /   — list webhooks
 * DELETE /:id — unregister webhook
 */

import { Router } from 'express'
import crypto from 'node:crypto'
import { z } from 'zod'
import { getSupabaseAdmin } from '../../middleware/supabaseAuth'

const router = Router()

// ── Schemas ──────────────────────────────────────────────────────────────────

const createWebhookBody = z.object({
  url: z.string().url().max(2000),
  events: z.array(z.string().max(100)).min(1).max(20).optional(),
})

// ── POST / — Register webhook ────────────────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const parsed = createWebhookBody.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request body',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      })
      return
    }

    const userId = (req as any).userId as string
    const { url, events } = parsed.data

    // Generate webhook secret for HMAC signing
    const secret = crypto.randomBytes(32).toString('hex')

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('api_webhooks')
      .insert({
        user_id: userId,
        url,
        secret,
        events: events || ['render.complete'],
      })
      .select('id, url, events, created_at')
      .single()

    if (error || !data) {
      res.status(500).json({ error: 'Failed to register webhook', code: 'INTERNAL_ERROR' })
      return
    }

    // Return secret only on creation
    res.status(201).json({
      id: data.id,
      url: data.url,
      secret,
      events: data.events,
      createdAt: data.created_at,
    })
  } catch (err) {
    console.error('[Webhooks] Create error:', err)
    res.status(500).json({ error: 'Failed to register webhook', code: 'INTERNAL_ERROR' })
  }
})

// ── GET / — List webhooks ────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('api_webhooks')
      .select('id, url, events, is_active, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      res.status(500).json({ error: 'Failed to list webhooks', code: 'INTERNAL_ERROR' })
      return
    }

    res.json({
      webhooks: (data || []).map((wh) => ({
        id: wh.id,
        url: wh.url,
        events: wh.events,
        isActive: wh.is_active,
        createdAt: wh.created_at,
      })),
    })
  } catch (err) {
    console.error('[Webhooks] List error:', err)
    res.status(500).json({ error: 'Failed to list webhooks', code: 'INTERNAL_ERROR' })
  }
})

// ── DELETE /:id — Unregister webhook ─────────────────────────────────────────

router.delete('/:id', async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('api_webhooks')
      .update({ is_active: false })
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .select('id')

    if (error || !data || data.length === 0) {
      res.status(404).json({ error: 'Webhook not found', code: 'NOT_FOUND' })
      return
    }

    res.json({ id: req.params.id, removed: true })
  } catch (err) {
    console.error('[Webhooks] Delete error:', err)
    res.status(500).json({ error: 'Failed to unregister webhook', code: 'INTERNAL_ERROR' })
  }
})

export default router
