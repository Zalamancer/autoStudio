/**
 * Credit balance + deduction/refund routes.
 */

import { Router, type Request, type Response } from 'express'
import { requireAuth, getSupabaseAdmin } from '../middleware/supabaseAuth'
import { CREDIT_COSTS } from '../services/stripeService'

const router = Router()

// ── GET /balance ──
router.get('/balance', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const supabase = getSupabaseAdmin()

    // Fetch balance + subscription in parallel
    const [balanceResult, subResult] = await Promise.all([
      supabase.from('credit_balances').select('*').eq('user_id', userId).single(),
      supabase.from('subscriptions').select('*').eq('user_id', userId).single(),
    ])

    // If tables don't exist yet, return sensible defaults
    const tablesMissing = [balanceResult.error, subResult.error].some(
      (e) => e?.code === '42P01' || e?.message?.includes('does not exist'),
    )
    if (tablesMissing) {
      console.warn('[Credits] Tables not yet created — returning defaults')
      res.json({
        credits_remaining: 150,
        credits_used_today: 0,
        plan_credits_total: 150,
        period_credits_used: 0,
        last_daily_reset: null,
        plan: 'free',
        status: 'active',
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
      })
      return
    }

    // Auto-create rows for new users
    if (!balanceResult.data) {
      await supabase.from('credit_balances').upsert({
        user_id: userId,
        credits_remaining: 150,
        credits_used_today: 0,
        last_daily_reset: new Date().toISOString().split('T')[0],
        plan_credits_total: 150,
        period_credits_used: 0,
      }, { onConflict: 'user_id' })
    }
    if (!subResult.data) {
      await supabase.from('subscriptions').upsert({
        user_id: userId,
        plan: 'free',
        status: 'active',
      }, { onConflict: 'user_id' })
    }

    // Re-fetch if we just created
    const balance = balanceResult.data ?? (await supabase.from('credit_balances').select('*').eq('user_id', userId).single()).data
    const subscription = subResult.data ?? (await supabase.from('subscriptions').select('*').eq('user_id', userId).single()).data

    res.json({
      credits_remaining: balance?.credits_remaining ?? 150,
      credits_used_today: balance?.credits_used_today ?? 0,
      plan_credits_total: balance?.plan_credits_total ?? 150,
      period_credits_used: balance?.period_credits_used ?? 0,
      last_daily_reset: balance?.last_daily_reset,
      plan: subscription?.plan ?? 'free',
      status: subscription?.status ?? 'active',
      current_period_start: subscription?.current_period_start,
      current_period_end: subscription?.current_period_end,
      cancel_at_period_end: subscription?.cancel_at_period_end ?? false,
    })
  } catch (err: any) {
    // If tables don't exist yet, return sensible defaults instead of 500
    const msg = err?.message || err?.details || ''
    if (msg.includes('relation') && msg.includes('does not exist') || err?.code === '42P01') {
      console.warn('[Credits] Tables not yet created — returning defaults')
      res.json({
        credits_remaining: 150,
        credits_used_today: 0,
        plan_credits_total: 150,
        period_credits_used: 0,
        last_daily_reset: null,
        plan: 'free',
        status: 'active',
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
      })
      return
    }
    console.error('[Credits] Balance fetch error:', err)
    res.status(500).json({ error: 'Failed to fetch credit balance' })
  }
})

// ── POST /deduct ──
router.post('/deduct', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const { operation } = req.body

    if (!operation || !CREDIT_COSTS[operation]) {
      res.status(400).json({ error: `Unknown operation: ${operation}` })
      return
    }

    const cost = CREDIT_COSTS[operation]
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase.rpc('deduct_credits', {
      p_user_id: userId,
      p_amount: cost,
      p_operation: operation,
      p_description: `${operation} (${cost} credits)`,
    })

    if (error) {
      // If RPC function or tables don't exist yet, skip deduction gracefully
      if (error.code === '42P01' || error.code === '42883' || error.message?.includes('does not exist')) {
        console.warn('[Credits] Tables/functions not yet created — skipping deduction')
        res.json({ success: true, credits_remaining: 150, credits_deducted: 0 })
        return
      }
      console.error('[Credits] Deduction RPC error:', error)
      res.status(500).json({ error: 'Credit deduction failed' })
      return
    }

    const result = data as { success: boolean; new_balance: number; error_message?: string }

    if (!result.success) {
      res.status(402).json({
        error: 'insufficient_credits',
        message: result.error_message,
        credits_remaining: result.new_balance,
        credits_required: cost,
      })
      return
    }

    res.json({
      success: true,
      credits_remaining: result.new_balance,
      credits_deducted: cost,
    })
  } catch (err: any) {
    const msg = err?.message || err?.details || ''
    if (msg.includes('relation') && msg.includes('does not exist') || err?.code === '42P01' || msg.includes('function') && msg.includes('does not exist') || err?.code === '42883') {
      console.warn('[Credits] Tables/functions not yet created — skipping deduction')
      res.json({ success: true, credits_remaining: 150, credits_deducted: 0 })
      return
    }
    console.error('[Credits] Deduction error:', err)
    res.status(500).json({ error: 'Credit deduction failed' })
  }
})

// ── POST /refund ──
router.post('/refund', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const { operation } = req.body

    if (!operation || !CREDIT_COSTS[operation]) {
      res.status(400).json({ error: `Unknown operation: ${operation}` })
      return
    }

    const cost = CREDIT_COSTS[operation]
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase.rpc('refund_credits', {
      p_user_id: userId,
      p_amount: cost,
      p_operation: operation,
    })

    if (error) {
      if (error.code === '42P01' || error.code === '42883' || error.message?.includes('does not exist')) {
        console.warn('[Credits] Tables/functions not yet created — skipping refund')
        res.json({ success: true, credits_remaining: 150, credits_refunded: 0 })
        return
      }
      console.error('[Credits] Refund RPC error:', error)
      res.status(500).json({ error: 'Credit refund failed' })
      return
    }

    const result = data as { success: boolean; new_balance: number }

    res.json({
      success: result.success,
      credits_remaining: result.new_balance,
      credits_refunded: cost,
    })
  } catch (err: any) {
    const msg = err?.message || err?.details || ''
    if (msg.includes('relation') && msg.includes('does not exist') || err?.code === '42P01' || msg.includes('function') && msg.includes('does not exist') || err?.code === '42883') {
      console.warn('[Credits] Tables/functions not yet created — skipping refund')
      res.json({ success: true, credits_remaining: 150, credits_refunded: 0 })
      return
    }
    console.error('[Credits] Refund error:', err)
    res.status(500).json({ error: 'Credit refund failed' })
  }
})

export default router
