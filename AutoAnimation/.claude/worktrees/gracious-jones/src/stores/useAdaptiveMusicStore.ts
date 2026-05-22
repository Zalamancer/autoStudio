/**
 * Adaptive Music Store
 *
 * Zustand + Immer store for adaptive emotion-based music.
 * Manages music segments, generation state, crossfade settings,
 * and playback preview.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { EmotionEvent } from '@/services/emotionTimeline'
import type { DialogueLine } from '@/stores/useMultiCharacterStore'
import {
  analyzeEmotionsForMusic,
  analyzeDialogueForMusic,
  generateMusicForSegment,
  generateAllSegmentMusic,
  getSegmentVolumesAtFrame,
  getPlaybackRateForIntensity,
  type MusicSegment,
  type MusicMoodLabel,
  type CrossfadeConfig,
} from '@/services/adaptiveMusicEngine'

// ─── State Interface ──────────────────────────────────────────────────────

interface AdaptiveMusicState {
  /** Whether adaptive music mode is enabled */
  enabled: boolean

  /** All music segments derived from emotion analysis */
  segments: MusicSegment[]

  /** Total clip duration in frames */
  totalDurationFrames: number

  /** Dominant mood across all segments */
  dominantMood: MusicMoodLabel

  /** Crossfade configuration */
  crossfade: CrossfadeConfig

  /** Master volume (0-1) */
  masterVolume: number

  /** Whether music is being generated */
  isGenerating: boolean

  /** Current generation progress (0-based index of completed segments) */
  generationProgress: number

  /** Total segments to generate */
  generationTotal: number

  /** Error from last operation */
  error: string | null

  /** Whether preview playback is active */
  isPreviewPlaying: boolean

  /** Current preview frame */
  previewFrame: number

  // ─── Actions ──────────────────────────────────────────────────────

  /** Enable/disable adaptive music mode */
  setEnabled: (enabled: boolean) => void

  /** Analyze emotion events from the voice store and build segments */
  analyzeEmotions: (
    emotionEvents: EmotionEvent[],
    totalDurationFrames: number,
    fps: number,
  ) => void

  /** Analyze dialogue lines and build segments (alternative entry point) */
  analyzeDialogue: (
    dialogueLines: DialogueLine[],
    totalDurationFrames: number,
    fps: number,
  ) => void

  /** Generate music for a single segment */
  generateMusicForSegment: (segmentId: string) => Promise<void>

  /** Generate music for all segments */
  generateAllMusic: () => Promise<void>

  /** Override mood for a specific segment */
  setSegmentMood: (segmentId: string, mood: MusicMoodLabel) => void

  /** Set per-segment volume */
  setSegmentVolume: (segmentId: string, volume: number) => void

  /** Update segment boundary (startFrame or endFrame) */
  setSegmentBoundary: (
    segmentId: string,
    boundary: 'start' | 'end',
    frame: number,
  ) => void

  /** Set crossfade duration in frames */
  setCrossfadeDuration: (frames: number) => void

  /** Set crossfade curve type */
  setCrossfadeCurve: (curve: 'linear' | 'equal-power') => void

  /** Set master volume */
  setMasterVolume: (volume: number) => void

  /** Get computed volumes for all segments at a given frame */
  getVolumesAtFrame: (frame: number) => Record<string, number>

  /** Get playback rate for a segment based on its intensity */
  getPlaybackRate: (segmentId: string) => number

  /** Toggle preview playback */
  togglePreview: () => void

  /** Set preview frame */
  setPreviewFrame: (frame: number) => void

  /** Clear all segments and reset state */
  clearSegments: () => void

  /** Clear error */
  clearError: () => void

  /** Reset all state */
  reset: () => void
}

// ─── Store ────────────────────────────────────────────────────────────────

