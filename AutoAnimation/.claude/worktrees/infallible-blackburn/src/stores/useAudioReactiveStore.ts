import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useTimelineStore } from './useTimelineStore'
import { useKeyframeStore } from './useKeyframeStore'
import type { AudioReactiveMapping } from '@/services/audioReactiveEngine'
import { getAudioReactiveEngine } from '@/services/audioReactiveEngine'
import { computeFrequencyBands } from '@/services/beatDetection'
import type { FrequencyBand } from '@/services/frequencyBands'

const AUDIO_REACTIVE_TAG = 'audio-reactive'

// ── Types ──

export type AudioReactiveVisualizerType = 'bars' | 'waveform' | 'pulse' | 'circular' | 'spectrum'

export interface AudioReactiveVisualizer {
  id: string
  name: string
  type: AudioReactiveVisualizerType
  visible: boolean
  position: { x: number; y: number }
  width: number
  height: number
  rotation: number
  opacity: number
  zIndex: number
  startFrame: number
  endFrame: number

  // Audio source
  /** When null, uses the first available audio track (voice/media) */
  audioSourceId: string | null

  // Visual config
  barCount: number
  barWidth: number
  barGap: number
  barRadius: number
  color: string
  gradientColors: string[]
  useGradient: boolean
  mirrorX: boolean
  mirrorY: boolean

  // Reactivity
  sensitivity: number // 0-2 multiplier
  smoothing: number // 0-0.99 smoothing factor
  minFrequency: number // Hz (20-20000)
  maxFrequency: number // Hz (20-20000)
  minAmplitude: number // minimum bar height (0-1)
  maxAmplitude: number // maximum bar height (0-1)

  // Pulse-specific
  pulseScale: number // max scale for pulse effect
  pulseShape: 'circle' | 'ring' | 'square'

  // Waveform-specific
  lineWidth: number
  fillBelow: boolean
}

const DEFAULT_VISUALIZER: Omit<AudioReactiveVisualizer, 'id' | 'name'> = {
  type: 'bars',
  visible: true,
  position: { x: 100, y: 100 },
  width: 400,
  height: 200,
  rotation: 0,
  opacity: 1,
  zIndex: 8.5,
  startFrame: 0,
  endFrame: 150,
  audioSourceId: null,
  barCount: 32,
  barWidth: 8,
  barGap: 3,
  barRadius: 2,
  color: '#8b5cf6',
  gradientColors: ['#8b5cf6', '#3b82f6', '#06b6d4'],
  useGradient: true,
  mirrorX: false,
  mirrorY: false,
  sensitivity: 1.0,
  smoothing: 0.7,
  minFrequency: 80,
  maxFrequency: 12000,
  minAmplitude: 0.05,
  maxAmplitude: 1.0,
  pulseScale: 1.5,
  pulseShape: 'circle',
  lineWidth: 2,
  fillBelow: false,
}

// ── Audio analysis engine ──

interface AnalyserState {
  analyser: AnalyserNode | null
  dataArray: Uint8Array | null
  audioContext: AudioContext | null
  source: MediaElementAudioSourceNode | null
}

let globalAnalyserState: AnalyserState = {
  analyser: null,
  dataArray: null,
  audioContext: null,
  source: null,
}

/**
 * Connect an audio element to the Web Audio API analyser.
 * Safe to call multiple times - will reuse existing context.
 */
export function connectAudioElement(audioElement: HTMLAudioElement): void {
  try {
    if (!globalAnalyserState.audioContext) {
      globalAnalyserState.audioContext = new AudioContext()
    }
    const ctx = globalAnalyserState.audioContext

    // Avoid double-connecting the same element
    if (globalAnalyserState.source) {
      try {
        globalAnalyserState.source.disconnect()
      } catch {
        /* ignore */
      }
    }

    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.7

    const source = ctx.createMediaElementSource(audioElement)
    source.connect(analyser)
    analyser.connect(ctx.destination)

    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    globalAnalyserState = {
      audioContext: ctx,
      analyser,
      source,
      dataArray,
    }
  } catch (e) {
    console.warn('AudioReactive: failed to connect audio element', e)
  }
}

/**
 * Get current frequency data (0-255 per bin).
 * Returns null if no analyser is connected.
 */
export function getFrequencyData(): Uint8Array | null {
  const { analyser, dataArray } = globalAnalyserState
  if (!analyser || !dataArray) return null
  analyser.getByteFrequencyData(dataArray)
  return dataArray
}

/**
 * Get current time-domain waveform data (0-255 per sample, 128 = center).
 * Returns null if no analyser is connected.
 */
export function getTimeDomainData(): Uint8Array | null {
  const { analyser } = globalAnalyserState
  if (!analyser) return null
  const data = new Uint8Array(analyser.frequencyBinCount)
  analyser.getByteTimeDomainData(data)
  return data
}

/**
 * Disconnect and clean up the audio analyser.
 */
export function disconnectAudio(): void {
  try {
    globalAnalyserState.source?.disconnect()
    globalAnalyserState.analyser?.disconnect()
    globalAnalyserState.audioContext?.close()
  } catch {
    /* ignore */
  }
  globalAnalyserState = { analyser: null, dataArray: null, audioContext: null, source: null }
}

