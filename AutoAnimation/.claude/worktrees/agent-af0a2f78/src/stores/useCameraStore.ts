/**
 * Camera Store — Virtual camera keyframes for animated zoom/pan/rotation.
 *
 * Provides keyframe-based camera control with built-in presets.
 * Camera transforms are applied as a wrapper around all layers during
 * live preview (VideoCanvas) and export (VideoComposition + canvas2dRenderer).
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { SmartZoomConfig } from '@/types/smartZoom'

// ── Types ──────────────────────────────────────────────────────────────

export interface CameraKeyframe {
  /** Frame number */
  frame: number
  /** Zoom level (1 = 100%, 1.5 = 150%) */
  zoom: number
  /** Horizontal pan as percentage (-50 to 50, 0 = center) */
  panX: number
  /** Vertical pan as percentage (-50 to 50, 0 = center) */
  panY: number
  /** Rotation in degrees */
  rotation: number
  /** Easing to next keyframe */
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
  /** Optional tag for identifying auto-generated keyframes (e.g., 'smart-zoom') */
  tag?: string
}

export interface CameraPreset {
  id: string
  name: string
  description: string
  /** Factory function that generates keyframes for a given total frame count */
  buildKeyframes: (totalFrames: number) => CameraKeyframe[]
}

export interface CameraTransform {
  zoom: number
  panX: number
  panY: number
  rotation: number
}

// ── Camera Shake ──────────────────────────────────────────────────────

export interface CameraShakeConfig {
  /** Shake intensity (pixels of displacement) */
  intensity: number
  /** Frequency (oscillations per second) */
  frequency: number
  /** Decay rate — how quickly shake dies out (0 = no decay, 1 = fast decay) */
  decay: number
  /** Duration in frames. 0 = continuous. */
  durationFrames: number
  /** Start frame */
  startFrame: number
}

/**
 * Calculate camera shake displacement at a given frame.
 * Uses layered sine waves for organic-feeling shake.
 */
export function getCameraShakeAtFrame(
  frame: number,
  fps: number,
  config: CameraShakeConfig,
): { shakeX: number; shakeY: number; shakeRotation: number } {
  const elapsed = frame - config.startFrame
  if (elapsed < 0) return { shakeX: 0, shakeY: 0, shakeRotation: 0 }
  if (config.durationFrames > 0 && elapsed > config.durationFrames) {
    return { shakeX: 0, shakeY: 0, shakeRotation: 0 }
  }

  const t = elapsed / fps
  const decay = config.decay > 0
    ? Math.exp(-config.decay * 3 * t)
    : 1

  const freq = config.frequency
  const intensity = config.intensity * decay

  // Layer multiple frequencies for organic shake
  const shakeX = intensity * (
    Math.sin(t * freq * 6.28) * 0.5 +
    Math.sin(t * freq * 1.7 * 6.28 + 1.3) * 0.3 +
    Math.sin(t * freq * 2.9 * 6.28 + 2.7) * 0.2
  )
  const shakeY = intensity * (
    Math.sin(t * freq * 6.28 + 0.7) * 0.5 +
    Math.sin(t * freq * 2.1 * 6.28 + 0.9) * 0.3 +
    Math.sin(t * freq * 3.3 * 6.28 + 1.8) * 0.2
  )
  const shakeRotation = intensity * 0.02 * (
    Math.sin(t * freq * 1.3 * 6.28 + 2.1) * 0.6 +
    Math.sin(t * freq * 2.7 * 6.28 + 0.4) * 0.4
  )

  return { shakeX, shakeY, shakeRotation }
}

// ── Focus Pull ────────────────────────────────────────────────────────

export interface FocusPullConfig {
  /** Target zoom level for the focus point */
  targetZoom: number
  /** Focus point (normalized 0..1) */
  focusX: number
  focusY: number
  /** Transition duration in frames */
  transitionFrames: number
  /** Start frame */
  startFrame: number
  /** Hold duration before pulling back (0 = stay) */
  holdFrames: number
  /** Whether to pull back to original position after hold */
  pullBack: boolean
}

// ── Easing Functions ───────────────────────────────────────────────────

function easeIn(t: number): number {
  return t * t
}

