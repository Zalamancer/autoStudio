/**
 * Zustand store for API key management.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { ApiKeyInfo, ApiKeyUsageStats, CreateApiKeyResult } from '@/services/apiKeyService'
import {
  createApiKey as createApiKeyService,
  listApiKeys,
  revokeApiKey as revokeApiKeyService,
  getApiKeyUsage,
} from '@/services/apiKeyService'

interface ApiKeyState {
  keys: ApiKeyInfo[]
  usage: ApiKeyUsageStats[]
  isLoading: boolean
  error: string | null

  /** Temporarily holds the full key after creation (shown once) */
  newlyCreatedKey: CreateApiKeyResult | null

  // Actions
  fetchKeys: () => Promise<void>
  fetchUsage: () => Promise<void>
  createKey: (name: string) => Promise<CreateApiKeyResult | null>
  revokeKey: (keyId: string) => Promise<void>
  clearNewKey: () => void
  clearError: () => void
}

export const useApiKeyStore = create<ApiKeyState>()(
  immer((set) => ({
    keys: [],
    usage: [],
    isLoading: false,
    error: null,
    newlyCreatedKey: null,

    fetchKeys: async () => {
      set((state) => { state.isLoading = true; state.error = null })
      try {
        const keys = await listApiKeys()
        set((state) => { state.keys = keys; state.isLoading = false })
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Failed to fetch keys'
          state.isLoading = false
        })
      }
    },

    fetchUsage: async () => {
      try {
        const usage = await getApiKeyUsage()
        set((state) => { state.usage = usage })
      } catch (err) {
        console.warn('[ApiKeyStore] Failed to fetch usage:', err)
      }
    },

    createKey: async (name: string) => {
      set((state) => { state.isLoading = true; state.error = null })
      try {
        const result = await createApiKeyService(name)
        set((state) => {
          state.newlyCreatedKey = result
          state.keys.unshift({
            id: result.id,
            name: result.name,
            key_prefix: result.key_prefix,
            tier: 'standard',
            rate_limit_per_minute: 30,
            rate_limit_per_day: 1000,
            is_active: true,
            last_used_at: null,
            created_at: result.created_at,
          })
          state.isLoading = false
        })
        return result
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Failed to create key'
          state.isLoading = false
        })
        return null
      }
    },

    revokeKey: async (keyId: string) => {
      try {
        await revokeApiKeyService(keyId)
        set((state) => {
          const key = state.keys.find((k) => k.id === keyId)
          if (key) key.is_active = false
        })
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Failed to revoke key'
        })
      }
    },

    clearNewKey: () => set((state) => { state.newlyCreatedKey = null }),
    clearError: () => set((state) => { state.error = null }),
  }))
)
