/**
 * Stripe checkout + billing portal routes.
 * Webhook handler is exported separately (needs raw body).
 */

import { Router, type Request, type Response } from 'express'
import type Stripe from 'stripe'
import { requireAuth } from '../middleware/supabaseAuth'
import {
  getStripeClient,
  getOrCreateCustomer,
  handleCheckoutCompleted,
  handleCreditTopUp,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
} from '../services/stripeService'

const router = Router()

// ── POST /create-checkout-session ──
router.post('/create-checkout-session', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const email = (req as any).userEmail
    const { priceId } = req.body

    if (!priceId) {
      res.status(400).json({ error: 'Missing priceId' })
      return
    }

    const customerId = await getOrCreateCustomer(userId, email)
    const stripe = getStripeClient()

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.origin || 'http://localhost:5173'}/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'http://localhost:5173'}/billing`,
      metadata: { supabase_user_id: userId },
    })

    res.json({ sessionUrl: session.url })
  } catch (err) {
    console.error('[Stripe] Checkout error:', err)
    res.status(500).json({ error: 'Failed to create checkout session' })
  }
})

// ── POST /create-portal-session ──
router.post('/create-portal-session', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const email = (req as any).userEmail

    const customerId = await getOrCreateCustomer(userId, email)
    const stripe = getStripeClient()

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.headers.origin || 'http://localhost:5173'}/billing`,
    })

    res.json({ portalUrl: session.url })
  } catch (err) {
    console.error('[Stripe] Portal error:', err)
    res.status(500).json({ error: 'Failed to create portal session' })
  }
})

// ── POST /credit-top-up — Purchase additional credits ──
router.post('/credit-top-up', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const email = (req as any).userEmail
    const { creditAmount, priceId } = req.body

    if (!creditAmount || !priceId) {
      res.status(400).json({ error: 'Missing creditAmount or priceId' })
      return
    }

    const customerId = await getOrCreateCustomer(userId, email)
    const stripe = getStripeClient()

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.origin || 'http://localhost:5173'}/billing?credit_top_up=success`,
      cancel_url: `${req.headers.origin || 'http://localhost:5173'}/billing`,
      metadata: { supabase_user_id: userId, credit_top_up: 'true', credit_amount: String(creditAmount) },
    })

    res.json({ sessionUrl: session.url })
  } catch (err) {
    console.error('[Stripe] Credit top-up error:', err)
    res.status(500).json({ error: 'Failed to create credit top-up session' })
  }
})

export default router

// ── Webhook handler (needs raw body — mounted separately in index.ts) ──
export async function stripeWebhookHandler(req: Request, res: Response) {
  const stripe = getStripeClient()
  const sig = req.headers['stripe-signature'] as string
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('[Stripe] STRIPE_WEBHOOK_SECRET not configured')
    res.status(500).json({ error: 'Webhook secret not configured' })
    return
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
  } catch (err) {
    console.error('[Stripe] Webhook signature verification failed:', err)
    res.status(400).json({ error: 'Invalid signature' })
    return
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.metadata?.credit_top_up === 'true') {
          await handleCreditTopUp(session)
        } else {
          await handleCheckoutCompleted(session)
        }
        break
      }
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
      default:
        // Unhandled event type — acknowledge it
        break
    }

    res.json({ received: true })
  } catch (err) {
    console.error('[Stripe] Webhook handler error:', err)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
}