function easeOut(t: number): number {
  return t * (2 - t)
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

function applyEasing(t: number, easing: string): number {
  switch (easing) {
    case 'ease-in': return easeIn(t)
    case 'ease-out': return easeOut(t)
    case 'ease-in-out': return easeInOut(t)
    default: return t // linear
  }
}

// ── Interpolation ──────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Interpolate camera transform at a specific frame from keyframes.
 */
export function getCameraAtFrame(keyframes: CameraKeyframe[], frame: number): CameraTransform {
  if (keyframes.length === 0) {
    return { zoom: 1, panX: 0, panY: 0, rotation: 0 }
  }

  // Before first keyframe
  if (frame <= keyframes[0].frame) {
    const kf = keyframes[0]
    return { zoom: kf.zoom, panX: kf.panX, panY: kf.panY, rotation: kf.rotation }
  }

  // After last keyframe
  const last = keyframes[keyframes.length - 1]
  if (frame >= last.frame) {
    return { zoom: last.zoom, panX: last.panX, panY: last.panY, rotation: last.rotation }
  }

  // Find surrounding keyframes
  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i]
    const b = keyframes[i + 1]
    if (frame >= a.frame && frame < b.frame) {
      const rawT = (frame - a.frame) / (b.frame - a.frame)
      const t = applyEasing(rawT, a.easing)
      return {
        zoom: lerp(a.zoom, b.zoom, t),
        panX: lerp(a.panX, b.panX, t),
        panY: lerp(a.panY, b.panY, t),
        rotation: lerp(a.rotation, b.rotation, t),
      }
    }
  }

  return { zoom: last.zoom, panX: last.panX, panY: last.panY, rotation: last.rotation }
}

// ── Built-in Presets ──────────────────────────────────────────────────

export const CAMERA_PRESETS: CameraPreset[] = [
  {
    id: 'slow-zoom-in',
    name: 'Slow Zoom In',
    description: 'Gentle zoom from 1x to 1.3x',
    buildKeyframes: (totalFrames) => [
      { frame: 0, zoom: 1, panX: 0, panY: 0, rotation: 0, easing: 'ease-in-out' },
      { frame: totalFrames - 1, zoom: 1.3, panX: 0, panY: 0, rotation: 0, easing: 'linear' },
    ],
  },
  {
    id: 'slow-zoom-out',
    name: 'Slow Zoom Out',
    description: 'Pull back from 1.3x to 1x',
    buildKeyframes: (totalFrames) => [
      { frame: 0, zoom: 1.3, panX: 0, panY: 0, rotation: 0, easing: 'ease-in-out' },
      { frame: totalFrames - 1, zoom: 1, panX: 0, panY: 0, rotation: 0, easing: 'linear' },
    ],
  },
  {
    id: 'ken-burns',
    name: 'Ken Burns',
    description: 'Slow zoom + subtle pan',
    buildKeyframes: (totalFrames) => [
      { frame: 0, zoom: 1, panX: -5, panY: -3, rotation: 0, easing: 'ease-in-out' },
      { frame: totalFrames - 1, zoom: 1.25, panX: 5, panY: 3, rotation: 0, easing: 'linear' },
    ],
  },
  {
    id: 'pan-left-to-right',
    name: 'Pan L to R',
    description: 'Horizontal pan across the scene',
    buildKeyframes: (totalFrames) => [
      { frame: 0, zoom: 1.15, panX: -15, panY: 0, rotation: 0, easing: 'ease-in-out' },
      { frame: totalFrames - 1, zoom: 1.15, panX: 15, panY: 0, rotation: 0, easing: 'linear' },
    ],
  },
  {
    id: 'pan-right-to-left',
    name: 'Pan R to L',
    description: 'Reverse horizontal pan',
    buildKeyframes: (totalFrames) => [
      { frame: 0, zoom: 1.15, panX: 15, panY: 0, rotation: 0, easing: 'ease-in-out' },
      { frame: totalFrames - 1, zoom: 1.15, panX: -15, panY: 0, rotation: 0, easing: 'linear' },
    ],
  },
  {
    id: 'dramatic-push',
    name: 'Dramatic Push',
    description: 'Fast zoom in for emphasis',
    buildKeyframes: (totalFrames) => [
      { frame: 0, zoom: 1, panX: 0, panY: 0, rotation: 0, easing: 'ease-in' },
      { frame: Math.floor(totalFrames * 0.7), zoom: 1.5, panX: 0, panY: -5, rotation: 0, easing: 'ease-out' },
      { frame: totalFrames - 1, zoom: 1.5, panX: 0, panY: -5, rotation: 0, easing: 'linear' },
    ],
  },
  {
    id: 'pull-back',
    name: 'Pull Back',
    description: 'Start close, pull back to reveal',
    buildKeyframes: (totalFrames) => [
      { frame: 0, zoom: 1.5, panX: 0, panY: -5, rotation: 0, easing: 'ease-out' },
      { frame: totalFrames - 1, zoom: 1, panX: 0, panY: 0, rotation: 0, easing: 'linear' },
    ],
  },
  {
    id: 'subtle-drift',
    name: 'Subtle Drift',
    description: 'Gentle organic movement',
    buildKeyframes: (totalFrames) => {
      const q = Math.floor(totalFrames / 4)
      return [
        { frame: 0, zoom: 1.05, panX: -2, panY: -1, rotation: -0.3, easing: 'ease-in-out' },
        { frame: q, zoom: 1.08, panX: 2, panY: 1, rotation: 0.3, easing: 'ease-in-out' },
        { frame: q * 2, zoom: 1.05, panX: -1, panY: 2, rotation: -0.2, easing: 'ease-in-out' },
        { frame: q * 3, zoom: 1.07, panX: 1, panY: -1, rotation: 0.2, easing: 'ease-in-out' },
        { frame: totalFrames - 1, zoom: 1.05, panX: -2, panY: -1, rotation: -0.3, easing: 'linear' },
      ]
    },
  },
]

