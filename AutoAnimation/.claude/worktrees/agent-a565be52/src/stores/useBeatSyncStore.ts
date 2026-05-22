/**
 * Beat Sync Store — Manages beat analysis state and sync settings.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { detectBeatsFromUrl, redetectWithSensitivity, type BeatAnalysis } from '@/services/beatDetection'
import {
  beatsToFrames,
  generateObjectBeatKeyframes,
  getEffectProperties,
} from '@/services/beatSync'
import { useKeyframeStore } from '@/stores/useKeyframeStore'
import { usePlaybackStore } from '@/stores/usePlaybackStore'
import type { ObjectBeatSyncConfig, CanvasObjectRef, KeyframableObjectType } from '@/types/keyframes'

const BEAT_SYNC_TAG = 'beat-sync'

function configKey(ref: CanvasObjectRef): string {
  return `${ref.objectType}:${ref.objectId}`
}

/** Read current property values from native stores so beat pulses are relative */
async function readBaseValues(
  objectType: KeyframableObjectType,
  objectId: string,
  properties: string[],
): Promise<Record<string, number>> {
  const values: Record<string, number> = {}

  if (objectType === 'text') {
    const { useTextOverlayStore } = await import('@/stores/useTextOverlayStore')
    const overlay = useTextOverlayStore.getState().overlays.find((o) => o.id === objectId)
    if (overlay) {
      for (const prop of properties) {
        if (prop === 'fontSize') values.fontSize = overlay.fontSize ?? 48
        if (prop === 'opacity') values.opacity = overlay.opacity ?? 1
        if (prop === 'freeX') values.freeX = overlay.freeX ?? 0
        if (prop === 'freeY') values.freeY = overlay.freeY ?? 0
      }
    }
  } else if (objectType === 'shape') {
    const { useShapeStore } = await import('@/stores/useShapeStore')
    const shape = useShapeStore.getState().shapes.find((s) => s.id === objectId)
    if (shape) {
      for (const prop of properties) {
        if (prop === 'width') values.width = shape.width ?? 100
        if (prop === 'height') values.height = shape.height ?? 100
        if (prop === 'opacity') values.opacity = shape.opacity ?? 1
        if (prop === 'x') values.x = shape.position?.x ?? 0
        if (prop === 'y') values.y = shape.position?.y ?? 0
      }
    }
  } else if (objectType === 'media') {
    const { useMediaStore } = await import('@/stores/useMediaStore')
    const item = useMediaStore.getState().canvasItems.find((m) => m.id === objectId)
    if (item) {
      for (const prop of properties) {
        if (prop === 'scale') values.scale = item.scale ?? 1
        if (prop === 'opacity') values.opacity = item.opacity ?? 1
        if (prop === 'position.x') values['position.x'] = item.position?.x ?? 0
        if (prop === 'position.y') values['position.y'] = item.position?.y ?? 0
      }
    }
  } else {
    // character3d, video, lottie — default scale=1, opacity=1
    for (const prop of properties) {
      if (prop === 'scale') values.scale = 1
      if (prop === 'opacity') values.opacity = 1
      if (prop.startsWith('position.')) values[prop] = 0
    }
  }

  return values
}

interface BeatSyncState {
  /** Computed beat analysis */
  analysis: BeatAnalysis | null
  /** Whether beat markers are visible on the timeline */
  showBeatMarkers: boolean
  /** Whether analysis is in progress */
  isAnalyzing: boolean
  /** Error from analysis */
  error: string | null
  /** Per-object beat sync configs, keyed by objectType:objectId */
  objectConfigs: Record<string, ObjectBeatSyncConfig>
  /** Pre-computed waveform data (channel 0 raw samples downsampled) */
  waveformData: Float32Array | null
  /** Pre-computed spectrum data */
  spectrumData: Float32Array | null
  /** Detection sensitivity (0-1), maps to onset threshold adjustment */
  sensitivity: number
  /** Manual BPM override (null = use auto-detected) */
  manualBpm: number | null
  /** Beat grid offset in seconds (shifts all beat positions) */
  beatGridOffset: number
  /** The last analyzed audio URL (for re-detection) */
  lastAudioUrl: string | null
  /** The FPS that was active when beat-sync keyframes were last applied */
  analysisFps: number | null

