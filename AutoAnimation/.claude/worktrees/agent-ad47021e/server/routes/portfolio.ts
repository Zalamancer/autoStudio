/**
 * Portfolio platform API routes.
 *
 * Handles public portfolio profiles, project publishing,
 * discovery/search, likes, follows, and embeddable player.
 */

import { Router, type Request, type Response } from 'express'
import { requireAuth, getSupabaseAdmin } from '../middleware/supabaseAuth'

const router = Router()

// ── GET /profile/me — Get own portfolio profile ──
router.get('/profile/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('portfolio_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      res.status(500).json({ error: 'Failed to fetch portfolio profile' })
      return
    }

    if (data) {
      res.json({ profile: data })
      return
    }

    // Create default profile
    const { data: newProfile, error: insertError } = await supabase
      .from('portfolio_profiles')
      .insert({
        user_id: userId,
        username: `user-${userId.slice(0, 8)}`,
        display_name: '',
        bio: '',
        avatar_url: null,
        social_links: {},
        theme: 'dark',
      })
      .select()
      .single()

    if (insertError) {
      console.error('[Portfolio] Insert profile error:', insertError)
      res.status(500).json({ error: 'Failed to create portfolio profile' })
      return
    }

    res.json({ profile: newProfile })
  } catch (err) {
    console.error('[Portfolio] Get profile error:', err)
    res.status(500).json({ error: 'Failed to fetch portfolio profile' })
  }
})

