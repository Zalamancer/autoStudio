/**
 * Creator profile routes.
 * Users opt-in to be discoverable for promotion requests.
 */

import { Router, type Request, type Response } from 'express'
import { requireAuth, requireEnterprise, getSupabaseAdmin } from '../middleware/supabaseAuth'

const router = Router()

// ── GET /me — Get own creator profile (upsert if not exists) ──
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('creator_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      res.status(500).json({ error: 'Failed to fetch creator profile' })
      return
    }

    if (data) {
      res.json({ profile: data })
      return
    }

    // Create default profile
    const { data: newProfile, error: insertError } = await supabase
      .from('creator_profiles')
      .insert({
        user_id: userId,
        display_name: '',
        bio: '',
        niche_tags: [],
        opted_in: false,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[CreatorProfiles] Insert error:', insertError)
      res.status(500).json({ error: 'Failed to create creator profile' })
      return
    }

    res.json({ profile: newProfile })
  } catch (err) {
    console.error('[CreatorProfiles] Get me error:', err)
    res.status(500).json({ error: 'Failed to fetch creator profile' })
  }
})

// ── PUT /me — Update profile ──
router.put('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()
    const { display_name, bio, niche_tags, opted_in } = req.body

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (display_name !== undefined) updates.display_name = display_name
    if (bio !== undefined) updates.bio = bio
    if (niche_tags !== undefined) updates.niche_tags = niche_tags
    if (opted_in !== undefined) updates.opted_in = opted_in

    const { data, error } = await supabase
      .from('creator_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      // Profile might not exist yet — upsert
      const { data: upserted, error: upsertError } = await supabase
        .from('creator_profiles')
        .upsert({
          user_id: userId,
          display_name: display_name || '',
          bio: bio || '',
          niche_tags: niche_tags || [],
          opted_in: opted_in ?? false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select()
        .single()

      if (upsertError) {
        res.status(500).json({ error: 'Failed to update creator profile' })
        return
      }

      res.json({ profile: upserted })
      return
    }

    res.json({ profile: data })
  } catch (err) {
    console.error('[CreatorProfiles] Update error:', err)
    res.status(500).json({ error: 'Failed to update creator profile' })
  }
})

// ── POST /me/ai-suggest-tags — AI-suggested niche tags (placeholder) ──
router.post('/me/ai-suggest-tags', requireAuth, async (req: Request, res: Response) => {
  try {
    // Placeholder: return predefined suggestions
    // Future: use Gemini to analyze user's projects and suggest tags
    const suggestions = [
      'comedy',
      'education',
      'fitness',
      'food',
      'gaming',
      'lifestyle',
      'music',
      'tech',
      'travel',
      'beauty',
      'finance',
      'health',
      'fashion',
      'sports',
      'entertainment',
      'motivation',
      'art',
      'science',
      'news',
      'pets',
    ]

    res.json({ suggestions })
  } catch (err) {
    console.error('[CreatorProfiles] AI suggest error:', err)
    res.status(500).json({ error: 'Failed to generate tag suggestions' })
  }
})

// ── GET /browse — Browse opted-in creators (enterprise only) ──
router.get('/browse', requireAuth, requireEnterprise, async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin()
    const { niche_tags, page = '1', limit = '20' } = req.query
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string)

    let query = supabase
      .from('creator_profiles')
      .select('*', { count: 'exact' })
      .eq('opted_in', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit as string) - 1)

    if (niche_tags) {
      const tags = (niche_tags as string).split(',')
      query = query.overlaps('niche_tags', tags)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('[CreatorProfiles] Browse error:', error)
      res.status(500).json({ error: 'Failed to browse creators' })
      return
    }

    res.json({ creators: data, total: count })
  } catch (err) {
    console.error('[CreatorProfiles] Browse error:', err)
    res.status(500).json({ error: 'Failed to browse creators' })
  }
})

export default router