  // Actions
  analyzeAudio: (audioUrl: string) => Promise<void>
  setShowBeatMarkers: (show: boolean) => void
  clearAnalysis: () => void
  reset: () => void
  setSensitivity: (sensitivity: number) => void
  setManualBpm: (bpm: number | null) => void
  setBeatGridOffset: (offset: number) => void
  regenerateBeatGrid: () => Promise<void>
  applyObjectBeatSync: (
    configs: ObjectBeatSyncConfig[],
    fps: number,
    clipRanges: Record<string, { startFrame: number; endFrame: number }>,
  ) => Promise<void>
  clearObjectBeatSync: (objectRefs: CanvasObjectRef[]) => void
  /** Recalculate beat-sync keyframe positions when FPS changes */
  recalculateBeatFramesForFps: (newFps: number) => void
}

export const useBeatSyncStore = create<BeatSyncState>()(
  immer((set, get) => ({
    analysis: null,
    showBeatMarkers: true,
    isAnalyzing: false,
    error: null,
    objectConfigs: {},
    waveformData: null,
    spectrumData: null,
    sensitivity: 0.5,
    manualBpm: null,
    beatGridOffset: 0,
    lastAudioUrl: null,
    analysisFps: null,

    analyzeAudio: async (audioUrl) => {
      set((s) => {
        s.isAnalyzing = true
        s.error = null
      })

      try {
        const analysis = await detectBeatsFromUrl(audioUrl)

        // Pre-compute waveform data for visualization
        let waveformData: Float32Array | null = null
        try {
          const response = await fetch(audioUrl)
          const arrayBuffer = await response.arrayBuffer()
          const tempCtx = new AudioContext()
          const decoded = await tempCtx.decodeAudioData(arrayBuffer)
          await tempCtx.close()
          // Downsample to 400 points for visualization
          const raw = decoded.getChannelData(0)
          const bucketSize = Math.max(1, Math.floor(raw.length / 400))
          const downsampled = new Float32Array(Math.min(400, raw.length))
          for (let i = 0; i < downsampled.length; i++) {
            let max = 0
            const start = i * bucketSize
            const end = Math.min(start + bucketSize, raw.length)
            for (let j = start; j < end; j++) {
              const abs = Math.abs(raw[j])
              if (abs > max) max = abs
            }
            downsampled[i] = max
          }
          waveformData = downsampled
        } catch {
          // Non-critical — visualization will just not show
        }

        set((s) => {
          s.analysis = analysis
          s.isAnalyzing = false
          s.showBeatMarkers = true
          s.waveformData = waveformData
          s.lastAudioUrl = audioUrl
          s.manualBpm = null
          s.beatGridOffset = 0
        })
      } catch (err) {
        set((s) => {
          s.error = err instanceof Error ? err.message : 'Beat analysis failed'
          s.isAnalyzing = false
        })
      }
    },

    setShowBeatMarkers: (show) =>
      set((s) => {
        s.showBeatMarkers = show
      }),

    setSensitivity: (sensitivity) => {
      set((s) => {
        s.sensitivity = Math.max(0.05, Math.min(0.95, sensitivity))
      })
    },

    setManualBpm: (bpm) => {
      set((s) => {
        s.manualBpm = bpm
      })
    },

    setBeatGridOffset: (offset) => {
      set((s) => {
        s.beatGridOffset = offset
      })
    },

    regenerateBeatGrid: async () => {
      const { lastAudioUrl, sensitivity, manualBpm, beatGridOffset } = get()
      if (!lastAudioUrl) return

      set((s) => {
        s.isAnalyzing = true
        s.error = null
      })

      try {
        const analysis = await redetectWithSensitivity(lastAudioUrl, sensitivity, manualBpm ?? undefined)

        // Apply beat grid offset
        if (beatGridOffset !== 0) {
          analysis.beats = analysis.beats.map((b) => b + beatGridOffset).filter((b) => b >= 0)
        }

        set((s) => {
          s.analysis = analysis
          s.isAnalyzing = false
        })
      } catch (err) {
        set((s) => {
          s.error = err instanceof Error ? err.message : 'Re-detection failed'
          s.isAnalyzing = false
        })
      }
    },

    clearAnalysis: () =>
      set((s) => {
        s.analysis = null
        s.showBeatMarkers = false
        s.waveformData = null
        s.spectrumData = null
        s.lastAudioUrl = null
      }),

    reset: () =>
      set((s) => {
        s.analysis = null
        s.showBeatMarkers = true
        s.isAnalyzing = false
        s.error = null
        s.objectConfigs = {}
        s.waveformData = null
        s.spectrumData = null
        s.sensitivity = 0.5
        s.manualBpm = null
        s.beatGridOffset = 0
        s.lastAudioUrl = null
        s.analysisFps = null
      }),

    applyObjectBeatSync: async (configs, fps, clipRanges) => {
      const analysis = get().analysis
      if (!analysis) return

      const beatFrames = beatsToFrames(analysis, fps)
      const kfStore = useKeyframeStore.getState()

      console.log(
        '[BeatSync Apply] fps=' + fps,
        'bpm=' + analysis.bpm,
        'totalBeats=' + analysis.beats.length,
        'beatTimestamps(first10)=' + JSON.stringify(analysis.beats.slice(0, 10).map((t) => +t.toFixed(3))),
        'beatFrames(first10)=' + JSON.stringify(beatFrames.slice(0, 10)),
      )

      for (const cfg of configs) {
        const key = configKey(cfg.objectRef)
        const objType = cfg.objectRef.objectType as KeyframableObjectType

        // Clear old beat-sync keyframes for this object
        kfStore.removeTaggedKeyframes(cfg.objectRef, BEAT_SYNC_TAG)

        const range = clipRanges[key] ?? { startFrame: 0, endFrame: beatFrames[beatFrames.length - 1] ?? 300 }

        // Read actual property values from native stores
        const properties = getEffectProperties(objType, cfg.effect)
        const baseValues = await readBaseValues(objType, cfg.objectRef.objectId, properties)

        console.log(
          '[BeatSync Apply] object: key=' + key,
          'type=' + objType,
          'effect=' + cfg.effect,
          'sub=' + cfg.subdivision,
          'offset=' + cfg.offset,
          'intensity=' + cfg.intensity,
          'range=' + range.startFrame + '-' + range.endFrame,
          'baseValues=' + JSON.stringify(baseValues),
        )

        // Generate new keyframes
        const keyframes = generateObjectBeatKeyframes(
          beatFrames,
          objType,
          range.startFrame,
          range.endFrame,
          {
            effect: cfg.effect,
            subdivision: cfg.subdivision,
            offset: cfg.offset,
            intensity: cfg.intensity,
            baseValues,
          },
        )

        console.log(
          '[BeatSync Apply] keyframes: count=' + keyframes.length,
          'first5=' + JSON.stringify(keyframes.slice(0, 5).map((kf) => kf.property + '@' + kf.frame + '=' + +kf.value.toFixed(3))),
          'last5=' + JSON.stringify(keyframes.slice(-5).map((kf) => kf.property + '@' + kf.frame + '=' + +kf.value.toFixed(3))),
        )

        // Write keyframes to the store
        for (const kf of keyframes) {
          kfStore.setTaggedKeyframe(
            cfg.objectRef,
            kf.property,
            kf.frame,
            kf.value,
            kf.easing,
            BEAT_SYNC_TAG,
          )
        }
      }

      // Store configs and the FPS used for this sync
      set((s) => {
        for (const cfg of configs) {
          s.objectConfigs[configKey(cfg.objectRef)] = cfg
        }
        s.analysisFps = fps
      })
    },

    clearObjectBeatSync: (objectRefs) => {
      const kfStore = useKeyframeStore.getState()
      for (const ref of objectRefs) {
        kfStore.removeTaggedKeyframes(ref, BEAT_SYNC_TAG)
      }
      set((s) => {
        for (const ref of objectRefs) {
          delete s.objectConfigs[configKey(ref)]
        }
      })
    },

    recalculateBeatFramesForFps: (newFps) => {
      const { analysisFps, objectConfigs } = get()
      if (!analysisFps || analysisFps === newFps) return

      if (Object.keys(objectConfigs).length === 0) return

      const ratio = newFps / analysisFps

      // Rescale all beat-sync tagged keyframe frame positions via keyframe store setState
      useKeyframeStore.setState((state) => {
        for (const track of state.tracks) {
          const key = configKey(track.objectRef)
          if (!(key in objectConfigs)) continue

          for (const kf of track.keyframes) {
            if (kf.tag === BEAT_SYNC_TAG) {
              kf.frame = Math.round(kf.frame * ratio)
            }
          }
          // Re-sort after frame changes
          track.keyframes.sort((a, b) => a.frame - b.frame)
        }
      })

      // Update stored FPS to the new value
      set((s) => {
        s.analysisFps = newFps
      })
    },
  }))
)

// Subscribe to FPS changes in playback store and recalculate beat-sync keyframes
let _prevFps = usePlaybackStore.getState().fps
usePlaybackStore.subscribe((state) => {
  if (state.fps !== _prevFps) {
    _prevFps = state.fps
    // Only recalculate if there are active beat-sync configs
    const beatState = useBeatSyncStore.getState()
    if (beatState.analysisFps && Object.keys(beatState.objectConfigs).length > 0) {
      beatState.recalculateBeatFramesForFps(state.fps)
    }
  }
})
