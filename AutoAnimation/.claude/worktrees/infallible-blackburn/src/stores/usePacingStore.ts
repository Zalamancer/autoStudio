import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  analyzePacing,
  type PacingAnalysis,
  type PacingSegment,
  type PacingIssue,
  type PacingProfileId,
} from '@/services/pacingAnalyzer'
import { useTimelineStore } from '@/stores/useTimelineStore'

interface PacingState {
  // Analysis results
  analysis: PacingAnalysis | null
  segments: PacingSegment[]
  issues: PacingIssue[]
  overallScore: number
  heatmapData: Map<number, number> // frame -> intensity 0-1
  isAnalyzing: boolean

  // Selected pacing profile
  profileId: PacingProfileId

  // Heatmap visibility
  heatmapVisible: boolean

  // Actions
  analyze: () => void
  setProfile: (profileId: PacingProfileId) => void
  clearResults: () => void
  toggleHeatmap: () => void
  setHeatmapVisible: (visible: boolean) => void
}

export const usePacingStore = create<PacingState>()(
  immer((set, get) => ({
    analysis: null,
    segments: [],
    issues: [],
    overallScore: 0,
    heatmapData: new Map(),
    isAnalyzing: false,
    profileId: 'fast-tiktok' as PacingProfileId,
    heatmapVisible: true,

    analyze: () => {
      set((state) => {
        state.isAnalyzing = true
      })

      // Read timeline params
      const { fps, totalFrames } = useTimelineStore.getState()
      const profileId = get().profileId

      // Run analysis (synchronous — reads from stores)
      const result = analyzePacing(fps, totalFrames, profileId)

      set((state) => {
        state.analysis = result as PacingAnalysis
        state.segments = result.segments
        state.issues = result.issues
        state.overallScore = result.overallScore
        state.heatmapData = result.heatmap as Map<number, number>
        state.isAnalyzing = false
      })
    },

    setProfile: (profileId) => {
      set((state) => {
        state.profileId = profileId
      })
      // Re-analyze with new profile if we have existing results
      if (get().analysis) {
        get().analyze()
      }
    },

    clearResults: () =>
      set((state) => {
        state.analysis = null
        state.segments = []
        state.issues = []
        state.overallScore = 0
        state.heatmapData = new Map()
        state.isAnalyzing = false
      }),

    toggleHeatmap: () =>
      set((state) => {
        state.heatmapVisible = !state.heatmapVisible
      }),

    setHeatmapVisible: (visible) =>
      set((state) => {
        state.heatmapVisible = visible
      }),
  }))
)
