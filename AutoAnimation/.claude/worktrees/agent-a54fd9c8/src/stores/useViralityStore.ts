/**
 * Virality Store -- manages AI virality scoring state with history,
 * comparison snapshots, and hash-based deduplication.
 */

import { create } from 'zustand'
import type { ViralScore } from '@/types/orchestrator'

/** Max number of scores to retain in history */
const MAX_HISTORY = 20
/** Max number of named comparison snapshots */
const MAX_SNAPSHOTS = 3

export interface ViralitySnapshot {
  id: string
  name: string
  score: ViralScore
  capturedAt: number
}

export interface ScoringConfig {
  /** Whether to auto-score on project changes */
  autoScore: boolean
  /** Debounce interval in ms (default 2000) */
  debounceMs: number
}

interface ViralityState {
  currentScore: ViralScore | null
  scoreHistory: ViralScore[]
  isScoring: boolean
  error: string | null
  lastScoredHash: string | null
  comparisonSnapshots: ViralitySnapshot[]
  scoringConfig: ScoringConfig

  // Actions
  setCurrentScore: (score: ViralScore) => void
  setIsScoring: (scoring: boolean) => void
  setError: (error: string | null) => void
  setLastScoredHash: (hash: string) => void
  triggerScore: (prompt?: string) => Promise<void>
  saveSnapshot: (name: string) => void
  removeSnapshot: (id: string) => void
  clearHistory: () => void
  getCachedScore: (hash: string) => ViralScore | null
  setScoringConfig: (config: Partial<ScoringConfig>) => void
  reset: () => void
}

export const useViralityStore = create<ViralityState>((set, get) => ({
  currentScore: null,
  scoreHistory: [],
  isScoring: false,
  error: null,
  lastScoredHash: null,
  comparisonSnapshots: [],
  scoringConfig: {
    autoScore: true,
    debounceMs: 2000,
  },

  setCurrentScore: (score) =>
    set((state) => {
      const history = [score, ...state.scoreHistory].slice(0, MAX_HISTORY)
      return { currentScore: score, scoreHistory: history, error: null }
    }),

  setIsScoring: (scoring) => set({ isScoring: scoring }),

  setError: (error) => set({ error, isScoring: false }),

  setLastScoredHash: (hash) => set({ lastScoredHash: hash }),

  triggerScore: async (prompt = '') => {
    const state = get()
    if (state.isScoring) return

    set({ isScoring: true, error: null })

    try {
      const { scoreViaWorker, scoreClientSide } = await import('@/services/viralityScoreWorker')
      const { extractClipMetadata } = await import('@/services/viralityScorer')
      const { computeProjectStateHash } = await import('@/services/viralityStateHash')

      const metadata = extractClipMetadata()
      const hash = computeProjectStateHash()

      // Check cache first
      const cached = get().getCachedScore(hash)
      if (cached) {
        set({
          currentScore: cached,
          isScoring: false,
          lastScoredHash: hash,
        })
        return
      }

      // Primary path: client-side heuristic scoring (instant, no API key needed).
      // If a Gemini API key is configured, scoreViaWorker will attempt a deep
      // AI analysis via a Web Worker but falls back to client-side on failure.
      let score: import('@/types/orchestrator').ViralScore

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (apiKey && prompt) {
        // Deep AI analysis via Gemini worker (falls back to client-side on error)
        score = await scoreViaWorker(metadata, prompt)
      } else {
        // Pure client-side heuristic scoring
        const result = scoreClientSide(metadata)
        score = result.score
      }

      // Attach metadata to score
      score.timestamp = Date.now()
      score.projectStateHash = hash

      const history = [score, ...get().scoreHistory].slice(0, MAX_HISTORY)
      set({
        currentScore: score,
        scoreHistory: history,
        isScoring: false,
        lastScoredHash: hash,
        error: null,
      })
    } catch (err) {
      // Final fallback: try pure client-side scoring even if imports partially failed
      try {
        const { scoreClientSide } = await import('@/services/viralityScoreWorker')
        const { extractClipMetadata } = await import('@/services/viralityScorer')
        const metadata = extractClipMetadata()
        const { score } = scoreClientSide(metadata)
        score.timestamp = Date.now()
        const history = [score, ...get().scoreHistory].slice(0, MAX_HISTORY)
        set({
          currentScore: score,
          scoreHistory: history,
          isScoring: false,
          error: null,
        })
      } catch {
        set({
          error: err instanceof Error ? err.message : 'Scoring failed',
          isScoring: false,
        })
      }
    }
  },

  saveSnapshot: (name) =>
    set((state) => {
      if (!state.currentScore) return state
      const snapshot: ViralitySnapshot = {
        id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name,
        score: { ...state.currentScore },
        capturedAt: Date.now(),
      }
      const snapshots = [snapshot, ...state.comparisonSnapshots].slice(0, MAX_SNAPSHOTS)
      return { comparisonSnapshots: snapshots }
    }),

  removeSnapshot: (id) =>
    set((state) => ({
      comparisonSnapshots: state.comparisonSnapshots.filter((s) => s.id !== id),
    })),

  clearHistory: () => set({ scoreHistory: [], lastScoredHash: null }),

  getCachedScore: (hash) => {
    const { scoreHistory } = get()
    return scoreHistory.find((s) => s.projectStateHash === hash) || null
  },

  setScoringConfig: (config) =>
    set((state) => ({
      scoringConfig: { ...state.scoringConfig, ...config },
    })),

  reset: () =>
    set({
      currentScore: null,
      scoreHistory: [],
      isScoring: false,
      error: null,
      lastScoredHash: null,
      comparisonSnapshots: [],
    }),
}))
