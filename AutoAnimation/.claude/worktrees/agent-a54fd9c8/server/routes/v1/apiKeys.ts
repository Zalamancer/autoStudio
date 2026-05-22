/**
 * API Key management routes.
 *
 * Uses requireAuth (Supabase JWT) since only dashboard users manage keys.
 * POST /  — create new key
 * GET /   — list keys
 * DELETE /:keyId — revoke key
 * GET /usage — aggregated usage stats per key
 */

import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, getSupabaseAdmin } from '../../middleware/supabaseAuth'
import { generateApiKey, hashApiKey } from '../../middleware/apiKeyAuth'

const router = Router()

// All routes require Supabase JWT auth
router.use(requireAuth)

// ── POST / — Create new API key ─────────────────────────────────────────────

const createKeyBody = z.object({
  name: z.string().min(1).max(200),
  tier: z.enum(['standard', 'premium', 'enterprise']).optional(),
})

router.post('/', async (req, res) => {
  try {
    const parsed = createKeyBody.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request body',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      })
      return
    }

    const userId = (req as any).userId as string
    const { name, tier } = parsed.data

    // Generate key
    const plainKey = generateApiKey()
    const keyHash = hashApiKey(plainKey)
    const keyPrefix = plainKey.substring(0, 12) + '...'

    // Determine rate limits based on tier
    const tierLimits: Record<string, { rpm: number; rpd: number }> = {
      standard: { rpm: 30, rpd: 1000 },
      premium: { rpm: 60, rpd: 5000 },
      enterprise: { rpm: 120, rpd: 50000 },
    }
    const limits = tierLimits[tier || 'standard']

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        tier: tier || 'standard',
        rate_limit_per_minute: limits.rpm,
        rate_limit_per_day: limits.rpd,
      })
      .select('id, name, key_prefix, tier, rate_limit_per_minute, rate_limit_per_day, created_at')
      .single()

    if (error || !data) {
      res.status(500).json({ error: 'Failed to create API key', code: 'INTERNAL_ERROR' })
      return
    }

    // Return full key only on creation — never again
    res.status(201).json({
      id: data.id,
      key: plainKey,
      name: data.name,
      prefix: data.key_prefix,
      tier: data.tier,
      rateLimitPerMinute: data.rate_limit_per_minute,
      rateLimitPerDay: data.rate_limit_per_day,
      createdAt: data.created_at,
    })
  } catch (err) {
    console.error('[ApiKeys] Create error:', err)
    res.status(500).json({ error: 'Failed to create API key', code: 'INTERNAL_ERROR' })
  }
})

// ── GET / — List API keys ────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, tier, rate_limit_per_minute, rate_limit_per_day, is_active, last_used_at, created_at, revoked_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      res.status(500).json({ error: 'Failed to list API keys', code: 'INTERNAL_ERROR' })
      return
    }

    res.json({
      keys: (data || []).map((k) => ({
        id: k.id,
        name: k.name,
        prefix: k.key_prefix,
        tier: k.tier,
        rateLimitPerMinute: k.rate_limit_per_minute,
        rateLimitPerDay: k.rate_limit_per_day,
        isActive: k.is_active,
        lastUsedAt: k.last_used_at,
        createdAt: k.created_at,
        revokedAt: k.revoked_at,
      })),
    })
  } catch (err) {
    console.error('[ApiKeys] List error:', err)
    res.status(500).json({ error: 'Failed to list API keys', code: 'INTERNAL_ERROR' })
  }
})

// ── DELETE /:keyId — Revoke an API key ───────────────────────────────────────

router.delete('/:keyId', async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('api_keys')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
      })
      .eq('id', req.params.keyId)
      .eq('user_id', userId)
      .select('id')

    if (error || !data || data.length === 0) {
      res.status(404).json({ error: 'API key not found', code: 'NOT_FOUND' })
      return
    }

    res.json({ id: req.params.keyId, revoked: true })
  } catch (err) {
    console.error('[ApiKeys] Revoke error:', err)
    res.status(500).json({ error: 'Failed to revoke API key', code: 'INTERNAL_ERROR' })
  }
})

// ── GET /usage — Aggregated usage stats per key ──────────────────────────────

router.get('/usage', async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const supabase = getSupabaseAdmin()

    // Get usage stats grouped by API key for the current billing period
    const { data, error } = await supabase
      .from('api_usage_log')
      .select('api_key_id, endpoint, method, status_code, credits_used, created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1000)

    if (error) {
      res.status(500).json({ error: 'Failed to fetch usage stats', code: 'INTERNAL_ERROR' })
      return
    }

    // Aggregate by key
    const byKey: Record<string, { totalCalls: number; totalCredits: number; lastUsed: string | null }> = {}
    for (const row of data || []) {
      if (!byKey[row.api_key_id]) {
        byKey[row.api_key_id] = { totalCalls: 0, totalCredits: 0, lastUsed: null }
      }
      byKey[row.api_key_id].totalCalls++
      byKey[row.api_key_id].totalCredits += row.credits_used || 0
      if (!byKey[row.api_key_id].lastUsed || row.created_at > byKey[row.api_key_id].lastUsed!) {
        byKey[row.api_key_id].lastUsed = row.created_at
      }
    }

    res.json({ usage: byKey, periodDays: 30 })
  } catch (err) {
    console.error('[ApiKeys] Usage error:', err)
    res.status(500).json({ error: 'Failed to fetch usage', code: 'INTERNAL_ERROR' })
  }
})

export default router
