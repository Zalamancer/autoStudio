import { create } from 'zustand'
import type { OneClickApp, AppCategory, AppExecution } from '@/types/oneClickApp'
import {
  getAllApps,
  searchApps as searchAppsRegistry,
  buildPromptFromApp,
} from '@/services/oneClickAppRegistry'

interface OneClickAppState {
  apps: OneClickApp[]
  selectedApp: OneClickApp | null
  execution: AppExecution | null
  searchQuery: string
  activeCategory: AppCategory | 'all'
  recentApps: string[]

  selectApp: (app: OneClickApp | null) => void
  executeApp: (app: OneClickApp, inputs: Record<string, any>) => Promise<void>
  setCategory: (category: AppCategory | 'all') => void
  search: (query: string) => void
  clearExecution: () => void
  filteredApps: () => OneClickApp[]
}

const MAX_RECENT = 8

export const useOneClickAppStore = create<OneClickAppState>((set, get) => ({
  apps: getAllApps(),
  selectedApp: null,
  execution: null,
  searchQuery: '',
  activeCategory: 'all',
  recentApps: [],

  selectApp: (app) => set({ selectedApp: app }),

  executeApp: async (app, inputs) => {
    set({
      execution: {
        appId: app.id,
        inputs,
        status: 'running',
        progress: 0,
      },
    })

    // Add to recent apps
    set((state) => {
      const filtered = state.recentApps.filter((id) => id !== app.id)
      return { recentApps: [app.id, ...filtered].slice(0, MAX_RECENT) }
    })

    try {
      const prompt = buildPromptFromApp(app, inputs)

      // Dynamic import to avoid circular dependency
      const { useOrchestratorStore } = await import('@/stores/useOrchestratorStore')
      const orchestratorStore = useOrchestratorStore.getState()

      // Configure orchestrator settings from app config
      const config = app.orchestratorConfig
      if (config.aspectRatio) {
        orchestratorStore.updateSettings({ aspectRatio: config.aspectRatio as any })
      }
      if (config.duration) {
        orchestratorStore.updateSettings({ durationSeconds: config.duration })
      }
      if (config.fps) {
        orchestratorStore.updateSettings({ fps: config.fps })
      }
      if (config.enableMusic !== undefined) {
        orchestratorStore.updateSettings({ generateMusic: config.enableMusic })
      }
      if (config.enableStockMedia !== undefined) {
        orchestratorStore.updateSettings({ useStockMedia: config.enableStockMedia })
      }
      if (config.enableSvgObjects !== undefined) {
        orchestratorStore.updateSettings({ generateSVGAssets: config.enableSvgObjects })
      }

      // Set prompt and generate + execute plan
      orchestratorStore.setPrompt(prompt)
      await orchestratorStore.generatePlan()
      await orchestratorStore.executePlan()

      set({
        execution: {
          appId: app.id,
          inputs,
          status: 'completed',
          progress: 100,
        },
      })
    } catch (err: any) {
      set({
        execution: {
          appId: app.id,
          inputs,
          status: 'error',
          progress: 0,
          error: err?.message ?? 'App execution failed',
        },
      })
    }
  },

  setCategory: (category) => set({ activeCategory: category }),

  search: (query) => set({ searchQuery: query }),

  clearExecution: () => set({ execution: null }),

  filteredApps: () => {
    const { searchQuery, activeCategory, apps } = get()
    let result = searchQuery ? searchAppsRegistry(searchQuery) : apps
    if (activeCategory !== 'all') {
      result = result.filter((a) => a.category === activeCategory)
    }
    return result
  },
}))
