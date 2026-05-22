import { create } from 'zustand'
import {
  generateAnimation,
  connectToProgress,
  getDownloadUrl,
  type JobProgressEvent,
} from '@/services/aiAnimation'

export interface GenerationRecord {
  id: string
  prompt: string
  videoUrl: string
  downloadUrl: string
  createdAt: number
  durationSeconds: number
  fps: number
  width: number
  height: number
}

interface AIAnimationState {
  // Settings
  prompt: string
  fps: number
  durationSeconds: number
  width: number
  height: number

  // Job tracking
  activeJobId: string | null
  phase: JobProgressEvent['phase'] | null
  progress: number
  message: string
  videoUrl: string | null
  error: string | null
  isGenerating: boolean

  // History
  generations: GenerationRecord[]

  // Actions
  setPrompt: (prompt: string) => void
  setFps: (fps: number) => void
  setDurationSeconds: (d: number) => void
  setWidth: (w: number) => void
  setHeight: (h: number) => void
  startGeneration: () => Promise<void>
  reset: () => void
}

// Keep reference to SSE cleanup function
let cleanupSSE: (() => void) | null = null

export const useAIAnimationStore = create<AIAnimationState>((set, get) => ({
  // Default settings
  prompt: '',
  fps: 30,
  durationSeconds: 10,
  width: 1920,
  height: 1080,

  // Job state
  activeJobId: null,
  phase: null,
  progress: 0,
  message: '',
  videoUrl: null,
  error: null,
  isGenerating: false,

  // History
  generations: [],

  // Actions
  setPrompt: (prompt) => set({ prompt }),
  setFps: (fps) => set({ fps }),
  setDurationSeconds: (durationSeconds) => set({ durationSeconds }),
  setWidth: (width) => set({ width }),
  setHeight: (height) => set({ height }),

  startGeneration: async () => {
    const { prompt, fps, durationSeconds, width, height } = get()

    if (!prompt.trim()) return
    if (get().isGenerating) return

    // Clean up any previous SSE connection
    if (cleanupSSE) {
      cleanupSSE()
      cleanupSSE = null
    }

    set({
      isGenerating: true,
      phase: 'generating',
      progress: 0,
      message: 'Starting...',
      videoUrl: null,
      error: null,
    })

    try {
      const { jobId } = await generateAnimation({
        prompt,
        fps,
        durationSeconds,
        width,
        height,
      })

      set({ activeJobId: jobId })

      // Connect to SSE for progress
      cleanupSSE = connectToProgress(
        jobId,
        (event) => {
          set({
            phase: event.phase,
            progress: event.progress,
            message: event.message,
          })

          if (event.phase === 'complete' && event.videoUrl) {
            const downloadUrl = getDownloadUrl(jobId)
            set({
              isGenerating: false,
              videoUrl: event.videoUrl,
            })

            // Add to history
            const record: GenerationRecord = {
              id: jobId,
              prompt,
              videoUrl: event.videoUrl,
              downloadUrl,
              createdAt: Date.now(),
              durationSeconds,
              fps,
              width,
              height,
            }
            set((state) => ({
              generations: [record, ...state.generations].slice(0, 20),
            }))
          }

          if (event.phase === 'error') {
            set({
              isGenerating: false,
              error: event.error || event.message,
            })
          }
        },
        () => {
          set({
            isGenerating: false,
            error: 'Connection to server lost',
          })
        },
      )
    } catch (err) {
      set({
        isGenerating: false,
        error: err instanceof Error ? err.message : 'Failed to start generation',
      })
    }
  },

  reset: () => {
    if (cleanupSSE) {
      cleanupSSE()
      cleanupSSE = null
    }
    set({
      activeJobId: null,
      phase: null,
      progress: 0,
      message: '',
      videoUrl: null,
      error: null,
      isGenerating: false,
    })
  },
}))
