import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Resolution = '8k' | '4k' | '2k' | '1080p' | '720p' | '480p'
export type ExportFormat = 'webm' | 'mp4' | 'gif'
export type ExportQuality = 'high' | 'medium' | 'low'
export type Theme = 'dark' | 'light'

interface SettingsState {
  // Export defaults
  defaultResolution: Resolution
  defaultFormat: ExportFormat
  defaultQuality: ExportQuality

  // Performance
  reducedMotion: boolean
  autoSave: boolean
  autoSaveInterval: number // seconds

  // Canvas
  canvasBgColor: string

  // Theme
  theme: Theme

  // Background removal
  bgRemovalMode: 'local' | 'api'

  // Transparent export
  transparentExport: boolean

  // Actions
  setSetting: <K extends keyof Omit<SettingsState, 'setSetting'>>(
    key: K,
    value: Omit<SettingsState, 'setSetting'>[K]
  ) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      defaultResolution: '1080p',
      defaultFormat: 'webm',
      defaultQuality: 'high',
      reducedMotion: false,
      autoSave: true,
      autoSaveInterval: 60,
      canvasBgColor: '#000000',
      theme: 'dark',
      bgRemovalMode: 'local',
      transparentExport: false,

      setSetting: (key, value) => set({ [key]: value } as Partial<SettingsState>),
    }),
    {
      name: 'proanimate-settings',
      // Migrate stale theme values (e.g. 'sepia') back to 'dark'
      migrate: (persisted: unknown) => {
        const state = persisted as Record<string, unknown>
        if (state?.theme && state.theme !== 'dark' && state.theme !== 'light') {
          state.theme = 'dark'
        }
        return state as unknown as SettingsState
      },
      version: 1,
    }
  )
)
