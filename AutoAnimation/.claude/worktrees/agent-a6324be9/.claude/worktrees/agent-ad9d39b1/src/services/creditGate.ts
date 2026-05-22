/**
 * Credit gating wrapper for AI operations.
 *
 * Usage:
 *   const result = await withCreditGate('elevenlabs-tts', async () => {
 *     return generateWithAlignment(text, voiceId)
 *   })
 */

import type { CreditOperation } from '@/types/credits'
import { CREDIT_COSTS } from '@/types/credits'
import { useCreditsStore } from '@/stores/useCreditsStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { deductCredits, refundCredits } from './creditsService'

export class InsufficientCreditsError extends Error {
  constructor(
    public readonly operation: CreditOperation,
    public readonly required: number,
    public readonly remaining: number,
  ) {
    super(`Insufficient credits for ${operation}: need ${required}, have ${remaining}`)
    this.name = 'InsufficientCreditsError'
  }
}

/**
 * Wraps an AI operation with credit deduction and auto-refund.
 * 1. Optimistic local balance check
 * 2. Server-side deduction
 * 3. Run the action
 * 4. On action failure → auto-refund
 * 5. On insufficient credits → show upgrade modal
 */
export async function withCreditGate<T>(
  operation: CreditOperation,
  action: () => Promise<T>,
): Promise<T> {
  const store = useCreditsStore.getState()
  const cost = CREDIT_COSTS[operation]

  // 0. Skip credit gating if user is not authenticated
  const session = useAuthStore.getState().session
  if (!session?.access_token) {
    console.warn('[CreditGate] User not authenticated — skipping credit check')
    return action()
  }

  // 1. Optimistic local check
  if (!store.checkCanAfford(operation)) {
    store.showUpgrade(`You need ${cost} credits for this operation but only have ${store.balance?.credits_remaining ?? 0} remaining.`)
    throw new InsufficientCreditsError(operation, cost, store.balance?.credits_remaining ?? 0)
  }

  // 2. Server-side deduction
  let deductResult: Awaited<ReturnType<typeof deductCredits>> | null = null
  let creditSystemAvailable = true
  try {
    deductResult = await deductCredits(operation)
  } catch (err: any) {
    if (err.status === 402) {
      store.showUpgrade(err.data?.message || `Insufficient credits for ${operation}`)
      throw new InsufficientCreditsError(operation, cost, err.data?.credits_remaining ?? 0)
    }
    // If the credits backend is unavailable (500, network error), skip gating
    if (err.status === 500 || err.status === 503 || !err.status) {
      console.warn('[CreditGate] Credits backend unavailable — proceeding without deduction')
      creditSystemAvailable = false
    } else {
      throw err
    }
  }

  // Update local balance optimistically
  if (deductResult) {
    store.updateBalance(deductResult.credits_remaining)
  }

  // 3. Run the action
  try {
    return await action()
  } catch (actionErr) {
    // 4. Auto-refund on action failure (only if we actually deducted)
    if (creditSystemAvailable && deductResult) {
      try {
        const refundResult = await refundCredits(operation)
        store.updateBalance(refundResult.credits_remaining)
      } catch (refundErr) {
        console.error('[CreditGate] Refund failed:', refundErr)
      }
    }
    throw actionErr
  }
}