/**
 * Generate simulated frequency data for export / preview without live audio.
 * Uses a deterministic algorithm seeded by the frame number so exports are reproducible.
 */
export function generateSimulatedFrequencyData(frame: number, binCount: number = 128): Uint8Array {
  const data = new Uint8Array(binCount)
  // Simple deterministic pseudo-random based on frame
  const seed = frame * 2654435761 // Knuth's multiplicative hash
  for (let i = 0; i < binCount; i++) {
    const t = (seed + i * 127) & 0xffffffff
    // Create frequency-shaped envelope (bass-heavy with rolloff)
    const freqEnvelope = Math.exp(-i / (binCount * 0.3))
    // Add some "beat" variation based on frame
    const beatPhase = Math.sin(frame * 0.15 + i * 0.05) * 0.3 + 0.7
    const noise = ((t * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff
    const value = freqEnvelope * beatPhase * (0.5 + noise * 0.5) * 200
    data[i] = Math.min(255, Math.max(0, Math.round(value)))
  }
  return data
}

// ── Store ──

interface AudioReactiveState {
  visualizers: AudioReactiveVisualizer[]
  selectedVisualizerId: string | null

  // ── Audio reactive mappings (property-level reactivity) ──
  /** All configured audio reactive mappings */
  mappings: AudioReactiveMapping[]
  /** Whether audio reactive processing is active during playback */
  isActive: boolean
  /** Whether live preview is enabled */
  previewMode: boolean

  // Visualizer actions
  addVisualizer: (type: AudioReactiveVisualizerType) => void
  removeVisualizer: (id: string) => void
  updateVisualizer: (id: string, updates: Partial<AudioReactiveVisualizer>) => void
  setSelectedVisualizerId: (id: string | null) => void
  duplicateVisualizer: (id: string) => void
  clearVisualizers: () => void
  loadFromSnapshot: (visualizers: AudioReactiveVisualizer[]) => void

  // Mapping actions
  addMapping: (mapping: Omit<AudioReactiveMapping, 'id'>) => string
  updateMapping: (id: string, updates: Partial<Omit<AudioReactiveMapping, 'id'>>) => void
  removeMapping: (id: string) => void
  setActive: (active: boolean) => void
  setPreviewMode: (preview: boolean) => void

  /**
   * Pre-bake all reactive values as keyframes for export.
   * Iterates every frame, computes reactive values, and writes
   * tagged keyframes to useKeyframeStore.
   */
  bakeToKeyframes: (fps: number, totalFrames: number, audioBuffer: AudioBuffer) => Promise<number>

  /** Apply a preset mapping configuration */
  applyPreset: (
    presetId: 'bass-pulse' | 'treble-sparkle' | 'full-bounce',
    targetObjectRef: { objectType: string; objectId: string },
  ) => void

  /** Remove all audio-reactive keyframes for an object */
  clearBakedKeyframes: (objectRef: { objectType: string; objectId: string }) => void

  /** Reset all mapping state */
  resetMappings: () => void

  /**
   * Tear down the global AudioContext and analyser nodes.
   * Call this when the audio-reactive feature is unmounted or no longer needed
   * to free the browser AudioContext slot (browsers limit ~6 per tab).
   */
  destroyAnalyser: () => void
}

function generateMappingId(): string {
  return `ar_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export const useAudioReactiveStore = create<AudioReactiveState>()(
  immer((set, get) => ({
    visualizers: [],
    selectedVisualizerId: null,
    mappings: [],
    isActive: false,
    previewMode: false,

    addVisualizer: (type) =>
      set((state) => {
        const { totalFrames } = useTimelineStore.getState()
        const id = `audio-reactive-${Date.now()}`
        const count = state.visualizers.filter((v) => v.type === type).length

        const typeLabels: Record<AudioReactiveVisualizerType, string> = {
          bars: 'Bar Visualizer',
          waveform: 'Waveform',
          pulse: 'Pulse',
          circular: 'Circular Viz',
          spectrum: 'Spectrum',
        }

        const visualizer: AudioReactiveVisualizer = {
          ...DEFAULT_VISUALIZER,
          id,
          name: `${typeLabels[type]} ${count + 1}`,
          type,
          endFrame: totalFrames,
        }

        state.visualizers.push(visualizer)
        state.selectedVisualizerId = id
      }),

    removeVisualizer: (id) =>
      set((state) => {
        state.visualizers = state.visualizers.filter((v) => v.id !== id)
        if (state.selectedVisualizerId === id) {
          state.selectedVisualizerId = null
        }
      }),

    updateVisualizer: (id, updates) =>
      set((state) => {
        const viz = state.visualizers.find((v) => v.id === id)
        if (viz) {
          Object.assign(viz, updates)
        }
      }),

    setSelectedVisualizerId: (id) =>
      set((state) => {
        state.selectedVisualizerId = id
      }),

    duplicateVisualizer: (id) =>
      set((state) => {
        const source = state.visualizers.find((v) => v.id === id)
        if (!source) return
        const newId = `audio-reactive-${Date.now()}`
        const clone: AudioReactiveVisualizer = {
          ...JSON.parse(JSON.stringify(source)),
          id: newId,
          name: `${source.name} copy`,
          position: { x: source.position.x + 20, y: source.position.y + 20 },
        }
        state.visualizers.push(clone)
        state.selectedVisualizerId = newId
      }),

    clearVisualizers: () =>
      set((state) => {
        state.visualizers = []
        state.selectedVisualizerId = null
      }),

    loadFromSnapshot: (visualizers) =>
      set((state) => {
        state.visualizers = visualizers
        state.selectedVisualizerId = null
      }),

    // ── Mapping actions ──────────────────────────────────────────────

    addMapping: (mapping) => {
      const id = generateMappingId()
      const fullMapping: AudioReactiveMapping = { ...mapping, id }

      set((s) => {
        s.mappings.push(fullMapping)
      })

      // Also register with the engine
      getAudioReactiveEngine().addMapping(fullMapping)
      return id
    },

    updateMapping: (id, updates) => {
      set((s) => {
        const mapping = s.mappings.find((m) => m.id === id)
        if (mapping) {
          Object.assign(mapping, updates)
          // Re-register with engine
          getAudioReactiveEngine().addMapping({ ...mapping })
        }
      })
    },

    removeMapping: (id) => {
      set((s) => {
        s.mappings = s.mappings.filter((m) => m.id !== id)
      })
      getAudioReactiveEngine().removeMapping(id)
    },

    setActive: (active) =>
      set((s) => {
        s.isActive = active
      }),

    setPreviewMode: (preview) =>
      set((s) => {
        s.previewMode = preview
      }),

    bakeToKeyframes: async (fps, totalFrames, audioBuffer) => {
      const { mappings } = get()
      if (mappings.length === 0) return 0

      const engine = getAudioReactiveEngine()
      const kfStore = useKeyframeStore.getState()

      // Pre-compute frequency bands for all frames
      const bandData = computeFrequencyBands(audioBuffer, fps)
      engine.setPreBakedData(bandData, fps)
      engine.resetSmoothing()

      let keyframeCount = 0

      // Remove old audio-reactive keyframes for all mapped objects
      const seenRefs = new Set<string>()
      for (const mapping of mappings) {
        const refKey = `${mapping.targetObjectRef.objectType}:${mapping.targetObjectRef.objectId}`
        if (!seenRefs.has(refKey)) {
          kfStore.removeTaggedKeyframes(
            { objectType: mapping.targetObjectRef.objectType as any, objectId: mapping.targetObjectRef.objectId },
            AUDIO_REACTIVE_TAG,
          )
          seenRefs.add(refKey)
        }
      }

      // Bake keyframes for every frame
      for (let frame = 0; frame < totalFrames; frame++) {
        const values = engine.getValuesAtFrame(frame)

        for (const [objKey, propMap] of values) {
          const [objectType, objectId] = objKey.split(':')
          const ref = { objectType: objectType as any, objectId }

          for (const [property, value] of propMap) {
            kfStore.setTaggedKeyframe(ref, property, frame, value, 'ease-out', AUDIO_REACTIVE_TAG)
            keyframeCount++
          }
        }
      }

      engine.clearPreBakedData()
      engine.resetSmoothing()

      return keyframeCount
    },

    applyPreset: (presetId, targetObjectRef) => {
      const addMapping = get().addMapping

      switch (presetId) {
        case 'bass-pulse':
          addMapping({
            audioSource: 'music',
            frequencyBand: 'bass' as FrequencyBand,
            targetObjectRef,
            targetProperty: 'scale',
            sensitivity: 0.8,
            smoothing: 50,
            minValue: 0,
            maxValue: 0.15,
            invert: false,
          })
          break
        case 'treble-sparkle':
          addMapping({
            audioSource: 'music',
            frequencyBand: 'treble' as FrequencyBand,
            targetObjectRef,
            targetProperty: 'opacity',
            sensitivity: 0.6,
            smoothing: 30,
            minValue: -0.3,
            maxValue: 0,
            invert: false,
          })
          break
        case 'full-bounce':
          addMapping({
            audioSource: 'music',
            frequencyBand: 'amplitude' as FrequencyBand,
            targetObjectRef,
            targetProperty: 'position.y',
            sensitivity: 0.7,
            smoothing: 80,
            minValue: -20,
            maxValue: 0,
            invert: false,
          })
          break
      }
    },

    clearBakedKeyframes: (objectRef) => {
      const kfStore = useKeyframeStore.getState()
      kfStore.removeTaggedKeyframes(
        { objectType: objectRef.objectType as any, objectId: objectRef.objectId },
        AUDIO_REACTIVE_TAG,
      )
    },

    resetMappings: () => {
      set((s) => {
        s.mappings = []
        s.isActive = false
        s.previewMode = false
      })

      const engine = getAudioReactiveEngine()
      engine.clearPreBakedData()
      engine.resetSmoothing()
    },

    destroyAnalyser: () => {
      disconnectAudio()
    },
  })),
)
