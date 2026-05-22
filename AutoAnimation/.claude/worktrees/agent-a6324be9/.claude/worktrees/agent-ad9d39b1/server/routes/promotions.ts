/**
 * Promotion request marketplace routes.
 * Enterprise users create requests, opted-in creators submit work.
 */

import { Router, type Request, type Response } from 'express'
import { requireAuth, requireEnterprise, requireOptedIn, getSupabaseAdmin } from '../middleware/supabaseAuth'

const router = Router()

// ── POST /requests — Create a promotion request + escrow credits + auto-notify ──
router.post('/requests', requireAuth, requireEnterprise, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()
    const {
      title,
      description,
      niche_tags,
      credit_reward,
      max_submissions,
      deadline,
      requirements,
    } = req.body

    if (!title || !description || !credit_reward) {
      res.status(400).json({ error: 'Missing required fields: title, description, credit_reward' })
      return
    }

    // Escrow credits from the enterprise user
    const { error: escrowError } = await supabase.rpc('escrow_credits', {
      p_user_id: userId,
      p_amount: credit_reward * (max_submissions || 1),
      p_operation: 'promo-request-escrow',
      p_description: `Escrow for promotion: ${title}`,
    })

    if (escrowError) {
      console.error('[Promotions] Escrow failed:', escrowError)
      res.status(400).json({ error: escrowError.message || 'Insufficient credits for escrow' })
      return
    }

    // Create the promotion request
    const { data: request, error: insertError } = await supabase
      .from('promotion_requests')
      .insert({
        user_id: userId,
        title,
        description,
        niche_tags: niche_tags || [],
        credit_reward,
        max_submissions: max_submissions || 10,
        deadline,
        requirements,
        status: 'open',
      })
      .select()
      .single()

    if (insertError) {
      console.error('[Promotions] Insert failed:', insertError)
      res.status(500).json({ error: 'Failed to create promotion request' })
      return
    }

    // Auto-notify matching creators
    if (niche_tags && niche_tags.length > 0) {
      const { data: matchingCreators } = await supabase
        .from('creator_profiles')
        .select('user_id')
        .eq('opted_in', true)
        .overlaps('niche_tags', niche_tags)

      if (matchingCreators && matchingCreators.length > 0) {
        const notifications = matchingCreators
          .filter((c: any) => c.user_id !== userId)
          .map((c: any) => ({
            user_id: c.user_id,
            type: 'promo_request_match',
            title: `New promotion request: ${title}`,
            body: description.substring(0, 200),
            metadata: { request_id: request.id },
          }))

        if (notifications.length > 0) {
          await supabase.from('notifications').insert(notifications)
        }
      }
    }

    res.status(201).json({ request })
  } catch (err) {
    console.error('[Promotions] Create request error:', err)
    res.status(500).json({ error: 'Failed to create promotion request' })
  }
})

// ── GET /requests — List open requests ──
router.get('/requests', requireAuth, async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin()
    const { niche_tags, search, page = '1', limit = '20' } = req.query
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string)

    let query = supabase
      .from('promotion_requests')
      .select('*, submissions:promotion_submissions(count)', { count: 'exact' })
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit as string) - 1)

    if (niche_tags) {
      const tags = (niche_tags as string).split(',')
      query = query.overlaps('niche_tags', tags)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('[Promotions] List error:', error)
      res.status(500).json({ error: 'Failed to fetch requests' })
      return
    }

    res.json({ requests: data, total: count })
  } catch (err) {
    console.error('[Promotions] List error:', err)
    res.status(500).json({ error: 'Failed to fetch requests' })
  }
})

// ── GET /requests/:id — Request detail ──
router.get('/requests/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin()
    const { id } = req.params

    const { data, error } = await supabase
      .from('promotion_requests')
      .select('*, submissions:promotion_submissions(count)')
      .eq('id', id)
      .single()

    if (error || !data) {
      res.status(404).json({ error: 'Request not found' })
      return
    }

    res.json({ request: data })
  } catch (err) {
    console.error('[Promotions] Detail error:', err)
    res.status(500).json({ error: 'Failed to fetch request' })
  }
})

