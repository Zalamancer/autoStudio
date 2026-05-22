/**
 * Smart Cut Store — Silence/filler detection results and auto-cut state.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  detectAll,
  decodeAudioBlob,
  DEFAULT_SETTINGS,
  type SilenceRegion,
  type DetectionSettings,
  type WordTimestamp,
} from '@/services/silenceDetection'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { toast } from '@/stores/useToastStore'
import { logger } from '@/utils/logger'

type FilterMode = 'all' | 'silence' | 'fillers'

interface SmartCutState {
  // Detection results
  regions: SilenceRegion[]
  isAnalyzing: boolean
  hasAnalyzed: boolean

  // Settings
  settings: DetectionSettings
  filterMode: FilterMode

  // Actions
  analyzeAudio: (audioBlob: Blob, words: WordTimestamp[]) => Promise<void>
  toggleRegion: (regionId: string) => void
  toggleAll: (enabled: boolean) => void
  setFilterMode: (mode: FilterMode) => void
  updateSettings: (updates: Partial<DetectionSettings>) => void
  applySmartCut: () => void
  reset: () => void
}

export const useSmartCutStore = create<SmartCutState>()(
  immer((set, get) => ({
    regions: [],
    isAnalyzing: false,
    hasAnalyzed: false,
    settings: { ...DEFAULT_SETTINGS },
    filterMode: 'all',

    analyzeAudio: async (audioBlob: Blob, words: WordTimestamp[]) => {
      set((s) => {
        s.isAnalyzing = true
        s.hasAnalyzed = false
        s.regions = []
      })

      try {
        const audioBuffer = await decodeAudioBlob(audioBlob)
        const regions = detectAll(audioBuffer, words, get().settings)

        set((s) => {
          s.regions = regions
          s.isAnalyzing = false
          s.hasAnalyzed = true
        })

        const silenceCount = regions.filter((r) => r.type === 'silence').length
        const fillerCount = regions.filter((r) => r.type === 'filler').length
        toast.success(`Found ${silenceCount} silences and ${fillerCount} fillers`)
      } catch (err) {
        logger.error('[SmartCut] Analysis failed:', err)
        set((s) => {
          s.isAnalyzing = false
        })
        toast.error('Audio analysis failed')
      }
    },

    toggleRegion: (regionId: string) =>
      set((s) => {
        const region = s.regions.find((r) => r.id === regionId)
        if (region) region.enabled = !region.enabled
      }),

    toggleAll: (enabled: boolean) =>
      set((s) => {
        for (const region of s.regions) {
          region.enabled = enabled
        }
      }),

    setFilterMode: (mode: FilterMode) =>
      set((s) => {
        s.filterMode = mode
      }),

    updateSettings: (updates: Partial<DetectionSettings>) =>
      set((s) => {
        Object.assign(s.settings, updates)
      }),

    applySmartCut: () => {
      const { regions } = get()
      const enabledRegions = regions.filter((r) => r.enabled)
      if (enabledRegions.length === 0) {
        toast.error('No regions selected for removal')
        return
      }

      const fps = useTimelineStore.getState().fps || 30

      // Sort regions by start time so we can cascade offsets correctly
      const sortedRegions = [...enabledRegions].sort((a, b) => a.startTime - b.startTime)

      // Build cumulative frame offsets: for each removed region, subsequent
      // content shifts earlier by the region's duration in frames.
      const multiChar = useMultiCharacterStore.getState()
      const lines = [...multiChar.dialogueLines].sort((a, b) => a.startFrame - b.startFrame)

      // First pass: trim lines that contain a region, and build offset map
      let cumulativeOffset = 0
      const regionOffsets: { startFrame: number; offsetFrames: number }[] = []

      for (const region of sortedRegions) {
        const regionFrames = Math.round((region.endTime - region.startTime) * fps)
        const regionStartFrame = Math.round(region.startTime * fps)
        regionOffsets.push({ startFrame: regionStartFrame, offsetFrames: regionFrames })

        // Trim any line that contains this region
        for (const line of lines) {
          const lineStart = line.startFrame / fps
          const lineEnd = line.endFrame / fps
          if (region.startTime >= lineStart && region.endTime <= lineEnd) {
            const newEndFrame = line.endFrame - regionFrames
            if (newEndFrame > line.startFrame) {
              multiChar.updateDialogueLine(line.id, { endFrame: newEndFrame })
            }
          }
        }
      }

      // Second pass: cascade frame shifts — shift every line that starts after
      // a removed region earlier by the cumulative removed duration.
      // Re-read lines after trimming.
      const updatedLines = useMultiCharacterStore.getState().dialogueLines
      for (const line of updatedLines) {
        cumulativeOffset = 0
        for (const ro of regionOffsets) {
          if (line.startFrame > ro.startFrame) {
            cumulativeOffset += ro.offsetFrames
          }
        }
        if (cumulativeOffset > 0) {
          multiChar.updateDialogueLine(line.id, {
            startFrame: Math.max(0, line.startFrame - cumulativeOffset),
            endFrame: Math.max(1, line.endFrame - cumulativeOffset),
          })
        }
      }

      // Reduce total frames by total removed time
      const totalRemovedTime = enabledRegions.reduce((sum, r) => sum + (r.endTime - r.startTime), 0)
      const totalRemovedFrames = Math.round(totalRemovedTime * fps)
      const currentTotal = useTimelineStore.getState().totalFrames
      const newTotal = Math.max(fps, currentTotal - totalRemovedFrames) // at least 1 second
      useTimelineStore.getState().setTotalFrames(newTotal)

      toast.success(`Removed ${totalRemovedTime.toFixed(1)}s (${enabledRegions.length} regions)`)

      // Clear regions after applying
      set((s) => {
        s.regions = []
        s.hasAnalyzed = false
      })
    },

    reset: () =>
      set((s) => {
        s.regions = []
        s.isAnalyzing = false
        s.hasAnalyzed = false
        s.filterMode = 'all'
      }),
  })),
)
