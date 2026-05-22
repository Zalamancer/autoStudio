/**
 * Marketplace listing, usage tracking, and royalty distribution routes.
 */

import { Router, type Request, type Response } from 'express'
import { requireAuth, getSupabaseAdmin, isSocialConfigured } from '../middleware/supabaseAuth'

const router = Router()

// ── GET /listings — Browse marketplace (public) ──
router.get('/listings', async (req: Request, res: Response) => {
  try {
    if (!isSocialConfigured()) {
      res.json({ listings: [] })
      return
    }
    const { category, search, page = '1', limit = '20' } = req.query
    const offset = (Number(page) - 1) * Number(limit)
    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('marketplace_listings')
      .select('*, creator:auth.users!creator_id(email)')
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1)

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      // Fallback: if the join on auth.users fails (common with RLS), query without join
      const fallbackQuery = supabase
        .from('marketplace_listings')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + Number(limit) - 1)

      if (category && category !== 'all') {
        fallbackQuery.eq('category', category)
      }
      if (search) {
        fallbackQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
      }

      const { data: fallbackData, error: fallbackError } = await fallbackQuery

      if (fallbackError) {
        console.error('[Marketplace] Listings query error:', fallbackError)
        res.status(500).json({ error: 'Failed to fetch listings' })
        return
      }

      res.json({ listings: fallbackData ?? [] })
      return
    }

    res.json({ listings: data ?? [] })
  } catch (err) {
    console.error('[Marketplace] Listings error:', err)
    res.status(500).json({ error: 'Failed to fetch listings' })
  }
})

// ── GET /listings/:id — Get single listing detail (public) ──
router.get('/listings/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('marketplace_listings')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      res.status(404).json({ error: 'Listing not found' })
      return
    }

    // Increment use_count for analytics (fire-and-forget)
    supabase
      .from('marketplace_listings')
      .update({ use_count: (data.use_count || 0) + 1 })
      .eq('id', id)
      .then(() => {})
      .catch(() => {})

    res.json({ listing: data })
  } catch (err) {
    console.error('[Marketplace] Get listing error:', err)
    res.status(500).json({ error: 'Failed to fetch listing' })
  }
})

// ── POST /listings — Publish a listing (auth required) ──
router.post('/listings', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const { title, description, category, asset_url, thumbnail_url, metadata } = req.body

    if (!title || !category || !asset_url) {
      res.status(400).json({ error: 'Missing required fields: title, category, asset_url' })
      return
    }

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('marketplace_listings')
      .insert({
        creator_id: userId,
        title,
        description: description || '',
        category,
        asset_url,
        thumbnail_url: thumbnail_url || null,
        metadata: metadata || {},
      })
      .select()
      .single()

    if (error) {
      console.error('[Marketplace] Create listing error:', error)
      res.status(500).json({ error: 'Failed to create listing' })
      return
    }

    res.status(201).json({ listing: data })
  } catch (err) {
    console.error('[Marketplace] Create listing error:', err)
    res.status(500).json({ error: 'Failed to create listing' })
  }
})

// ── DELETE /listings/:id — Delete own listing (auth required) ──
router.delete('/listings/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const { id } = req.params
    const supabase = getSupabaseAdmin()

    // Verify ownership
    const { data: listing } = await supabase
      .from('marketplace_listings')
      .select('creator_id')
      .eq('id', id)
      .single()

    if (!listing || listing.creator_id !== userId) {
      res.status(403).json({ error: 'Not authorized to delete this listing' })
      return
    }

    const { error } = await supabase
      .from('marketplace_listings')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[Marketplace] Delete listing error:', error)
      res.status(500).json({ error: 'Failed to delete listing' })
      return
    }

    res.json({ success: true })
  } catch (err) {
    console.error('[Marketplace] Delete listing error:', err)
    res.status(500).json({ error: 'Failed to delete listing' })
  }
})

// ── POST /usage — Record marketplace asset usage for a project ──
router.post('/usage', requireAuth, async (req: Request, res: Response) => {
  try {
    const { projectId, listingIds } = req.body

    if (!projectId || !Array.isArray(listingIds) || listingIds.length === 0) {
      res.status(400).json({ error: 'Missing required fields: projectId, listingIds[]' })
      return
    }

    const supabase = getSupabaseAdmin()

    const rows = listingIds.map((listingId: string) => ({
      project_id: projectId,
      listing_id: listingId,
    }))

    const { error } = await supabase
      .from('project_marketplace_usage')
      .upsert(rows, { onConflict: 'project_id,listing_id' })

    if (error) {
      console.error('[Marketplace] Record usage error:', error)
      res.status(500).json({ error: 'Failed to record usage' })
      return
    }

    res.json({ success: true, recorded: listingIds.length })
  } catch (err) {
    console.error('[Marketplace] Record usage error:', err)
    res.status(500).json({ error: 'Failed to record usage' })
  }
})

// ── POST /royalties/distribute — Trigger royalty distribution ──
router.post('/royalties/distribute', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const { projectId, totalCreditsSpent } = req.body

    if (!projectId || typeof totalCreditsSpent !== 'number' || totalCreditsSpent <= 0) {
      res.status(400).json({ error: 'Missing required fields: projectId, totalCreditsSpent (>0)' })
      return
    }

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase.rpc('distribute_royalties', {
      p_consumer_id: userId,
      p_project_id: projectId,
      p_total_credits_spent: totalCreditsSpent,
    })

    if (error) {
      console.error('[Marketplace] Royalty distribution RPC error:', error)
      res.status(500).json({ error: 'Royalty distribution failed' })
      return
    }

    const result = data as {
      success: boolean
      royalty_pool: number
      creator_count: number
      distributions: Array<{ creator_id: string; listing_id: string; credits_granted: number }>
    }

    res.json(result)
  } catch (err) {
    console.error('[Marketplace] Royalty distribution error:', err)
    res.status(500).json({ error: 'Royalty distribution failed' })
  }
})

// ── GET /earnings — Creator's earnings summary (auth required) ──
router.get('/earnings', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()

    // Total credits earned
    const { data: royalties, error } = await supabase
      .from('creator_royalties')
      .select('credits_granted, created_at, listing_id')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Marketplace] Earnings query error:', error)
      res.status(500).json({ error: 'Failed to fetch earnings' })
      return
    }

    const totalEarned = (royalties ?? []).reduce((sum, r) => sum + r.credits_granted, 0)

    res.json({
      total_credits_earned: totalEarned,
      royalty_count: royalties?.length ?? 0,
      recent_royalties: (royalties ?? []).slice(0, 20),
    })
  } catch (err) {
    console.error('[Marketplace] Earnings error:', err)
    res.status(500).json({ error: 'Failed to fetch earnings' })
  }
})

// ── GET /my-listings — Creator's own listings (auth required) ──
router.get('/my-listings', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('marketplace_listings')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Marketplace] My listings query error:', error)
      res.status(500).json({ error: 'Failed to fetch your listings' })
      return
    }

    res.json({ listings: data ?? [] })
  } catch (err) {
    console.error('[Marketplace] My listings error:', err)
    res.status(500).json({ error: 'Failed to fetch your listings' })
  }
})

export default router
