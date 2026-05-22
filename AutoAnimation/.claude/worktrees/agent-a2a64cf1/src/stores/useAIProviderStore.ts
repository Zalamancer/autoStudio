import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AICapability, AIJobStatus, ProviderId } from '@/types/aiProviders'
import { getProviderStatus } from '@/services/aiProviderClient'

interface AIProviderState {
  // Provider status (fetched from /api/ai/status)
  configuredProviders: ProviderId[]
  statusFetchedAt: number | null

  // User preferences (persisted)
  defaults: Partial<Record<AICapability, string>>

  // Active generation jobs
  activeJobs: AIJobStatus[]

  // Currently selected capability tab
  activeCapability: AICapability

  // Currently selected model (per capability, ephemeral)
  selectedModel: Partial<Record<AICapability, string>>

  // Actions
  fetchStatus: () => Promise<void>
  setDefault: (cap: AICapability, modelId: string) => void
  setSelectedModel: (cap: AICapability, modelId: string) => void
  addJob: (job: AIJobStatus) => void
  updateJob: (jobId: string, update: Partial<AIJobStatus>) => void
  removeJob: (jobId: string) => void
  setActiveCapability: (cap: AICapability) => void
}

export const useAIProviderStore = create<AIProviderState>()(
  persist(
    (set) => ({
      configuredProviders: [],
      statusFetchedAt: null,
      defaults: {},
      activeJobs: [],
      activeCapability: 'text-to-image',
      selectedModel: {},

      fetchStatus: async () => {
        try {
          const status = await getProviderStatus()
          const configured = Object.entries(status)
            .filter(([, ok]) => ok)
            .map(([id]) => id as ProviderId)
          set({ configuredProviders: configured, statusFetchedAt: Date.now() })
        } catch (err) {
          console.error('[ai-provider] Failed to fetch status:', err)
        }
      },

      setDefault: (cap, modelId) => {
        set((s) => ({
          defaults: { ...s.defaults, [cap]: modelId },
        }))
      },

      setSelectedModel: (cap, modelId) => {
        set((s) => ({
          selectedModel: { ...s.selectedModel, [cap]: modelId },
        }))
      },

      addJob: (job) => {
        set((s) => ({ activeJobs: [job, ...s.activeJobs] }))
      },

      updateJob: (jobId, update) => {
        set((s) => ({
          activeJobs: s.activeJobs.map((j) =>
            j.id === jobId ? { ...j, ...update } : j
          ),
        }))
      },

      removeJob: (jobId) => {
        set((s) => ({
          activeJobs: s.activeJobs.filter((j) => j.id !== jobId),
        }))
      },

      setActiveCapability: (cap) => {
        set({ activeCapability: cap })
      },
    }),
    {
      name: 'proanimate-ai-providers',
      partialize: (state) => ({
        defaults: state.defaults,
        selectedModel: state.selectedModel,
      }),
    }
  )
)
