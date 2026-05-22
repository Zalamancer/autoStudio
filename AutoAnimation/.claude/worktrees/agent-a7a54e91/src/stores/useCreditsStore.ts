import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { CreditBalance, CreditOperation } from '@/types/credits'
import { CREDIT_COSTS } from '@/types/credits'
import * as creditsService from '@/services/creditsService'

interface CreditsState {
  balance: CreditBalance | null
  isLoading: boolean
  showUpgradeModal: boolean
  upgradeReason: string

  // Actions
  fetchBalance: () => Promise<void>
  deductCredits: (op: CreditOperation) => Promise<boolean>
  refundCredits: (op: CreditOperation) => Promise<void>
  checkCanAfford: (op: CreditOperation) => boolean
  updateBalance: (newRemaining: number) => void
  showUpgrade: (reason: string) => void
  hideUpgrade: () => void
}

export const useCreditsStore = create<CreditsState>()(
  immer((set, get) => ({
    balance: null,
    isLoading: false,
    showUpgradeModal: false,
    upgradeReason: '',

    fetchBalance: async () => {
      set((s) => { s.isLoading = true })
      try {
        const data = await creditsService.fetchCreditBalance()
        set((s) => {
          s.balance = data
          s.isLoading = false
        })
      } catch {
        set((s) => { s.isLoading = false })
      }
    },

    deductCredits: async (op) => {
      try {
        const result = await creditsService.deductCredits(op)
        set((s) => {
          if (s.balance) {
            s.balance.credits_remaining = result.credits_remaining
          }
        })
        return true
      } catch (err: any) {
        if (err.status === 402) {
          get().showUpgrade(err.data?.message || 'Insufficient credits')
          return false
        }
        throw err
      }
    },

    refundCredits: async (op) => {
      try {
        const result = await creditsService.refundCredits(op)
        set((s) => {
          if (s.balance) {
            s.balance.credits_remaining = result.credits_remaining
          }
        })
      } catch (err) {
        console.error('[Credits] Refund failed:', err)
      }
    },

    checkCanAfford: (op) => {
      const bal = get().balance
      if (!bal) return false // Balance not loaded — don't allow spending
      return bal.credits_remaining >= CREDIT_COSTS[op]
    },

    updateBalance: (newRemaining) => {
      set((s) => {
        if (s.balance) {
          s.balance.credits_remaining = newRemaining
        }
      })
    },

    showUpgrade: (reason) => {
      set((s) => {
        s.showUpgradeModal = true
        s.upgradeReason = reason
      })
    },

    hideUpgrade: () => {
      set((s) => {
        s.showUpgradeModal = false
        s.upgradeReason = ''
      })
    },
  })),
)
