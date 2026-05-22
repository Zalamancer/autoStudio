/**
 * Style Store — AI style effects and visual filters.
 *
 * Manages CSS filter presets and keyframe-animatable intensity.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

// ── Types ──────────────────────────────────────────────────────────────

export interface StylePreset {
  id: string
  name: string
  category: 'cinematic' | 'vintage' | 'mood' | 'color' | 'artistic'
  /** CSS filter string */
  filter: string
  /** Optional SVG filter ID */
  svgFilter?: string
  /** Preview thumbnail color */
  previewColor: string
}

export interface StyleKeyframe {
  frame: number
  intensity: number
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
}

// ── Presets ─────────────────────────────────────────────────────────────

export const STYLE_PRESETS: StylePreset[] = [
  // Cinematic
  { id: 'cinematic-warm', name: 'Cinematic Warm', category: 'cinematic', filter: 'contrast(1.1) saturate(1.2) brightness(1.05) sepia(0.15)', previewColor: '#d4a373' },
  { id: 'cinematic-cool', name: 'Cinematic Cool', category: 'cinematic', filter: 'contrast(1.1) saturate(0.9) brightness(0.95) hue-rotate(10deg)', previewColor: '#6b93d6' },
  { id: 'cinematic-teal-orange', name: 'Teal & Orange', category: 'cinematic', filter: 'contrast(1.15) saturate(1.3) hue-rotate(-10deg)', previewColor: '#e4915c' },
  { id: 'cinematic-noir', name: 'Film Noir', category: 'cinematic', filter: 'contrast(1.3) brightness(0.9) saturate(0) sepia(0.1)', previewColor: '#4a4a4a' },
  // Vintage
  { id: 'vintage-faded', name: 'Faded Film', category: 'vintage', filter: 'contrast(0.9) brightness(1.1) saturate(0.7) sepia(0.25)', previewColor: '#c4a882' },
  { id: 'vintage-70s', name: '70s Retro', category: 'vintage', filter: 'contrast(1.05) saturate(1.3) sepia(0.2) hue-rotate(-15deg)', previewColor: '#c49a4a' },
  { id: 'vintage-polaroid', name: 'Polaroid', category: 'vintage', filter: 'contrast(1.1) brightness(1.05) saturate(0.85) sepia(0.12)', previewColor: '#d4c5a9' },
  // Mood
  { id: 'mood-dreamy', name: 'Dreamy', category: 'mood', filter: 'contrast(0.9) brightness(1.15) saturate(0.8) blur(0.3px)', previewColor: '#b0a0c4' },
  { id: 'mood-dramatic', name: 'Dramatic', category: 'mood', filter: 'contrast(1.4) brightness(0.85) saturate(1.1)', previewColor: '#3d3d5c' },
  { id: 'mood-horror', name: 'Horror', category: 'mood', filter: 'contrast(1.3) brightness(0.7) saturate(0.5) hue-rotate(180deg)', previewColor: '#2d4a2d' },
  // Color
  { id: 'color-vibrant', name: 'Vibrant', category: 'color', filter: 'contrast(1.1) saturate(1.6) brightness(1.05)', previewColor: '#e45e9d' },
  { id: 'color-muted', name: 'Muted', category: 'color', filter: 'contrast(0.95) saturate(0.5) brightness(1.05)', previewColor: '#a0a0a0' },
  { id: 'color-sepia', name: 'Sepia', category: 'color', filter: 'sepia(0.8) contrast(1.1)', previewColor: '#b5865a' },
  { id: 'color-bw', name: 'Black & White', category: 'color', filter: 'saturate(0) contrast(1.15)', previewColor: '#808080' },
  // Artistic
  { id: 'artistic-high-contrast', name: 'High Contrast', category: 'artistic', filter: 'contrast(1.5) brightness(0.95)', previewColor: '#1a1a1a' },
  { id: 'artistic-blown-out', name: 'Blown Out', category: 'artistic', filter: 'contrast(0.8) brightness(1.4) saturate(0.6)', previewColor: '#f0e6d6' },
]

// ── Store ──────────────────────────────────────────────────────────────

interface StyleState {
  /** Whether style effects are enabled */
  enabled: boolean
  /** Active preset ID */
  activePresetId: string | null
  /** Custom CSS filter override (when not using a preset) */
  customFilter: string | null
  /** Global intensity (0-1, multiplies the filter effect) */
  intensity: number
  /** Intensity keyframes for animation */
  intensityKeyframes: StyleKeyframe[]

