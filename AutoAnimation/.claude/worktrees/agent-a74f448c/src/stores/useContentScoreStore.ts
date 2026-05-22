import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { ContentScore } from '@/types/faceSwap'

interface ContentScoreState {
  currentScore: ContentScore | null
  history: Array<{ score: ContentScore; timestamp: number }>
  autoScoreEnabled: boolean
  isScoring: boolean
  setCurrentScore: (score: ContentScore) => void
  addToHistory: (score: ContentScore) => void
  setAutoScoreEnabled: (enabled: boolean) => void
  setIsScoring: (scoring: boolean) => void
  clearHistory: () => void
}

export const useContentScoreStore = create<ContentScoreState>()(
  immer((set) => ({
    currentScore: null,
    history: [],
    autoScoreEnabled: false,
    isScoring: false,

    setCurrentScore: (score) => set((s) => { s.currentScore = score }),

    addToHistory: (score) => set((s) => {
      s.history.push({ score, timestamp: Date.now() })
      if (s.history.length > 50) s.history = s.history.slice(-50)
    }),

    setAutoScoreEnabled: (enabled) => set((s) => { s.autoScoreEnabled = enabled }),

    setIsScoring: (scoring) => set((s) => { s.isScoring = scoring }),

    clearHistory: () => set((s) => { s.history = [] }),
  }))
)
