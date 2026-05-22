import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useTimelineStore } from './useTimelineStore'

// ── Types ─────────────────────────────────────────────────────────────

export type ParticlePresetType = 'confetti' | 'sparkles' | 'snow' | 'fire' | 'smoke' | 'rain'

export interface ParticleEmitter {
  id: string
  name: string
  preset: ParticlePresetType
  visible: boolean
  zIndex: number
  startFrame: number
  endFrame: number

  // Emitter position & size (percentage of canvas)
  emitterX: number  // 0-100
  emitterY: number  // 0-100
  emitterWidth: number  // 0-100
  emitterHeight: number // 0-100

  // Particle properties
  particleCount: number
  speed: number        // pixels per frame
  lifetime: number     // frames
  size: number         // base size in px
  sizeVariance: number // 0-1
  opacity: number      // 0-1
  gravity: number      // pixels per frame^2 (positive = downward)
  wind: number         // pixels per frame (positive = rightward)
  rotation: number     // degrees per frame
  rotationVariance: number
  spread: number       // emission angle spread in degrees (0-360)
  direction: number    // emission direction in degrees (0=up, 90=right, 180=down, 270=left)

  // Colors
  colors: string[]

  // Fade
  fadeIn: number   // frames
  fadeOut: number  // frames
}

// ── Preset defaults ──────────────────────────────────────────────────

const PRESET_DEFAULTS: Record<ParticlePresetType, Partial<ParticleEmitter>> = {
  confetti: {
    particleCount: 50,
    speed: 3,
    lifetime: 90,
    size: 8,
    sizeVariance: 0.5,
    opacity: 1,
    gravity: 0.08,
    wind: 0,
    rotation: 5,
    rotationVariance: 0.8,
    spread: 120,
    direction: 0,
    colors: ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'],
    fadeIn: 0,
    fadeOut: 15,
    emitterX: 50,
    emitterY: 10,
    emitterWidth: 80,
    emitterHeight: 5,
  },
  sparkles: {
    particleCount: 30,
    speed: 1,
    lifetime: 45,
    size: 4,
    sizeVariance: 0.7,
    opacity: 1,
    gravity: 0,
    wind: 0,
    rotation: 0,
    rotationVariance: 0,
    spread: 360,
    direction: 0,
    colors: ['#fde68a', '#fbbf24', '#ffffff', '#fef3c7'],
    fadeIn: 10,
    fadeOut: 15,
    emitterX: 50,
    emitterY: 50,
    emitterWidth: 60,
    emitterHeight: 60,
  },
  snow: {
    particleCount: 40,
    speed: 1.5,
    lifetime: 150,
    size: 5,
    sizeVariance: 0.6,
    opacity: 0.8,
    gravity: 0.02,
    wind: 0.3,
    rotation: 1,
    rotationVariance: 0.5,
    spread: 30,
    direction: 180,
    colors: ['#ffffff', '#e2e8f0', '#f1f5f9'],
    fadeIn: 10,
    fadeOut: 20,
    emitterX: 50,
    emitterY: 0,
    emitterWidth: 100,
    emitterHeight: 5,
  },
  fire: {
    particleCount: 60,
    speed: 2.5,
    lifetime: 40,
    size: 12,
    sizeVariance: 0.4,
    opacity: 0.9,
    gravity: -0.15,
    wind: 0,
    rotation: 0,
    rotationVariance: 0,
    spread: 40,
    direction: 0,
    colors: ['#ef4444', '#f97316', '#eab308', '#fbbf24'],
    fadeIn: 5,
    fadeOut: 15,
    emitterX: 50,
    emitterY: 90,
    emitterWidth: 20,
    emitterHeight: 5,
  },
  smoke: {
    particleCount: 25,
    speed: 1,
    lifetime: 80,
    size: 20,
    sizeVariance: 0.5,
    opacity: 0.4,
    gravity: -0.05,
    wind: 0.2,
    rotation: 0.5,
    rotationVariance: 0.3,
    spread: 30,
    direction: 0,
    colors: ['#71717a', '#a1a1aa', '#d4d4d8', '#52525b'],
    fadeIn: 15,
    fadeOut: 30,
    emitterX: 50,
    emitterY: 85,
    emitterWidth: 15,
    emitterHeight: 5,
  },
  rain: {
    particleCount: 80,
    speed: 8,
    lifetime: 30,
    size: 2,
    sizeVariance: 0.3,
    opacity: 0.6,
    gravity: 0.5,
    wind: -1,
    rotation: 0,
    rotationVariance: 0,
    spread: 10,
    direction: 190,
    colors: ['#93c5fd', '#bfdbfe', '#60a5fa'],
    fadeIn: 0,
    fadeOut: 5,
    emitterX: 50,
    emitterY: 0,
    emitterWidth: 110,
    emitterHeight: 5,
  },
}

