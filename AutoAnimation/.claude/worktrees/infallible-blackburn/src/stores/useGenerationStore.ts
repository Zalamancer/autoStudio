import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Types ────────────────────────────────────────────────────────────

export type PromptMode = 'reference' | 'direction' | 'freeform'
export type VisualDensity = 'sparse' | 'balanced' | 'dense'
export type AnimationSpeed = 'snappy' | 'standard' | 'cinematic'
export type TextRole = 'text-is-effect' | 'text-in-scene'
export type TextCount = 'single' | 'multi-block'

export interface GenerationConfig {
  promptMode: PromptMode
  concept: string
  visualDensity: VisualDensity
  animationSpeed: AnimationSpeed
  textRole: TextRole
  textCount: TextCount
}

export interface GenerationResult {
  id: string
  filename: string
  predictedScore: number
}

// ── Store ────────────────────────────────────────────────────────────

interface GenerationState {
  config: GenerationConfig
  generating: boolean
  lastResults: GenerationResult[]
  lastRoundLabel: string | null
  error: string | null

  setConfig: <K extends keyof GenerationConfig>(key: K, value: GenerationConfig[K]) => void
  generate: () => Promise<void>
}

const DEFAULT_CONFIG: GenerationConfig = {
  promptMode: 'direction',
  concept: '',
  visualDensity: 'balanced',
  animationSpeed: 'standard',
  textRole: 'text-is-effect',
  textCount: 'single',
}

export const useGenerationStore = create<GenerationState>()(
  persist(
    (set, get) => ({
      config: { ...DEFAULT_CONFIG },
      generating: false,
      lastResults: [],
      lastRoundLabel: null,
      error: null,

      setConfig: (key, value) => {
        set((s) => ({ config: { ...s.config, [key]: value } }))
      },

      generate: async () => {
        const { config } = get()
        set({ generating: true, error: null })

        try {
          const res = await fetch('/api/generate-templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config),
          })

          if (!res.ok) {
            const msg = await res.text().catch(() => res.statusText)
            throw new Error(msg || `Generation failed (${res.status})`)
          }

          const data = await res.json()
          set({
            generating: false,
            lastResults: data.results ?? [],
            lastRoundLabel: data.roundLabel ?? null,
          })
        } catch (err) {
          set({
            generating: false,
            error: err instanceof Error ? err.message : 'Generation failed',
          })
        }
      },
    }),
    {
      name: 'generation-config-store',
      partialize: (state) => ({ config: state.config }),
    },
  ),
)
