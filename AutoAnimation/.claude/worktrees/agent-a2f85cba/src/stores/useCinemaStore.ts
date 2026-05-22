/**
 * Cinema Studio store — camera body, lens, optical settings, active preset, shot grid.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { OpticalSettings, ShotGridEntry } from '@/types/cinemaCamera'
import { CAMERA_BODIES } from '@/data/cameraBodies'
import { LENS_PROFILES } from '@/data/lensProfiles'

interface CinemaState {
  selectedBodyId: string
  selectedLensId: string
  opticalSettings: OpticalSettings
  activePresetId: string | null
  shotGridEntries: ShotGridEntry[]

  // Actions
  setBody: (bodyId: string) => void
  setLens: (lensId: string) => void
  setOptical: (updates: Partial<OpticalSettings>) => void
  applyPreset: (presetId: string) => void
  clearPreset: () => void
  toggleOptical: (key: keyof Pick<OpticalSettings, 'dofEnabled' | 'bokehEnabled' | 'vignettingEnabled' | 'chromaticAberrationEnabled' | 'lensFlareEnabled' | 'filmGrainEnabled' | 'anamorphicEnabled'>) => void
  setShotGridEntries: (entries: ShotGridEntry[]) => void
  addShotGridEntry: (entry: ShotGridEntry) => void
  removeShotGridEntry: (id: string) => void
  reset: () => void
}

const defaultOptical: OpticalSettings = {
  cameraBodyId: CAMERA_BODIES[0]?.id ?? 'arri-alexa-mini-lf',
  lensProfileId: LENS_PROFILES[0]?.id ?? 'cooke-s7i',
  aperture: 2.8,
  focalLength: 50,
  iso: 800,
  shutterAngle: 180,
  whiteBalance: 5600,
  focusDistance: 2,
  dofEnabled: false,
  bokehEnabled: false,
  vignettingEnabled: false,
  chromaticAberrationEnabled: false,
  lensFlareEnabled: false,
  filmGrainEnabled: false,
  anamorphicEnabled: false,
}

const DEFAULT_SHOT_GRID: ShotGridEntry[] = [
  { id: 'sg-1', presetId: 'cp-wide-establish', label: 'Wide', thumbnailColor: '#3b82f6' },
  { id: 'sg-2', presetId: 'cp-medium-closeup', label: 'Medium CU', thumbnailColor: '#10b981' },
  { id: 'sg-3', presetId: 'cp-over-shoulder', label: 'OTS', thumbnailColor: '#f59e0b' },
  { id: 'sg-4', presetId: 'cp-intimate-closeup', label: 'Close-Up', thumbnailColor: '#ef4444' },
  { id: 'sg-5', presetId: 'cp-two-shot', label: 'Two Shot', thumbnailColor: '#8b5cf6' },
  { id: 'sg-6', presetId: 'cp-whip-pan', label: 'Whip Pan', thumbnailColor: '#ec4899' },
  { id: 'sg-7', presetId: 'cp-crash-zoom', label: 'Crash Zoom', thumbnailColor: '#f97316' },
  { id: 'sg-8', presetId: 'cp-dutch-angle-tilt', label: 'Dutch', thumbnailColor: '#14b8a6' },
  { id: 'sg-9', presetId: 'cp-slow-dolly-in', label: 'Dolly In', thumbnailColor: '#6366f1' },
  { id: 'sg-10', presetId: 'cp-rack-focus', label: 'Rack Focus', thumbnailColor: '#84cc16' },
  { id: 'sg-11', presetId: 'cp-kubrick-stare', label: 'Kubrick', thumbnailColor: '#06b6d4' },
  { id: 'sg-12', presetId: 'cp-hitchcock-dolly-zoom', label: 'Vertigo', thumbnailColor: '#d946ef' },
  { id: 'sg-13', presetId: 'cp-wes-anderson-symmetry', label: 'Symmetry', thumbnailColor: '#fbbf24' },
  { id: 'sg-14', presetId: 'cp-tarantino-trunk', label: 'Trunk', thumbnailColor: '#f43f5e' },
  { id: 'sg-15', presetId: 'cp-crane-up', label: 'Crane Up', thumbnailColor: '#22d3ee' },
  { id: 'sg-16', presetId: 'cp-handheld-action', label: 'Handheld', thumbnailColor: '#a855f7' },
]

export const useCinemaStore = create<CinemaState>()(
  immer((set) => ({
    selectedBodyId: defaultOptical.cameraBodyId,
    selectedLensId: defaultOptical.lensProfileId,
    opticalSettings: { ...defaultOptical },
    activePresetId: null,
    shotGridEntries: DEFAULT_SHOT_GRID,

    setBody: (bodyId) =>
      set((state) => {
        state.selectedBodyId = bodyId
        state.opticalSettings.cameraBodyId = bodyId
      }),

    setLens: (lensId) =>
      set((state) => {
        state.selectedLensId = lensId
        state.opticalSettings.lensProfileId = lensId
        const lens = LENS_PROFILES.find((l) => l.id === lensId)
        if (lens) {
          state.opticalSettings.focalLength = lens.focalLength
          state.opticalSettings.aperture = lens.maxAperture
          if (lens.anamorphic) {
            state.opticalSettings.anamorphicEnabled = true
          }
        }
      }),

    setOptical: (updates) =>
      set((state) => {
        Object.assign(state.opticalSettings, updates)
      }),

    applyPreset: (presetId) =>
      set((state) => {
        state.activePresetId = presetId
      }),

    clearPreset: () =>
      set((state) => {
        state.activePresetId = null
      }),

    toggleOptical: (key) =>
      set((state) => {
        const settings = state.opticalSettings as unknown as Record<string, boolean>
        settings[key] = !settings[key]
      }),

    setShotGridEntries: (entries) =>
      set((state) => {
        state.shotGridEntries = entries
      }),

    addShotGridEntry: (entry) =>
      set((state) => {
        state.shotGridEntries.push(entry)
      }),

    removeShotGridEntry: (id) =>
      set((state) => {
        state.shotGridEntries = state.shotGridEntries.filter((e) => e.id !== id)
      }),

    reset: () =>
      set((state) => {
        state.selectedBodyId = defaultOptical.cameraBodyId
        state.selectedLensId = defaultOptical.lensProfileId
        state.opticalSettings = { ...defaultOptical }
        state.activePresetId = null
        state.shotGridEntries = DEFAULT_SHOT_GRID
      }),
  }))
)
