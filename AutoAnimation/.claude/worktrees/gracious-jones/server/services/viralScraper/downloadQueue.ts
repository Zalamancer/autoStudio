/**
 * In-memory download queue with concurrency control.
 * Max 2 concurrent downloads, max 50 pending jobs.
 * Files stored in /tmp/proanimate-viral-downloads/<jobId>/
 */

import { randomUUID } from 'node:crypto'
import path from 'node:path'
import fs from 'node:fs'
import { downloadVideo as ytdlpDownload } from './ytdlpRunner'
import type { DownloadJob } from './types'

const MAX_CONCURRENT = 2
const MAX_PENDING = 50
const DOWNLOAD_BASE_DIR = path.join(
  process.env.TMPDIR || '/tmp',
  'proanimate-viral-downloads',
)

const jobs = new Map<string, DownloadJob>()
let activeCount = 0
const pendingQueue: string[] = []

/** Get a download job by ID */
export function getDownloadJob(jobId: string): DownloadJob | undefined {
  return jobs.get(jobId)
}

/** List all download jobs */
export function listDownloadJobs(): DownloadJob[] {
  return [...jobs.values()]
}

/** Queue a new download job */
export function queueDownload(videoUrl: string, platform: string): DownloadJob {
  if (jobs.size >= MAX_PENDING + MAX_CONCURRENT) {
    throw new Error(`Download queue full (max ${MAX_PENDING + MAX_CONCURRENT} jobs)`)
  }

  const job: DownloadJob = {
    id: randomUUID(),
    videoUrl,
    platform,
    status: 'queued',
    createdAt: Date.now(),
  }

  jobs.set(job.id, job)
  pendingQueue.push(job.id)
  processNext()

  return job
}

/** Cancel and cleanup a download job */
export function cancelDownload(jobId: string): boolean {
  const job = jobs.get(jobId)
  if (!job) return false

  // Remove from pending queue
  const idx = pendingQueue.indexOf(jobId)
  if (idx !== -1) pendingQueue.splice(idx, 1)

  // Cleanup files
  const jobDir = path.join(DOWNLOAD_BASE_DIR, jobId)
  try {
    if (fs.existsSync(jobDir)) {
      fs.rmSync(jobDir, { recursive: true, force: true })
    }
  } catch {
    console.warn(`[ViralScraper] Failed to cleanup dir for job ${jobId}`)
  }

  jobs.delete(jobId)
  return true
}

/** Process next job in queue if concurrency allows */
function processNext(): void {
  if (activeCount >= MAX_CONCURRENT || pendingQueue.length === 0) return

  const jobId = pendingQueue.shift()!
  const job = jobs.get(jobId)
  if (!job || job.status !== 'queued') {
    processNext()
    return
  }

  activeCount++
  job.status = 'downloading'

  const jobDir = path.join(DOWNLOAD_BASE_DIR, jobId)

  ytdlpDownload(job.videoUrl, jobDir)
    .then((filePath) => {
      job.status = 'completed'
      job.localPath = filePath
      job.fileName = path.basename(filePath)
      console.log(`[ViralScraper] Download complete: ${job.fileName}`)
    })
    .catch((err) => {
      job.status = 'failed'
      job.error = err instanceof Error ? err.message : 'Download failed'
      console.error(`[ViralScraper] Download failed for ${job.videoUrl}:`, job.error)
    })
    .finally(() => {
      activeCount--
      processNext()
    })
}

/**
 * Cleanup old completed/failed jobs and their files.
 * Called by the cleanup scheduler.
 */
export function cleanupOldJobs(maxAgeMs: number): number {
  const now = Date.now()
  let cleaned = 0

  for (const [id, job] of jobs) {
    if (now - job.createdAt > maxAgeMs && (job.status === 'completed' || job.status === 'failed')) {
      cancelDownload(id)
      cleaned++
    }
  }

  return cleaned
}
