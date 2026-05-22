import { create } from 'zustand'
import { submitRender, pollRenderStatus } from '../services/api'
import type { MotionDesignDescription } from '@proanimate/core'

type ExportStatus = 'idle' | 'submitting' | 'rendering' | 'complete' | 'error'

interface ExportState {
  status: ExportStatus
  jobId: string | null
  resultUrl: string | null
  error: string | null
  progress: string

  startExport: (params: {
    description: MotionDesignDescription
    config: Record<string, unknown>
    format?: 'mp4' | 'webm'
    fps?: number
    durationSeconds?: number
  }) => Promise<void>

  reset: () => void
}

export const useExportStore = create<ExportState>((set, get) => ({
  status: 'idle',
  jobId: null,
  resultUrl: null,
  error: null,
  progress: '',

  startExport: async ({ description, config, format = 'mp4', fps = 30, durationSeconds = 5 }) => {
    set({ status: 'submitting', error: null, resultUrl: null, progress: 'Submitting render job...' })

    try {
      const { jobId } = await submitRender({
        motionDesignDescription: description as unknown as Record<string, unknown>,
        configOverrides: config,
        settings: { format, fps, durationSeconds, aspectRatio: '9:16' },
      })

      set({ jobId, status: 'rendering', progress: 'Rendering...' })

      // Poll for completion
      const maxAttempts = 120 // 10 minutes at 5s intervals
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((resolve) => setTimeout(resolve, 5000))

        // Check if reset was called while polling
        if (get().status === 'idle') return

        const job = await pollRenderStatus(jobId)

        if (job.status === 'complete' && job.resultUrl) {
          set({ status: 'complete', resultUrl: job.resultUrl, progress: 'Export complete!' })
          return
        }

        if (job.status === 'failed') {
          set({ status: 'error', error: job.errorMessage || 'Render failed', progress: '' })
          return
        }

        if (job.status === 'cancelled') {
          set({ status: 'error', error: 'Render was cancelled', progress: '' })
          return
        }

        // Still rendering — update progress estimate
        set({ progress: `Rendering... (${Math.min(99, Math.round((i / maxAttempts) * 100))}%)` })
      }

      set({ status: 'error', error: 'Render timed out after 10 minutes', progress: '' })
    } catch (err) {
      set({ status: 'error', error: (err as Error).message, progress: '' })
    }
  },

  reset: () => {
    set({ status: 'idle', jobId: null, resultUrl: null, error: null, progress: '' })
  },
}))
