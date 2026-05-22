/**
 * Stripe SDK wrapper for subscription management and credit allocation.
 */

import Stripe from 'stripe'
import { getSupabaseAdmin } from '../middleware/supabaseAuth'

// ── Lazy Stripe init ──

let _stripe: Stripe | null = null

export function getStripeClient(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is required')
    _stripe = new Stripe(key, { apiVersion: '2025-01-27.acacia' as any })
  }
  return _stripe
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

// ── Plan configuration ──

export const PLAN_CREDITS: Record<string, number> = {
  free: 150,
  pro: 8500,
  business: 25000,
}

export const CREDIT_COSTS: Record<string, number> = {
  'elevenlabs-tts': 30,
  'elevenlabs-music': 50,
  'elevenlabs-sfx': 15,
  'gemini-script': 5,
  'orchestrator-plan': 12,
  'svg-object': 8,
  'vertex-sprite-sheet': 35,
  'vertex-emotion-heads': 40,
  'auto-rig-2d': 8,
  'meshy-text-to-3d': 30,
  'meshy-image-to-3d': 40,
  'meshy-auto-rig': 8,
  'hunyuan-motion': 20,
  'ai-video': 40,
  'whisper-transcript': 20,
  'recraft-vectorize': 5,
  'recraft-bg-remove': 5,
  'dubbing': 50,
  'nb2-generate': 10,
  'lottie-generate': 5,
  'gemini-rig-animation': 8,
  'photo-to-avatar': 30,
  'voice-clone': 25,
  'audio-isolation': 15,
  'content-split': 10,
  'image-to-video': 50,
  'music-generation': 30,
  'virality-score': 5,
  'pixellab-create-character': 25,
  'pixellab-animate': 20,
  'pixellab-generate-image': 15,
  'pixellab-edit-image': 10,
  'pixellab-tiles': 15,
  'api-render': 200,
}

// ── Customer management ──

export async function getOrCreateCustomer(userId: string, email: string): Promise<string> {
  const stripe = getStripeClient()

  // Check if user already has a subscription row with a customer ID
  const supabase = getSupabaseAdmin()
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single()

  if (sub?.stripe_customer_id) return sub.stripe_customer_id

  // Search Stripe by metadata
  const existing = await stripe.customers.list({ limit: 1, email })
  if (existing.data.length > 0) {
    const customerId = existing.data[0].id
    // Save to our subscriptions table
    await supabase
      .from('subscriptions')
      .upsert({ user_id: userId, stripe_customer_id: customerId, plan: 'free', status: 'active' }, { onConflict: 'user_id' })
    return customerId
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId },
  })

  await supabase
    .from('subscriptions')
    .upsert({ user_id: userId, stripe_customer_id: customer.id, plan: 'free', status: 'active' }, { onConflict: 'user_id' })

  return customer.id
}

// ── Credit initialization ──

export async function initializeUserCredits(userId: string, plan: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  const total = PLAN_CREDITS[plan] ?? 150

  await supabase
    .from('credit_balances')
    .upsert({
      user_id: userId,
      credits_remaining: total,
      credits_used_today: 0,
      last_daily_reset: new Date().toISOString().split('T')[0],
      plan_credits_total: total,
      period_credits_used: 0,
    }, { onConflict: 'user_id' })
}

// ── Webhook handlers ──

function planFromPriceId(priceId: string): string {
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro'
  if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID) return 'business'
  return 'free'
}

export async function handleCreditTopUp(session: Stripe.Checkout.Session): Promise<void> {
  const supabase = getSupabaseAdmin()
  const customerId = session.customer as string
  const creditsToAdd = parseInt(session.metadata?.credits ?? '0', 10)

  if (!creditsToAdd) return

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!sub) {
    console.error('[Stripe] Credit top-up: no user found for customer:', customerId)
    return
  }

  const { data: balance } = await supabase
    .from('credit_balances')
    .select('credits_remaining')
    .eq('user_id', sub.user_id)
    .single()

  const current = balance?.credits_remaining ?? 0

  await supabase
    .from('credit_balances')
    .update({ credits_remaining: current + creditsToAdd })
    .eq('user_id', sub.user_id)

  console.log(`[Stripe] Credit top-up: user=${sub.user_id} added=${creditsToAdd} total=${current + creditsToAdd}`)
}

export async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const supabase = getSupabaseAdmin()
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string

  if (!subscriptionId) return

  const stripe = getStripeClient()
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const priceId = subscription.items.data[0]?.price?.id ?? ''
  const plan = planFromPriceId(priceId)

  // Find user by customer ID
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!sub) {
    console.error('[Stripe] No user found for customer:', customerId)
    return
  }

  const userId = sub.user_id

  await supabase
    .from('subscriptions')
    .update({
      stripe_subscription_id: subscriptionId,
      plan,
      status: subscription.status === 'active' ? 'active' : subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  await initializeUserCredits(userId, plan)
  console.log(`[Stripe] Checkout completed: user=${userId} plan=${plan}`)
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const supabase = getSupabaseAdmin()
  const customerId = subscription.customer as string
  const priceId = subscription.items.data[0]?.price?.id ?? ''
  const plan = planFromPriceId(priceId)

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id, plan')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!sub) return

  const planChanged = sub.plan !== plan

  await supabase
    .from('subscriptions')
    .update({
      plan,
      status: subscription.status === 'active' ? 'active' : subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', sub.user_id)

  // Reset credits on plan change or period renewal
  if (planChanged) {
    await initializeUserCredits(sub.user_id, plan)
  }

  console.log(`[Stripe] Subscription updated: user=${sub.user_id} plan=${plan} status=${subscription.status}`)
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const supabase = getSupabaseAdmin()
  const customerId = subscription.customer as string

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!sub) return

  // Downgrade to free
  await supabase
    .from('subscriptions')
    .update({
      plan: 'free',
      status: 'canceled',
      stripe_subscription_id: null,
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', sub.user_id)

  await initializeUserCredits(sub.user_id, 'free')
  console.log(`[Stripe] Subscription deleted: user=${sub.user_id} → free tier`)
}

export async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const supabase = getSupabaseAdmin()
  const customerId = invoice.customer as string
  const subscriptionId = invoice.subscription as string

  if (!subscriptionId) return

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id, plan')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!sub) return

  // Reset credits for the new billing period
  await initializeUserCredits(sub.user_id, sub.plan)
  console.log(`[Stripe] Invoice paid: user=${sub.user_id} credits reset for ${sub.plan}`)
}

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const supabase = getSupabaseAdmin()
  const customerId = invoice.customer as string

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!sub) return

  await supabase
    .from('subscriptions')
    .update({ status: 'past_due', updated_at: new Date().toISOString() })
    .eq('user_id', sub.user_id)

  console.log(`[Stripe] Invoice payment failed: user=${sub.user_id}`)
}
