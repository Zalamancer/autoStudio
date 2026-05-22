/**
 * Temp file cleanup scheduler for viral scraper downloads.
 * Runs every 10 minutes, removes jobs older than 30 minutes.
 */

import { cleanupOldJobs } from './downloadQueue'

const CLEANUP_INTERVAL_MS = 10 * 60_000 // 10 minutes
const MAX_JOB_AGE_MS = 30 * 60_000 // 30 minutes

let cleanupTimer: ReturnType<typeof setInterval> | null = null

/** Start the periodic cleanup scheduler */
export function startCleanup(): void {
  if (cleanupTimer) return

  cleanupTimer = setInterval(() => {
    const cleaned = cleanupOldJobs(MAX_JOB_AGE_MS)
    if (cleaned > 0) {
      console.log(`[ViralScraper] Cleanup: removed ${cleaned} expired download job(s)`)
    }
  }, CLEANUP_INTERVAL_MS)

  console.log('[ViralScraper] Download cleanup scheduler started (10min interval, 30min TTL)')
}

/** Stop the cleanup scheduler */
export function stopCleanup(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer)
    cleanupTimer = null
  }
}
