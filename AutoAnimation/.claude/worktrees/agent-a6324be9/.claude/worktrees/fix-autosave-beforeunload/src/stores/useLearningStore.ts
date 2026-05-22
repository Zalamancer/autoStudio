/**
 * Learning Store: manages AI content performance learning state.
 * Handles insights, recommendations, scoring, and snapshot capture.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  LearnedPattern,
  Recommendation,
  ScoreResult,
  GeminiAnalysisResult,
  LearningContext,
} from '@/types/learning'
import type { SocialPlatform } from '@/types/social'
import {
  getInsights,
  getRecommendations,
  getScore,
  triggerGeminiAnalysis,
  captureSnapshot as apiCaptureSnapshot,
  updateRecommendationStatus,
} from '@/services/learningService'
import { extractProjectFeatures } from '@/services/featureExtractor'
import { useEditorStore } from '@/stores/useEditorStore'
import { usePlaybackStore } from '@/stores/usePlaybackStore'
import { useVoiceStore } from '@/stores/useVoiceStore'

interface LearningState {
  // Insights
  insights: LearnedPattern[]
  isLoadingInsights: boolean

  // Recommendations for current project
  recommendations: Recommendation[]
  isLoadingRecommendations: boolean

  // Scoring
  currentScore: ScoreResult | null
  isScoring: boolean

  // Gemini analysis
  isAnalyzing: boolean
  lastAnalyzedAt: string | null
  analysisResult: GeminiAnalysisResult | null

  // Error
  error: string | null

  // Actions
  fetchInsights: (platform?: SocialPlatform) => Promise<void>
  fetchRecommendations: (recordingId: string, platform?: SocialPlatform) => Promise<void>
  scoreCurrentProject: (platform: SocialPlatform) => Promise<void>
  triggerGeminiAnalysis: (platform: SocialPlatform, recordingId?: string) => Promise<void>
  captureSnapshot: (
    recordingId: string,
    platform: SocialPlatform,
    publishedPostId?: string,
    projectId?: string,
  ) => Promise<string | null>
  applyRecommendation: (recommendation: Recommendation) => Promise<void>
  dismissRecommendation: (id: string) => void
  getLearningContext: () => LearningContext
  reset: () => void
}

export const useLearningStore = create<LearningState>()(
  immer((set, get) => ({
    insights: [],
    isLoadingInsights: false,
    recommendations: [],
    isLoadingRecommendations: false,
    currentScore: null,
    isScoring: false,
    isAnalyzing: false,
    lastAnalyzedAt: null,
    analysisResult: null,
    error: null,

    fetchInsights: async (platform) => {
      set((s) => {
        s.isLoadingInsights = true
        s.error = null
      })
      try {
        const { insights } = await getInsights(platform)
        set((s) => {
          s.insights = insights
          s.isLoadingInsights = false
        })
      } catch (err: unknown) {
        console.warn('[Learning] Failed to fetch insights:', err)
        set((s) => {
          s.isLoadingInsights = false
          s.error = err instanceof Error ? err.message : String(err)
        })
      }
    },

    fetchRecommendations: async (recordingId, platform) => {
      set((s) => {
        s.isLoadingRecommendations = true
        s.error = null
      })
      try {
        const { recommendations } = await getRecommendations(recordingId, platform)
        set((s) => {
          s.recommendations = recommendations
          s.isLoadingRecommendations = false
        })
      } catch (err: unknown) {
        console.warn('[Learning] Failed to fetch recommendations:', err)
        set((s) => {
          s.isLoadingRecommendations = false
          s.error = err instanceof Error ? err.message : String(err)
        })
      }
    },

    scoreCurrentProject: async (platform) => {
      set((s) => {
        s.isScoring = true
        s.error = null
      })
      try {
        const features = extractProjectFeatures(platform)
        const result = await getScore(platform, features.featureVector)

        // Merge any recommendations from scoring into the recommendations list
        if (result.recommendations && result.recommendations.length > 0) {
          set((s) => {
            s.currentScore = { score: result.score, confidence: result.confidence, factors: result.factors }
            s.recommendations = result.recommendations
            s.isScoring = false
          })
        } else {
          set((s) => {
            s.currentScore = { score: result.score, confidence: result.confidence, factors: result.factors }
            s.isScoring = false
          })
        }
      } catch (err: unknown) {
        console.warn('[Learning] Failed to score project:', err)
        set((s) => {
          s.isScoring = false
          s.error = err instanceof Error ? err.message : String(err)
        })
      }
    },

    triggerGeminiAnalysis: async (platform, recordingId) => {
      set((s) => {
        s.isAnalyzing = true
        s.error = null
      })
      try {
        const features = extractProjectFeatures(platform)
        const result = await triggerGeminiAnalysis(
          platform,
          recordingId,
          features as unknown as Record<string, unknown>,
        )

        set((s) => {
          s.analysisResult = result
          s.isAnalyzing = false
          s.lastAnalyzedAt = new Date().toISOString()

          // Merge Gemini recommendations into the list
          if (result.recommendations.length > 0) {
            const existingIds = new Set(s.recommendations.map((r) => r.id))
            for (const rec of result.recommendations) {
              if (!existingIds.has(rec.id)) {
                s.recommendations.push(rec)
              }
            }
          }
        })
      } catch (err: unknown) {
        console.warn('[Learning] Gemini analysis failed:', err)
        set((s) => {
          s.isAnalyzing = false
          s.error = err instanceof Error ? err.message : String(err)
        })
      }
    },

    captureSnapshot: async (recordingId, platform, publishedPostId, projectId) => {
      try {
        const snapshot = extractProjectFeatures(platform)
        const { snapshotId } = await apiCaptureSnapshot(recordingId, platform, snapshot, projectId, publishedPostId)
        return snapshotId
      } catch (err: unknown) {
        console.warn('[Learning] Failed to capture snapshot:', err)
        return null
      }
    },

    applyRecommendation: async (recommendation) => {
      const { actionType, actionPayload } = recommendation

      if (!actionType) return

      try {
        switch (actionType) {
          case 'set_aspect_ratio': {
            const ratio = actionPayload.aspectRatio as string
            if (ratio) useEditorStore.getState().setAspectRatio(ratio as any)
            break
          }
          case 'set_duration': {
            const duration = actionPayload.durationSeconds as number
            if (duration) {
              const store = usePlaybackStore.getState()
              if ('setDuration' in store) (store as any).setDuration(duration)
            }
            break
          }
          case 'set_caption_style': {
            const style = actionPayload.captionStyle as string
            if (style) {
              const store = useVoiceStore.getState()
              if ('setCaptionStyle' in store) (store as any).setCaptionStyle(style)
            }
            break
          }
          case 'add_cta':
          case 'add_emotion':
          case 'change_posting_time':
            // These are informational — no auto-apply for posting time
            break
        }

        // Mark as applied in backend
        if (recommendation.id) {
          await updateRecommendationStatus(recommendation.id, 'applied')
        }

        set((s) => {
          const rec = s.recommendations.find((r) => r.id === recommendation.id)
          if (rec) {
            rec.status = 'applied'
            rec.appliedAt = new Date().toISOString()
          }
        })
      } catch (err: unknown) {
        console.warn('[Learning] Failed to apply recommendation:', err)
      }
    },

    dismissRecommendation: (id) => {
      updateRecommendationStatus(id, 'dismissed').catch(() => {})
      set((s) => {
        s.recommendations = s.recommendations.filter((r) => r.id !== id)
      })
    },

    getLearningContext: () => {
      const { recommendations, insights } = get()
      const context: LearningContext = {}

      // Extract recommendations that have been applied or are high priority
      const topRecs = recommendations.filter((r) => r.priority === 'high' && r.status === 'pending')

      for (const rec of topRecs) {
        if (rec.actionType === 'set_aspect_ratio' && rec.actionPayload.aspectRatio) {
          context.recommendedAspectRatio = rec.actionPayload.aspectRatio as string
        }
        if (rec.actionType === 'set_duration' && rec.actionPayload.durationSeconds) {
          context.recommendedDuration = rec.actionPayload.durationSeconds as number
        }
        if (rec.actionType === 'set_caption_style' && rec.actionPayload.captionStyle) {
          context.recommendedCaptionStyle = rec.actionPayload.captionStyle as string
        }
      }

      // Add top insights as context strings
      const topInsights = insights.slice(0, 5).map((i) => `${i.title}: ${i.description || ''}`)
      if (topInsights.length > 0) {
        context.performanceInsights = topInsights
      }

      return context
    },

    reset: () => {
      set((s) => {
        s.insights = []
        s.recommendations = []
        s.currentScore = null
        s.analysisResult = null
        s.error = null
        s.isLoadingInsights = false
        s.isLoadingRecommendations = false
        s.isScoring = false
        s.isAnalyzing = false
        s.lastAnalyzedAt = null
      })
    },
  })),
)