export const useAdaptiveMusicStore = create<AdaptiveMusicState>()(
  immer((set, get) => ({
    // Initial state
    enabled: false,
    segments: [],
    totalDurationFrames: 0,
    dominantMood: 'neutral',
    crossfade: {
      durationFrames: 15, // ~0.5s at 30fps
      curve: 'equal-power',
    },
    masterVolume: 0.7,
    isGenerating: false,
    generationProgress: 0,
    generationTotal: 0,
    error: null,
    isPreviewPlaying: false,
    previewFrame: 0,

    // ─── Actions ──────────────────────────────────────────────────────

    setEnabled: (enabled) =>
      set((state) => {
        state.enabled = enabled
      }),

    analyzeEmotions: (emotionEvents, totalDurationFrames, fps) => {
      try {
        const analysis = analyzeEmotionsForMusic(
          emotionEvents,
          totalDurationFrames,
          fps,
        )

        set((state) => {
          state.segments = analysis.segments
          state.totalDurationFrames = analysis.totalDurationFrames
          state.dominantMood = analysis.dominantMood
          state.error = null
        })
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Failed to analyze emotions'
        })
      }
    },

    analyzeDialogue: (dialogueLines, totalDurationFrames, fps) => {
      try {
        const analysis = analyzeDialogueForMusic(
          dialogueLines,
          totalDurationFrames,
          fps,
        )

        set((state) => {
          state.segments = analysis.segments
          state.totalDurationFrames = analysis.totalDurationFrames
          state.dominantMood = analysis.dominantMood
          state.error = null
        })
      } catch (err) {
        set((state) => {
          state.error = err instanceof Error ? err.message : 'Failed to analyze dialogue'
        })
      }
    },

    generateMusicForSegment: async (segmentId) => {
      const { segments } = get()
      const segment = segments.find((s) => s.id === segmentId)
      if (!segment) return

      set((state) => {
        state.isGenerating = true
        state.generationProgress = 0
        state.generationTotal = 1
        state.error = null
      })

      try {
        const updated = await generateMusicForSegment(segment)

        set((state) => {
          const idx = state.segments.findIndex((s) => s.id === segmentId)
          if (idx >= 0) {
            state.segments[idx] = updated
          }
          state.isGenerating = false
          state.generationProgress = 1
        })
      } catch (err) {
        set((state) => {
          state.isGenerating = false
          state.error = err instanceof Error ? err.message : 'Failed to generate music'
        })
      }
    },

    generateAllMusic: async () => {
      const { segments } = get()
      if (segments.length === 0) return

      set((state) => {
        state.isGenerating = true
        state.generationProgress = 0
        state.generationTotal = segments.length
        state.error = null
      })

      try {
        const updated = await generateAllSegmentMusic(
          segments,
          (completed, _total, segment) => {
            set((state) => {
              state.generationProgress = completed
              // Update the segment in-place
              const idx = state.segments.findIndex((s) => s.id === segment.id)
              if (idx >= 0) {
                state.segments[idx] = segment
              }
            })
          },
        )

        set((state) => {
          state.segments = updated
          state.isGenerating = false
        })
      } catch (err) {
        set((state) => {
          state.isGenerating = false
          state.error = err instanceof Error ? err.message : 'Failed to generate music'
        })
      }
    },

    setSegmentMood: (segmentId, mood) =>
      set((state) => {
        const seg = state.segments.find((s) => s.id === segmentId)
        if (seg) {
          seg.mood = mood
          // Clear existing audio since mood changed
          if (seg.audioUrl) {
            URL.revokeObjectURL(seg.audioUrl)
            seg.audioUrl = null
            seg.audioBlob = null
          }
        }
      }),

    setSegmentVolume: (segmentId, volume) =>
      set((state) => {
        const seg = state.segments.find((s) => s.id === segmentId)
        if (seg) {
          seg.volume = Math.max(0, Math.min(1, volume))
        }
      }),

    setSegmentBoundary: (segmentId, boundary, frame) =>
      set((state) => {
        const seg = state.segments.find((s) => s.id === segmentId)
        if (!seg) return

        if (boundary === 'start') {
          seg.startFrame = Math.max(0, Math.min(frame, seg.endFrame - 1))
        } else {
          seg.endFrame = Math.max(seg.startFrame + 1, frame)
        }

        // Recalculate duration
        const fps = 30 // approximate; caller should re-analyze if fps changed
        seg.durationMs = Math.round(((seg.endFrame - seg.startFrame) / fps) * 1000)
      }),

    setCrossfadeDuration: (frames) =>
      set((state) => {
        state.crossfade.durationFrames = Math.max(0, Math.min(60, frames))
      }),

    setCrossfadeCurve: (curve) =>
      set((state) => {
        state.crossfade.curve = curve
      }),

    setMasterVolume: (volume) =>
      set((state) => {
        state.masterVolume = Math.max(0, Math.min(1, volume))
      }),

    getVolumesAtFrame: (frame) => {
      const { segments, crossfade, masterVolume } = get()
      return getSegmentVolumesAtFrame(segments, frame, crossfade, masterVolume)
    },

    getPlaybackRate: (segmentId) => {
      const { segments } = get()
      const seg = segments.find((s) => s.id === segmentId)
      if (!seg) return 1
      return getPlaybackRateForIntensity(seg.intensity)
    },

    togglePreview: () =>
      set((state) => {
        state.isPreviewPlaying = !state.isPreviewPlaying
      }),

    setPreviewFrame: (frame) =>
      set((state) => {
        state.previewFrame = frame
      }),

    clearSegments: () =>
      set((state) => {
        // Revoke all audio URLs
        for (const seg of state.segments) {
          if (seg.audioUrl) URL.revokeObjectURL(seg.audioUrl)
        }
        state.segments = []
        state.totalDurationFrames = 0
        state.dominantMood = 'neutral'
        state.generationProgress = 0
        state.generationTotal = 0
      }),

    clearError: () =>
      set((state) => {
        state.error = null
      }),

    reset: () =>
      set((state) => {
        // Revoke all audio URLs
        for (const seg of state.segments) {
          if (seg.audioUrl) URL.revokeObjectURL(seg.audioUrl)
        }
        state.enabled = false
        state.segments = []
        state.totalDurationFrames = 0
        state.dominantMood = 'neutral'
        state.crossfade = { durationFrames: 15, curve: 'equal-power' }
        state.masterVolume = 0.7
        state.isGenerating = false
        state.generationProgress = 0
        state.generationTotal = 0
        state.error = null
        state.isPreviewPlaying = false
        state.previewFrame = 0
      }),
  })),
)