// ── PATCH /requests/:id — Edit request (owner only, before deadline) ──
router.patch('/requests/:id', requireAuth, requireEnterprise, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()
    const { id } = req.params
    const { title, description, niche_tags, requirements, deadline } = req.body

    // Verify ownership
    const { data: existing } = await supabase
      .from('promotion_requests')
      .select('user_id, status, deadline')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== userId) {
      res.status(403).json({ error: 'Not authorized to edit this request' })
      return
    }

    if (existing.status !== 'open') {
      res.status(400).json({ error: 'Can only edit open requests' })
      return
    }

    if (existing.deadline && new Date(existing.deadline) < new Date()) {
      res.status(400).json({ error: 'Cannot edit past deadline' })
      return
    }

    const updates: Record<string, any> = {}
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (niche_tags !== undefined) updates.niche_tags = niche_tags
    if (requirements !== undefined) updates.requirements = requirements
    if (deadline !== undefined) updates.deadline = deadline
    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('promotion_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      res.status(500).json({ error: 'Failed to update request' })
      return
    }

    res.json({ request: data })
  } catch (err) {
    console.error('[Promotions] Edit error:', err)
    res.status(500).json({ error: 'Failed to update request' })
  }
})

// ── POST /requests/:id/cancel — Cancel + refund escrow ──
router.post('/requests/:id/cancel', requireAuth, requireEnterprise, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()
    const { id } = req.params

    // Verify ownership
    const { data: existing } = await supabase
      .from('promotion_requests')
      .select('user_id, status, credit_reward, max_submissions')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== userId) {
      res.status(403).json({ error: 'Not authorized to cancel this request' })
      return
    }

    if (existing.status !== 'open') {
      res.status(400).json({ error: 'Can only cancel open requests' })
      return
    }

    // Count approved submissions to calculate already-spent credits
    const { count: approvedCount } = await supabase
      .from('promotion_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('request_id', id)
      .eq('status', 'approved')

    const totalEscrowed = existing.credit_reward * existing.max_submissions
    const spent = existing.credit_reward * (approvedCount || 0)
    const refundAmount = totalEscrowed - spent

    // Refund remaining escrow
    if (refundAmount > 0) {
      await supabase.rpc('refund_credits', {
        p_user_id: userId,
        p_amount: refundAmount,
        p_operation: 'promo-request-cancel-refund',
        p_description: `Refund for cancelled promotion: ${id}`,
      })
    }

    // Update status
    await supabase
      .from('promotion_requests')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)

    res.json({ refunded: refundAmount })
  } catch (err) {
    console.error('[Promotions] Cancel error:', err)
    res.status(500).json({ error: 'Failed to cancel request' })
  }
})

// ── POST /requests/:id/complete — Complete + refund remainder ──
router.post('/requests/:id/complete', requireAuth, requireEnterprise, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()
    const { id } = req.params

    const { data: existing } = await supabase
      .from('promotion_requests')
      .select('user_id, status, credit_reward, max_submissions')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== userId) {
      res.status(403).json({ error: 'Not authorized to complete this request' })
      return
    }

    if (existing.status !== 'open') {
      res.status(400).json({ error: 'Can only complete open requests' })
      return
    }

    // Count approved submissions
    const { count: approvedCount } = await supabase
      .from('promotion_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('request_id', id)
      .eq('status', 'approved')

    const totalEscrowed = existing.credit_reward * existing.max_submissions
    const spent = existing.credit_reward * (approvedCount || 0)
    const refundAmount = totalEscrowed - spent

    if (refundAmount > 0) {
      await supabase.rpc('refund_credits', {
        p_user_id: userId,
        p_amount: refundAmount,
        p_operation: 'promo-request-complete-refund',
        p_description: `Remainder refund for completed promotion: ${id}`,
      })
    }

    await supabase
      .from('promotion_requests')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', id)

    res.json({ refunded: refundAmount })
  } catch (err) {
    console.error('[Promotions] Complete error:', err)
    res.status(500).json({ error: 'Failed to complete request' })
  }
})