  // Actions
  setEnabled: (enabled: boolean) => void
  applyPreset: (presetId: string) => void
  setCustomFilter: (filter: string) => void
  setIntensity: (intensity: number) => void
  addIntensityKeyframe: (keyframe: StyleKeyframe) => void
  removeIntensityKeyframe: (index: number) => void
  clearPreset: () => void
  reset: () => void

  /** Get the CSS filter string at a given frame */
  getFilterAtFrame: (frame: number) => string
}

export const useStyleStore = create<StyleState>()(
  immer((set, get) => ({
    enabled: false,
    activePresetId: null,
    customFilter: null,
    intensity: 1,
    intensityKeyframes: [],

    setEnabled: (enabled) =>
      set((s) => {
        s.enabled = enabled
      }),

    applyPreset: (presetId) =>
      set((s) => {
        const preset = STYLE_PRESETS.find((p) => p.id === presetId)
        if (preset) {
          s.activePresetId = presetId
          s.customFilter = null
          s.enabled = true
        }
      }),

    setCustomFilter: (filter) =>
      set((s) => {
        s.customFilter = filter
        s.activePresetId = null
        s.enabled = true
      }),

    setIntensity: (intensity) =>
      set((s) => {
        s.intensity = Math.max(0, Math.min(1, intensity))
      }),

    addIntensityKeyframe: (keyframe) =>
      set((s) => {
        const idx = s.intensityKeyframes.findIndex((kf) => kf.frame === keyframe.frame)
        if (idx >= 0) {
          s.intensityKeyframes[idx] = keyframe
        } else {
          s.intensityKeyframes.push(keyframe)
          s.intensityKeyframes.sort((a, b) => a.frame - b.frame)
        }
      }),

    removeIntensityKeyframe: (index) =>
      set((s) => {
        if (index >= 0 && index < s.intensityKeyframes.length) {
          s.intensityKeyframes.splice(index, 1)
        }
      }),

    clearPreset: () =>
      set((s) => {
        s.activePresetId = null
        s.customFilter = null
      }),

    reset: () =>
      set((s) => {
        s.enabled = false
        s.activePresetId = null
        s.customFilter = null
        s.intensity = 1
        s.intensityKeyframes = []
      }),

    getFilterAtFrame: (frame) => {
      const { enabled, activePresetId, customFilter, intensity, intensityKeyframes } = get()
      if (!enabled) return 'none'

      // Get base filter
      let baseFilter = 'none'
      if (activePresetId) {
        const preset = STYLE_PRESETS.find((p) => p.id === activePresetId)
        if (preset) baseFilter = preset.filter
      } else if (customFilter) {
        baseFilter = customFilter
      }

      if (baseFilter === 'none') return 'none'

      // Get interpolated intensity
      let effectiveIntensity = intensity
      if (intensityKeyframes.length > 0) {
        effectiveIntensity = interpolateIntensity(intensityKeyframes, frame)
      }

      // Apply intensity by interpolating filter values toward identity
      if (effectiveIntensity >= 0.99) return baseFilter
      if (effectiveIntensity <= 0.01) return 'none'

      // Interpolate each CSS filter function toward its identity value
      return scaleFilterIntensity(baseFilter, effectiveIntensity)
    },
  }))
)

/** Identity values for CSS filter functions (value where the filter has no effect) */
const FILTER_IDENTITY: Record<string, number> = {
  contrast: 1, saturate: 1, brightness: 1, opacity: 1,
  sepia: 0, blur: 0, grayscale: 0, invert: 0, 'hue-rotate': 0,
}

function scaleFilterIntensity(filter: string, intensity: number): string {
  return filter.replace(
    /([\w-]+)\(([^)]+)\)/g,
    (_match, fn: string, rawVal: string) => {
      const numMatch = rawVal.match(/^([\d.]+)(.*)$/)
      if (!numMatch) return `${fn}(${rawVal})`
      const val = parseFloat(numMatch[1])
      const unit = numMatch[2] || ''
      const identity = FILTER_IDENTITY[fn] ?? 1
      const scaled = identity + (val - identity) * intensity
      return `${fn}(${scaled}${unit})`
    },
  )
}

function interpolateIntensity(keyframes: StyleKeyframe[], frame: number): number {
  if (keyframes.length === 0) return 1
  if (frame <= keyframes[0].frame) return keyframes[0].intensity
  const last = keyframes[keyframes.length - 1]
  if (frame >= last.frame) return last.intensity

  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i]
    const b = keyframes[i + 1]
    if (frame >= a.frame && frame < b.frame) {
      const t = (frame - a.frame) / (b.frame - a.frame)
      return a.intensity + (b.intensity - a.intensity) * t
    }
  }
  return last.intensity
}