// ── Store ──────────────────────────────────────────────────────────────

interface CameraState {
  enabled: boolean
  keyframes: CameraKeyframe[]
  activePresetId: string | null

  /** Active camera shakes (can stack multiple) */
  shakes: CameraShakeConfig[]
  /** Active focus pull */
  focusPull: FocusPullConfig | null

  /** Smart zoom configuration (null = not applied) */
  smartZoomConfig: SmartZoomConfig | null

  // Actions
  setEnabled: (enabled: boolean) => void
  setKeyframes: (keyframes: CameraKeyframe[]) => void
  addKeyframe: (keyframe: CameraKeyframe) => void
  updateKeyframe: (index: number, updates: Partial<CameraKeyframe>) => void
  removeKeyframe: (index: number) => void
  applyPreset: (presetId: string, totalFrames: number) => void
  clearKeyframes: () => void

  /** Beat-sync: add zoom-pulse keyframes at beat positions */
  syncToBeats: (beats: number[], fps: number) => void

  /** Add a camera shake effect */
  addShake: (config: CameraShakeConfig) => void
  /** Remove all shake effects */
  clearShakes: () => void

  /** Start a focus pull effect */
  setFocusPull: (config: FocusPullConfig) => void
  /** Remove focus pull */
  clearFocusPull: () => void

  /** Apply smart zoom keyframes (tagged so they can be cleared separately) */
  applySmartZoom: (keyframes: CameraKeyframe[], config: SmartZoomConfig) => void
  /** Remove only auto-generated smart zoom keyframes (preserves manual ones) */
  clearSmartZoom: () => void

  /** Get interpolated camera transform at frame (including shake + focus) */
  getCameraAtFrame: (frame: number, fps?: number) => CameraTransform

  /** Reset store */
  reset: () => void
}