// ── GET /requests/:id/submissions — List submissions (owner only) ──
router.get('/requests/:id/submissions', requireAuth, requireEnterprise, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()
    const { id } = req.params

    // Verify ownership
    const { data: request } = await supabase
      .from('promotion_requests')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!request || request.user_id !== userId) {
      res.status(403).json({ error: 'Not authorized to view submissions' })
      return
    }

    const { data, error } = await supabase
      .from('promotion_submissions')
      .select('*')
      .eq('request_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      res.status(500).json({ error: 'Failed to fetch submissions' })
      return
    }

    res.json({ submissions: data })
  } catch (err) {
    console.error('[Promotions] List submissions error:', err)
    res.status(500).json({ error: 'Failed to fetch submissions' })
  }
})

// ── POST /requests/:id/submissions — Submit work ──
router.post('/requests/:id/submissions', requireAuth, requireOptedIn, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()
    const { id } = req.params
    const { content_url, notes, metadata } = req.body

    if (!content_url) {
      res.status(400).json({ error: 'Missing required field: content_url' })
      return
    }

    // Check request exists and is open
    const { data: request } = await supabase
      .from('promotion_requests')
      .select('status, max_submissions, user_id')
      .eq('id', id)
      .single()

    if (!request) {
      res.status(404).json({ error: 'Request not found' })
      return
    }

    if (request.status !== 'open') {
      res.status(400).json({ error: 'Request is no longer accepting submissions' })
      return
    }

    if (request.user_id === userId) {
      res.status(400).json({ error: 'Cannot submit to your own request' })
      return
    }

    // Check max submissions not exceeded
    const { count } = await supabase
      .from('promotion_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('request_id', id)
      .neq('status', 'withdrawn')

    if (count !== null && count >= request.max_submissions) {
      res.status(400).json({ error: 'Maximum submissions reached' })
      return
    }

    // Check user hasn't already submitted
    const { data: existingSub } = await supabase
      .from('promotion_submissions')
      .select('id')
      .eq('request_id', id)
      .eq('user_id', userId)
      .neq('status', 'withdrawn')
      .maybeSingle()

    if (existingSub) {
      res.status(400).json({ error: 'You have already submitted to this request' })
      return
    }

    const { data, error } = await supabase
      .from('promotion_submissions')
      .insert({
        request_id: id,
        user_id: userId,
        content_url,
        notes,
        metadata: metadata || {},
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('[Promotions] Submit error:', error)
      res.status(500).json({ error: 'Failed to create submission' })
      return
    }

    // Notify the request owner
    await supabase.from('notifications').insert({
      user_id: request.user_id,
      type: 'promo_submission_received',
      title: 'New submission received',
      body: `A creator submitted work for your promotion request`,
      metadata: { request_id: id, submission_id: data.id },
    })

    res.status(201).json({ submission: data })
  } catch (err) {
    console.error('[Promotions] Submit error:', err)
    res.status(500).json({ error: 'Failed to create submission' })
  }
})

// ── PATCH /submissions/:id/withdraw — Withdraw own submission ──
router.patch('/submissions/:id/withdraw', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()
    const { id } = req.params

    const { data: submission } = await supabase
      .from('promotion_submissions')
      .select('user_id, status')
      .eq('id', id)
      .single()

    if (!submission || submission.user_id !== userId) {
      res.status(403).json({ error: 'Not authorized to withdraw this submission' })
      return
    }

    if (submission.status !== 'pending') {
      res.status(400).json({ error: 'Can only withdraw pending submissions' })
      return
    }

    const { data, error } = await supabase
      .from('promotion_submissions')
      .update({ status: 'withdrawn', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      res.status(500).json({ error: 'Failed to withdraw submission' })
      return
    }

    res.json({ submission: data })
  } catch (err) {
    console.error('[Promotions] Withdraw error:', err)
    res.status(500).json({ error: 'Failed to withdraw submission' })
  }
})