// ── Store ─────────────────────────────────────────────────────────────

interface ParticleState {
  emitters: ParticleEmitter[]
  selectedEmitterId: string | null

  addEmitter: (preset: ParticlePresetType) => void
  removeEmitter: (id: string) => void
  updateEmitter: (id: string, updates: Partial<ParticleEmitter>) => void
  setSelectedEmitterId: (id: string | null) => void
  duplicateEmitter: (id: string) => void
  clearEmitters: () => void
  loadFromSnapshot: (emitters: ParticleEmitter[]) => void
}

export const useParticleStore = create<ParticleState>()(
  immer((set) => ({
    emitters: [],
    selectedEmitterId: null,

    addEmitter: (preset) =>
      set((state) => {
        const { totalFrames } = useTimelineStore.getState()
        const defaults = PRESET_DEFAULTS[preset]
        const id = `particle-${Date.now()}`
        const count = state.emitters.filter((e) => e.preset === preset).length

        const emitter: ParticleEmitter = {
          id,
          name: `${preset.charAt(0).toUpperCase() + preset.slice(1)} ${count + 1}`,
          preset,
          visible: true,
          zIndex: 9,
          startFrame: 0,
          endFrame: totalFrames,
          emitterX: defaults.emitterX ?? 50,
          emitterY: defaults.emitterY ?? 50,
          emitterWidth: defaults.emitterWidth ?? 50,
          emitterHeight: defaults.emitterHeight ?? 10,
          particleCount: defaults.particleCount ?? 30,
          speed: defaults.speed ?? 2,
          lifetime: defaults.lifetime ?? 60,
          size: defaults.size ?? 6,
          sizeVariance: defaults.sizeVariance ?? 0.5,
          opacity: defaults.opacity ?? 1,
          gravity: defaults.gravity ?? 0,
          wind: defaults.wind ?? 0,
          rotation: defaults.rotation ?? 0,
          rotationVariance: defaults.rotationVariance ?? 0,
          spread: defaults.spread ?? 360,
          direction: defaults.direction ?? 0,
          colors: defaults.colors ?? ['#ffffff'],
          fadeIn: defaults.fadeIn ?? 5,
          fadeOut: defaults.fadeOut ?? 10,
        }

        state.emitters.push(emitter)
        state.selectedEmitterId = id
      }),

    removeEmitter: (id) =>
      set((state) => {
        state.emitters = state.emitters.filter((e) => e.id !== id)
        if (state.selectedEmitterId === id) {
          state.selectedEmitterId = null
        }
      }),

    updateEmitter: (id, updates) =>
      set((state) => {
        const emitter = state.emitters.find((e) => e.id === id)
        if (emitter) {
          Object.assign(emitter, updates)
        }
      }),

    setSelectedEmitterId: (id) =>
      set((state) => {
        state.selectedEmitterId = id
      }),

    duplicateEmitter: (id) =>
      set((state) => {
        const source = state.emitters.find((e) => e.id === id)
        if (!source) return
        const newId = `particle-${Date.now()}`
        const clone: ParticleEmitter = {
          ...JSON.parse(JSON.stringify(source)),
          id: newId,
          name: `${source.name} copy`,
        }
        state.emitters.push(clone)
        state.selectedEmitterId = newId
      }),

    clearEmitters: () =>
      set((state) => {
        state.emitters = []
        state.selectedEmitterId = null
      }),

    loadFromSnapshot: (emitters) =>
      set((state) => {
        state.emitters = emitters
        state.selectedEmitterId = null
      }),
  }))
)