export const useCameraStore = create<CameraState>()(
  immer((set, get) => ({
    enabled: false,
    keyframes: [],
    activePresetId: null,
    shakes: [],
    focusPull: null,
    smartZoomConfig: null,

    setEnabled: (enabled) =>
      set((state) => {
        state.enabled = enabled
      }),

    setKeyframes: (keyframes) =>
      set((state) => {
        state.keyframes = keyframes.sort((a, b) => a.frame - b.frame)
        state.activePresetId = null
      }),

    addKeyframe: (keyframe) =>
      set((state) => {
        // Replace existing keyframe at same frame, or insert
        const idx = state.keyframes.findIndex((kf) => kf.frame === keyframe.frame)
        if (idx >= 0) {
          state.keyframes[idx] = keyframe
        } else {
          state.keyframes.push(keyframe)
          state.keyframes.sort((a, b) => a.frame - b.frame)
        }
        state.activePresetId = null
      }),

    updateKeyframe: (index, updates) =>
      set((state) => {
        if (index >= 0 && index < state.keyframes.length) {
          Object.assign(state.keyframes[index], updates)
          state.keyframes.sort((a, b) => a.frame - b.frame)
          state.activePresetId = null
        }
      }),

    removeKeyframe: (index) =>
      set((state) => {
        if (index >= 0 && index < state.keyframes.length) {
          state.keyframes.splice(index, 1)
          state.activePresetId = null
        }
      }),

    applyPreset: (presetId, totalFrames) =>
      set((state) => {
        const preset = CAMERA_PRESETS.find((p) => p.id === presetId)
        if (preset) {
          state.keyframes = preset.buildKeyframes(totalFrames)
          state.activePresetId = presetId
          state.enabled = true
        }
      }),

    clearKeyframes: () =>
      set((state) => {
        state.keyframes = []
        state.activePresetId = null
      }),

    syncToBeats: (beats, fps) =>
      set((state) => {
        if (beats.length === 0) return

        const newKeyframes: CameraKeyframe[] = []
        for (let i = 0; i < beats.length; i++) {
          const beatFrame = Math.round(beats[i] * fps)
          // Zoom pulse: quick zoom in on beat, return to base
          const isStrong = i % 4 === 0
          const pulseZoom = isStrong ? 1.12 : 1.06
          const holdFrames = Math.round(fps * 0.08)
          const returnFrames = Math.round(fps * 0.25)

          newKeyframes.push({
            frame: beatFrame,
            zoom: pulseZoom,
            panX: 0,
            panY: 0,
            rotation: 0,
            easing: 'ease-out',
          })
          newKeyframes.push({
            frame: beatFrame + holdFrames + returnFrames,
            zoom: 1,
            panX: 0,
            panY: 0,
            rotation: 0,
            easing: 'ease-in-out',
          })
        }

        // Merge with existing keyframes (beat-sync adds, doesn't replace)
        const existing = state.keyframes.filter(
          (kf) => !newKeyframes.some((bkf) => Math.abs(bkf.frame - kf.frame) < 3)
        )
        state.keyframes = [...existing, ...newKeyframes].sort((a, b) => a.frame - b.frame)
        state.enabled = true
        state.activePresetId = null
      }),

    addShake: (config) =>
      set((state) => {
        state.shakes.push(config)
        state.enabled = true
      }),

    clearShakes: () =>
      set((state) => {
        state.shakes = []
      }),

    setFocusPull: (config) =>
      set((state) => {
        state.focusPull = config
        state.enabled = true
      }),

    clearFocusPull: () =>
      set((state) => {
        state.focusPull = null
      }),

    applySmartZoom: (keyframes, config) =>
      set((state) => {
        // Tag all incoming keyframes as smart-zoom
        const tagged = keyframes.map((kf) => ({ ...kf, tag: 'smart-zoom' }))

        // Merge with existing manual keyframes (preserve non-smart-zoom keyframes)
        const manual = state.keyframes.filter((kf) => kf.tag !== 'smart-zoom')
        state.keyframes = [...manual, ...tagged].sort((a, b) => a.frame - b.frame)
        state.smartZoomConfig = config
        state.enabled = true
        state.activePresetId = null
      }),

    clearSmartZoom: () =>
      set((state) => {
        state.keyframes = state.keyframes.filter((kf) => kf.tag !== 'smart-zoom')
        state.smartZoomConfig = null
        if (state.keyframes.length === 0) {
          state.enabled = false
        }
      }),

    getCameraAtFrame: (frame, fps = 30) => {
      const { enabled, keyframes, shakes, focusPull } = get()
      if (!enabled) {
        return { zoom: 1, panX: 0, panY: 0, rotation: 0 }
      }

      // Base camera from keyframes
      const base = keyframes.length > 0
        ? getCameraAtFrame(keyframes, frame)
        : { zoom: 1, panX: 0, panY: 0, rotation: 0 }

      // Apply shakes (additive)
      let totalShakeX = 0
      let totalShakeY = 0
      let totalShakeRot = 0
      for (const shake of shakes) {
        const { shakeX, shakeY, shakeRotation } = getCameraShakeAtFrame(frame, fps, shake)
        totalShakeX += shakeX
        totalShakeY += shakeY
        totalShakeRot += shakeRotation
      }

      // Apply focus pull
      let focusZoom = 0
      let focusPanX = 0
      let focusPanY = 0
      if (focusPull) {
        const elapsed = frame - focusPull.startFrame
        if (elapsed >= 0) {
          const transIn = focusPull.transitionFrames
          const hold = focusPull.holdFrames
          const total = focusPull.pullBack ? transIn + hold + transIn : transIn + hold

          let progress = 0
          if (elapsed < transIn) {
            // Transition in
            progress = elapsed / transIn
            progress = easeInOut(progress)
          } else if (elapsed < transIn + hold) {
            // Hold
            progress = 1
          } else if (focusPull.pullBack && elapsed < total) {
            // Pull back
            progress = 1 - (elapsed - transIn - hold) / transIn
            progress = easeInOut(progress)
          } else if (focusPull.pullBack) {
            progress = 0
          } else {
            progress = 1
          }

          focusZoom = (focusPull.targetZoom - 1) * progress
          focusPanX = (focusPull.focusX - 0.5) * -100 * progress * focusPull.targetZoom
          focusPanY = (focusPull.focusY - 0.5) * -100 * progress * focusPull.targetZoom
        }
      }

      return {
        zoom: base.zoom + focusZoom,
        panX: base.panX + totalShakeX + focusPanX,
        panY: base.panY + totalShakeY + focusPanY,
        rotation: base.rotation + totalShakeRot,
      }
    },

    reset: () =>
      set((state) => {
        state.enabled = false
        state.keyframes = []
        state.activePresetId = null
        state.shakes = []
        state.focusPull = null
        state.smartZoomConfig = null
      }),
  }))
)