// ── POST /submissions/:id/approve — Approve + award credits ──
router.post('/submissions/:id/approve', requireAuth, requireEnterprise, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()
    const { id } = req.params

    // Get submission + request info
    const { data: submission } = await supabase
      .from('promotion_submissions')
      .select('*, request:promotion_requests(*)')
      .eq('id', id)
      .single()

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' })
      return
    }

    if (submission.request.user_id !== userId) {
      res.status(403).json({ error: 'Not authorized to approve this submission' })
      return
    }

    if (submission.status !== 'pending') {
      res.status(400).json({ error: 'Can only approve pending submissions' })
      return
    }

    // Award credits to the creator
    const { error: awardError } = await supabase.rpc('refund_credits', {
      p_user_id: submission.user_id,
      p_amount: submission.request.credit_reward,
      p_operation: 'promo-submission-approved',
      p_description: `Reward for approved promotion submission: ${submission.request.title}`,
    })

    if (awardError) {
      console.error('[Promotions] Award credits error:', awardError)
      res.status(500).json({ error: 'Failed to award credits' })
      return
    }

    // Update submission status
    await supabase
      .from('promotion_submissions')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', id)

    // Notify the creator
    await supabase.from('notifications').insert({
      user_id: submission.user_id,
      type: 'promo_submission_approved',
      title: 'Submission approved!',
      body: `Your submission was approved. You earned ${submission.request.credit_reward} credits!`,
      metadata: { request_id: submission.request_id, submission_id: id, credits: submission.request.credit_reward },
    })

    res.json({ approved: true, credits_awarded: submission.request.credit_reward })
  } catch (err) {
    console.error('[Promotions] Approve error:', err)
    res.status(500).json({ error: 'Failed to approve submission' })
  }
})

// ── POST /submissions/:id/reject — Reject with feedback ──
router.post('/submissions/:id/reject', requireAuth, requireEnterprise, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()
    const { id } = req.params
    const { feedback } = req.body

    const { data: submission } = await supabase
      .from('promotion_submissions')
      .select('*, request:promotion_requests(*)')
      .eq('id', id)
      .single()

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' })
      return
    }

    if (submission.request.user_id !== userId) {
      res.status(403).json({ error: 'Not authorized to reject this submission' })
      return
    }

    if (submission.status !== 'pending') {
      res.status(400).json({ error: 'Can only reject pending submissions' })
      return
    }

    await supabase
      .from('promotion_submissions')
      .update({
        status: 'rejected',
        feedback: feedback || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    // Notify the creator
    await supabase.from('notifications').insert({
      user_id: submission.user_id,
      type: 'promo_submission_rejected',
      title: 'Submission not accepted',
      body: feedback
        ? `Your submission was not accepted. Feedback: ${feedback.substring(0, 200)}`
        : 'Your submission was not accepted.',
      metadata: { request_id: submission.request_id, submission_id: id },
    })

    res.json({ rejected: true })
  } catch (err) {
    console.error('[Promotions] Reject error:', err)
    res.status(500).json({ error: 'Failed to reject submission' })
  }
})

// ── GET /my-submissions — Creator's own submissions ──
router.get('/my-submissions', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('promotion_submissions')
      .select('*, request:promotion_requests(id, title, credit_reward, status)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      res.status(500).json({ error: 'Failed to fetch submissions' })
      return
    }

    res.json({ submissions: data })
  } catch (err) {
    console.error('[Promotions] My submissions error:', err)
    res.status(500).json({ error: 'Failed to fetch submissions' })
  }
})

export default router
