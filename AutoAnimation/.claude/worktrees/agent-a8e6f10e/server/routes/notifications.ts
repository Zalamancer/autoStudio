/**
 * Notification routes.
 * In-app notifications for promotion matches, submission updates, etc.
 */

import { Router, type Request, type Response } from 'express'
import { requireAuth, getSupabaseAdmin } from '../middleware/supabaseAuth'

const router = Router()

// ── GET / — List notifications paginated, unread first ──
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()
    const { page = '1', limit = '20' } = req.query
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string)

    const { data, error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('read', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit as string) - 1)

    if (error) {
      // If table doesn't exist, return empty results
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('[Notifications] Table not yet created — returning empty')
        res.json({ notifications: [], total: 0 })
        return
      }
      console.error('[Notifications] List error:', error)
      res.status(500).json({ error: 'Failed to fetch notifications' })
      return
    }

    res.json({ notifications: data, total: count })
  } catch (err) {
    console.error('[Notifications] List error:', err)
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

// ── GET /unread-count — Return unread count ──
router.get('/unread-count', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('[Notifications] Table not yet created — returning 0')
        res.json({ count: 0 })
        return
      }
      console.error('[Notifications] Unread count error:', error)
      res.status(500).json({ error: 'Failed to get unread count' })
      return
    }

    res.json({ count: count || 0 })
  } catch (err) {
    console.error('[Notifications] Unread count error:', err)
    res.status(500).json({ error: 'Failed to get unread count' })
  }
})

// ── POST /:id/read — Mark single notification as read ──
router.post('/:id/read', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()
    const { id } = req.params

    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error || !data) {
      res.status(404).json({ error: 'Notification not found' })
      return
    }

    res.json({ notification: data })
  } catch (err) {
    console.error('[Notifications] Mark read error:', err)
    res.status(500).json({ error: 'Failed to mark notification as read' })
  }
})

// ── POST /mark-all-read — Mark all notifications as read ──
router.post('/mark-all-read', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) {
      console.error('[Notifications] Mark all read error:', error)
      res.status(500).json({ error: 'Failed to mark all as read' })
      return
    }

    res.json({ success: true })
  } catch (err) {
    console.error('[Notifications] Mark all read error:', err)
    res.status(500).json({ error: 'Failed to mark all as read' })
  }
})

export default router
