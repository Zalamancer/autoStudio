/**
 * Audio Design Store
 *
 * Centralized state for the intelligent audio and sound design system.
 * Manages sound design presets, volume automation, beat analysis results,
 * and auto-SFX configuration.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { BeatAnalysis } from '@/services/beatDetection'
import type {
  SoundDesignPresetId,
  VolumeAutomationCurve,
} from '@/services/soundDesigner'
import { SOUND_DESIGN_PRESETS } from '@/services/soundDesigner'

export interface AudioDesignState {
  // ── Sound Design Preset ──
  /** Active sound design preset ID (null = custom / no preset) */
  activePresetId: SoundDesignPresetId | null

  // ── Beat Analysis ──
  /** Cached beat analysis for the current music track */
  beatAnalysis: BeatAnalysis | null
  /** Whether beat analysis is in progress */
  isAnalyzingBeats: boolean

  // ── Volume Automation ──
  /** Per-track volume automation curves */
  volumeAutomation: VolumeAutomationCurve[]
  /** Master music volume (0-1) */
  masterMusicVolume: number
  /** Master SFX volume (0-1) */
  masterSfxVolume: number
  /** Master dialogue volume (0-1) */
  masterDialogueVolume: number

  // ── Audio Ducking ──
  /** Enable auto-ducking of music under dialogue */
  autoDuckEnabled: boolean
  /** Ducking amount in dB (negative) */
  duckAmountDb: number
  /** Ducking attack time in seconds */
  duckAttackSec: number
  /** Ducking release time in seconds */
  duckReleaseSec: number

  // ── Auto SFX ──
  /** Whether auto-SFX generation is enabled */
  autoSfxEnabled: boolean

  // ── Actions ──
  setActivePreset: (presetId: SoundDesignPresetId | null) => void
  setBeatAnalysis: (analysis: BeatAnalysis | null) => void
  setIsAnalyzingBeats: (analyzing: boolean) => void
  setVolumeAutomation: (curves: VolumeAutomationCurve[]) => void
  addVolumeAutomation: (curve: VolumeAutomationCurve) => void
  setMasterMusicVolume: (volume: number) => void
  setMasterSfxVolume: (volume: number) => void
  setMasterDialogueVolume: (volume: number) => void
  setAutoDuckEnabled: (enabled: boolean) => void
  setDuckAmountDb: (db: number) => void
  setDuckAttackSec: (sec: number) => void
  setDuckReleaseSec: (sec: number) => void
  setAutoSfxEnabled: (enabled: boolean) => void
  /** Apply a preset, updating all audio settings to match */
  applyPreset: (presetId: SoundDesignPresetId) => void
  /** Reset all state */
  reset: () => void
}

const INITIAL_STATE = {
  activePresetId: null as SoundDesignPresetId | null,
  beatAnalysis: null as BeatAnalysis | null,
  isAnalyzingBeats: false,
  volumeAutomation: [] as VolumeAutomationCurve[],
  masterMusicVolume: 0.4,
  masterSfxVolume: 0.7,
  masterDialogueVolume: 1.0,
  autoDuckEnabled: true,
  duckAmountDb: -12,
  duckAttackSec: 0.3,
  duckReleaseSec: 0.5,
  autoSfxEnabled: true,
}

export const useAudioDesignStore = create<AudioDesignState>()(
  immer((set) => ({
    ...INITIAL_STATE,

    setActivePreset: (presetId) =>
      set((state) => {
        state.activePresetId = presetId
      }),

    setBeatAnalysis: (analysis) =>
      set((state) => {
        state.beatAnalysis = analysis as BeatAnalysis | null
        state.isAnalyzingBeats = false
      }),

    setIsAnalyzingBeats: (analyzing) =>
      set((state) => {
        state.isAnalyzingBeats = analyzing
      }),

    setVolumeAutomation: (curves) =>
      set((state) => {
        state.volumeAutomation = curves as VolumeAutomationCurve[]
      }),

    addVolumeAutomation: (curve) =>
      set((state) => {
        // Replace existing curve for same track type, or add new
        const idx = state.volumeAutomation.findIndex((c) => c.trackType === curve.trackType)
        if (idx >= 0) {
          state.volumeAutomation[idx] = curve as VolumeAutomationCurve
        } else {
          state.volumeAutomation.push(curve as VolumeAutomationCurve)
        }
      }),

    setMasterMusicVolume: (volume) =>
      set((state) => {
        state.masterMusicVolume = volume
      }),

    setMasterSfxVolume: (volume) =>
      set((state) => {
        state.masterSfxVolume = volume
      }),

    setMasterDialogueVolume: (volume) =>
      set((state) => {
        state.masterDialogueVolume = volume
      }),

    setAutoDuckEnabled: (enabled) =>
      set((state) => {
        state.autoDuckEnabled = enabled
      }),

    setDuckAmountDb: (db) =>
      set((state) => {
        state.duckAmountDb = db
      }),

    setDuckAttackSec: (sec) =>
      set((state) => {
        state.duckAttackSec = sec
      }),

    setDuckReleaseSec: (sec) =>
      set((state) => {
        state.duckReleaseSec = sec
      }),

    setAutoSfxEnabled: (enabled) =>
      set((state) => {
        state.autoSfxEnabled = enabled
      }),

    applyPreset: (presetId) =>
      set((state) => {
        const preset = SOUND_DESIGN_PRESETS[presetId]
        if (!preset) return

        state.activePresetId = presetId
        state.masterMusicVolume = preset.musicVolume
        state.masterSfxVolume = preset.sfxVolumeMultiplier
        state.duckAmountDb = preset.duckAmountDb
        state.autoSfxEnabled = preset.autoSfxTypes.length > 0
        state.autoDuckEnabled = true
      }),

    reset: () =>
      set((state) => {
        Object.assign(state, INITIAL_STATE)
      }),
  }))
)
