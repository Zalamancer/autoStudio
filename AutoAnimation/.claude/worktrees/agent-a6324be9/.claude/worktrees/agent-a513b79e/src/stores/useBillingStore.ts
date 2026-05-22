import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { SubscriptionInfo } from '@/types/credits'
import * as creditsService from '@/services/creditsService'

interface BillingState {
  subscription: SubscriptionInfo | null
  isLoading: boolean

  // Actions
  fetchSubscription: () => Promise<void>
  startCheckout: (priceId: string) => Promise<void>
  openPortal: () => Promise<void>
}

export const useBillingStore = create<BillingState>()(
  immer((set) => ({
    subscription: null,
    isLoading: false,

    fetchSubscription: async () => {
      set((s) => { s.isLoading = true })
      try {
        const data = await creditsService.fetchCreditBalance()
        set((s) => {
          s.subscription = {
            plan: data.plan,
            status: data.status,
            current_period_start: data.current_period_start,
            current_period_end: data.current_period_end,
            cancel_at_period_end: data.cancel_at_period_end,
          }
          s.isLoading = false
        })
      } catch {
        set((s) => { s.isLoading = false })
      }
    },

    startCheckout: async (priceId) => {
      set((s) => { s.isLoading = true })
      try {
        const { sessionUrl } = await creditsService.createCheckoutSession(priceId)
        if (sessionUrl) window.location.href = sessionUrl
      } catch {
        // Reset loading state — page stays on current view
      } finally {
        set((s) => { s.isLoading = false })
      }
    },

    openPortal: async () => {
      set((s) => { s.isLoading = true })
      try {
        const { portalUrl } = await creditsService.createPortalSession()
        if (portalUrl) window.location.href = portalUrl
      } catch {
        // Reset loading state — page stays on current view
      } finally {
        set((s) => { s.isLoading = false })
      }
    },
  })),
)
