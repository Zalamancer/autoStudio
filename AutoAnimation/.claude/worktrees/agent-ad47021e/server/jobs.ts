import { v4 as uuidv4 } from 'uuid'

export type JobPhase = 'generating' | 'rendering' | 'encoding' | 'uploading' | 'complete' | 'error'

export interface Job {
  id: string
  status: 'running' | 'complete' | 'error'
  phase: JobPhase
  progress: number // 0-100
  message: string
  videoUrl?: string
  error?: string
  createdAt: number
  // SSE listeners
  listeners: Set<(event: JobEvent) => void>
}

export interface JobEvent {
  phase: JobPhase
  progress: number
  message: string
  videoUrl?: string
  error?: string
}

const jobs = new Map<string, Job>()

// Clean up jobs older than 1 hour
const EXPIRY_MS = 60 * 60 * 1000
setInterval(() => {
  const now = Date.now()
  for (const [id, job] of jobs) {
    if (now - job.createdAt > EXPIRY_MS) {
      jobs.delete(id)
    }
  }
}, 5 * 60 * 1000)

export function createJob(): Job {
  const job: Job = {
    id: uuidv4(),
    status: 'running',
    phase: 'generating',
    progress: 0,
    message: 'Starting...',
    createdAt: Date.now(),
    listeners: new Set(),
  }
  jobs.set(job.id, job)
  return job
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id)
}

export function updateJob(id: string, update: Partial<Pick<Job, 'phase' | 'progress' | 'message' | 'videoUrl' | 'error' | 'status'>>) {
  const job = jobs.get(id)
  if (!job) return

  Object.assign(job, update)

  const event: JobEvent = {
    phase: job.phase,
    progress: job.progress,
    message: job.message,
    videoUrl: job.videoUrl,
    error: job.error,
  }

  for (const listener of job.listeners) {
    listener(event)
  }
}

export function addJobListener(id: string, listener: (event: JobEvent) => void): () => void {
  const job = jobs.get(id)
  if (!job) return () => {}

  job.listeners.add(listener)
  return () => job.listeners.delete(listener)
}