// ── PUT /profile/me — Update own profile ──
router.put('/profile/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()
    const { username, display_name, bio, avatar_url, social_links, theme } = req.body

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (username !== undefined) updates.username = username
    if (display_name !== undefined) updates.display_name = display_name
    if (bio !== undefined) updates.bio = bio
    if (avatar_url !== undefined) updates.avatar_url = avatar_url
    if (social_links !== undefined) updates.social_links = social_links
    if (theme !== undefined) updates.theme = theme

    const { data, error } = await supabase
      .from('portfolio_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      res.status(500).json({ error: 'Failed to update profile' })
      return
    }

    res.json({ profile: data })
  } catch (err) {
    console.error('[Portfolio] Update profile error:', err)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

// ── GET /profile/:username — Public profile by username ──
router.get('/profile/:username', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin()
    const { username } = req.params

    const { data, error } = await supabase
      .from('portfolio_profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle()

    if (error || !data) {
      res.status(404).json({ error: 'Profile not found' })
      return
    }

    res.json({ profile: data })
  } catch (err) {
    console.error('[Portfolio] Get public profile error:', err)
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

// ── POST /projects — Publish a project ──
router.post('/projects', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()
    const { title, description, video_url, thumbnail_url, duration, aspect_ratio, tags, category, status } = req.body

    const projectId = `pp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const embedUrl = `/embed/${projectId}`

    const { data, error } = await supabase
      .from('portfolio_projects')
      .insert({
        id: projectId,
        user_id: userId,
        title: title || 'Untitled',
        description: description || '',
        video_url,
        thumbnail_url: thumbnail_url || null,
        duration: duration || 0,
        aspect_ratio: aspect_ratio || '16:9',
        tags: tags || [],
        category: category || 'other',
        status: status || 'published',
        embed_url: embedUrl,
        view_count: 0,
        like_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('[Portfolio] Publish error:', error)
      res.status(500).json({ error: 'Failed to publish project' })
      return
    }

    res.json({ project: data })
  } catch (err) {
    console.error('[Portfolio] Publish error:', err)
    res.status(500).json({ error: 'Failed to publish project' })
  }
})

// ── GET /projects/mine — Get own published projects ──
router.get('/projects/mine', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('portfolio_projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      res.status(500).json({ error: 'Failed to fetch projects' })
      return
    }

    res.json({ projects: data || [] })
  } catch (err) {
    console.error('[Portfolio] Get my projects error:', err)
    res.status(500).json({ error: 'Failed to fetch projects' })
  }
})

// ── GET /projects/user/:userId — Get projects by user ──
router.get('/projects/user/:userId', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin()
    const { userId } = req.params

    const { data, error } = await supabase
      .from('portfolio_projects')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (error) {
      res.status(500).json({ error: 'Failed to fetch projects' })
      return
    }

    res.json({ projects: data || [] })
  } catch (err) {
    console.error('[Portfolio] Get user projects error:', err)
    res.status(500).json({ error: 'Failed to fetch projects' })
  }
})

// ── GET /discover — Browse/search published projects ──
router.get('/discover', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin()
    const {
      page = '1',
      limit = '20',
      sortBy = 'trending',
      timeRange = 'all',
      category,
      q,
      tags,
    } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const offset = (pageNum - 1) * limitNum

    let query = supabase
      .from('portfolio_projects')
      .select('*', { count: 'exact' })
      .eq('status', 'published')

    // Category filter
    if (category) {
      query = query.eq('category', category as string)
    }

    // Tag filter
    if (tags) {
      const tagList = (tags as string).split(',')
      query = query.overlaps('tags', tagList)
    }

    // Text search (simple ILIKE on title and description)
    if (q) {
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
    }

    // Time range filter
    if (timeRange && timeRange !== 'all') {
      const now = new Date()
      let since: Date
      switch (timeRange) {
        case 'week':
          since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'year':
          since = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        default:
          since = new Date(0)
      }
      query = query.gte('created_at', since.toISOString())
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      case 'most-viewed':
        query = query.order('view_count', { ascending: false })
        break
      case 'most-liked':
        query = query.order('like_count', { ascending: false })
        break
      case 'trending':
      default:
        // Trending = combination of recent + views
        query = query.order('view_count', { ascending: false })
        break
    }

    query = query.range(offset, offset + limitNum - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('[Portfolio] Discover error:', error)
      res.status(500).json({ error: 'Failed to fetch discovery' })
      return
    }

    res.json({
      projects: data || [],
      total: count || 0,
      hasMore: (count || 0) > offset + limitNum,
    })
  } catch (err) {
    console.error('[Portfolio] Discover error:', err)
    res.status(500).json({ error: 'Failed to fetch discovery' })
  }
})

// ── POST /projects/:id/like — Toggle like ──
router.post('/projects/:id/like', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()
    const { id } = req.params

    // Check if already liked
    const { data: existing } = await supabase
      .from('portfolio_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('project_id', id)
      .maybeSingle()

    if (existing) {
      // Unlike
      await supabase.from('portfolio_likes').delete().eq('id', existing.id)
      await supabase.rpc('decrement_like_count', { project_id: id })
      const { data: project } = await supabase
        .from('portfolio_projects')
        .select('like_count')
        .eq('id', id)
        .single()

      res.json({ isLiked: false, likeCount: project?.like_count || 0 })
    } else {
      // Like
      await supabase.from('portfolio_likes').insert({ user_id: userId, project_id: id })
      await supabase.rpc('increment_like_count', { project_id: id })
      const { data: project } = await supabase
        .from('portfolio_projects')
        .select('like_count')
        .eq('id', id)
        .single()

      res.json({ isLiked: true, likeCount: project?.like_count || 0 })
    }
  } catch (err) {
    console.error('[Portfolio] Like error:', err)
    res.status(500).json({ error: 'Failed to toggle like' })
  }
})

// ── POST /follow/:userId — Toggle follow ──
router.post('/follow/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const followerId = (req as any).userId
    const supabase = getSupabaseAdmin()
    const { userId: targetUserId } = req.params

    if (followerId === targetUserId) {
      res.status(400).json({ error: 'Cannot follow yourself' })
      return
    }

    const { data: existing } = await supabase
      .from('portfolio_follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', targetUserId)
      .maybeSingle()

    if (existing) {
      await supabase.from('portfolio_follows').delete().eq('id', existing.id)
      res.json({ isFollowing: false })
    } else {
      await supabase.from('portfolio_follows').insert({
        follower_id: followerId,
        following_id: targetUserId,
      })
      res.json({ isFollowing: true })
    }
  } catch (err) {
    console.error('[Portfolio] Follow error:', err)
    res.status(500).json({ error: 'Failed to toggle follow' })
  }
})

// ── GET /projects/:id/view — Increment view count ──
router.post('/projects/:id/view', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin()
    const { id } = req.params

    await supabase.rpc('increment_view_count', { project_id: id })
    res.json({ success: true })
  } catch (err) {
    console.error('[Portfolio] View count error:', err)
    res.status(500).json({ error: 'Failed to increment view' })
  }
})

export default router
