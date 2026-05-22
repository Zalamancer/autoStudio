/**
 * Frontend API client for the credit & billing system.
 * Calls /api/credits/* and /api/stripe/* endpoints on the backend.
 */

import type { CreditBalance, CreditOperation } from '@/types/credits'
import { useAuthStore } from '@/stores/useAuthStore'

// ── Helpers ──

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().session?.access_token
  if (!token) {
    const err: any = new Error('Not authenticated')
    err.status = 401
    throw err
  }
  const resp = await fetch(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  // Silently handle expired/stale tokens
  if (resp.status === 401) {
    const err: any = new Error('Authentication expired')
    err.status = 401
    throw err
  }
  let data: any
  try {
    data = await resp.json()
  } catch {
    if (!resp.ok) {
      const err: any = new Error(`Request failed (${resp.status})`)
      err.status = resp.status
      err.data = null
      throw err
    }
    throw new Error(`Invalid JSON response from ${path}`)
  }
  if (!resp.ok) {
    const err: any = new Error(data.error || data.message || `Request failed (${resp.status})`)
    err.status = resp.status
    err.data = data
    throw err
  }
  return data
}

// ── Credit Balance ──

export async function fetchCreditBalance(): Promise<CreditBalance> {
  // Skip API call if not authenticated — avoids 401 errors
  const { session, user } = useAuthStore.getState()
  if (!user || !session?.access_token) {
    return {
      credits_remaining: 0,
      credits_used_today: 0,
      plan_credits_total: 0,
      period_credits_used: 0,
      last_daily_reset: null,
      plan: 'free',
      status: 'active',
      current_period_start: null,
      current_period_end: null,
      cancel_at_period_end: false,
    } satisfies CreditBalance
  }
  return apiRequest<CreditBalance>('/api/credits/balance')
}

// ── Credit Deduction ──

export interface DeductResult {
  success: boolean
  credits_remaining: number
  credits_deducted: number
}

export async function deductCredits(operation: CreditOperation): Promise<DeductResult> {
  return apiRequest<DeductResult>('/api/credits/deduct', {
    method: 'POST',
    body: JSON.stringify({ operation }),
  })
}

// ── Credit Refund ──

export interface RefundResult {
  success: boolean
  credits_remaining: number
  credits_refunded: number
}

export async function refundCredits(operation: CreditOperation): Promise<RefundResult> {
  return apiRequest<RefundResult>('/api/credits/refund', {
    method: 'POST',
    body: JSON.stringify({ operation }),
  })
}

// ── Stripe Checkout ──

export async function createCheckoutSession(priceId: string): Promise<{ sessionUrl: string }> {
  return apiRequest<{ sessionUrl: string }>('/api/stripe/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify({ priceId }),
  })
}

// ── Stripe Portal ──

export async function createPortalSession(): Promise<{ portalUrl: string }> {
  return apiRequest<{ portalUrl: string }>('/api/stripe/create-portal-session', {
    method: 'POST',
  })
}
