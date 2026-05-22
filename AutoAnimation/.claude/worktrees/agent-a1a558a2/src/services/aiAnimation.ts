import { withCreditGate } from './creditGate'

const API_BASE = import.meta.env.VITE_API_URL || ''

export interface GenerateAnimationOptions {
  prompt: string
  fps?: number
  durationSeconds?: number
  width?: number
  height?: number
}

export interface GenerateAnimationResponse {
  jobId: string
}

export interface JobProgressEvent {
  phase: 'generating' | 'rendering' | 'encoding' | 'uploading' | 'complete' | 'error'
  progress: number
  message: string
  videoUrl?: string
  error?: string
}

export async function generateAnimation(options: GenerateAnimationOptions): Promise<GenerateAnimationResponse> {
  return withCreditGate('ai-video', async () => {
    const response = await fetch(`${API_BASE}/api/ai-animation/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(data.error || `HTTP ${response.status}`)
    }

    return response.json()
  })
}

export function connectToProgress(
  jobId: string,
  onEvent: (event: JobProgressEvent) => void,
  onError?: (error: Event) => void,
): () => void {
  const eventSource = new EventSource(`${API_BASE}/api/ai-animation/jobs/${jobId}/progress`)

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as JobProgressEvent
      onEvent(data)

      if (data.phase === 'complete' || data.phase === 'error') {
        eventSource.close()
      }
    } catch {
      // ignore parse errors
    }
  }

  eventSource.onerror = (error) => {
    if (onError) onError(error)
    eventSource.close()
  }

  return () => eventSource.close()
}

export async function getJobStatus(jobId: string): Promise<JobProgressEvent> {
  const response = await fetch(`${API_BASE}/api/ai-animation/jobs/${jobId}`)
  if (!response.ok) {
    throw new Error(`Failed to get job status: HTTP ${response.status}`)
  }
  return response.json()
}

export function getDownloadUrl(jobId: string): string {
  return `${API_BASE}/api/ai-animation/jobs/${jobId}/download`
}
