/**
 * Posting Time Heuristics — optimal posting times per platform.
 * Static heuristics based on engagement research.
 */

export interface PostingTimeSlot {
  hour: number
  label: string
  /** Relative engagement score 0-1 */
  score: number
}

const PLATFORM_TIMES: Record<string, PostingTimeSlot[]> = {
  tiktok: [
    { hour: 7, label: '7 AM', score: 0.7 },
    { hour: 9, label: '9 AM', score: 0.6 },
    { hour: 12, label: '12 PM', score: 0.8 },
    { hour: 15, label: '3 PM', score: 0.7 },
    { hour: 19, label: '7 PM', score: 1.0 },
    { hour: 21, label: '9 PM', score: 0.9 },
  ],
  youtube: [
    { hour: 9, label: '9 AM', score: 0.6 },
    { hour: 12, label: '12 PM', score: 0.7 },
    { hour: 14, label: '2 PM', score: 1.0 },
    { hour: 16, label: '4 PM', score: 0.9 },
    { hour: 18, label: '6 PM', score: 0.8 },
  ],
  instagram: [
    { hour: 7, label: '7 AM', score: 0.6 },
    { hour: 11, label: '11 AM', score: 1.0 },
    { hour: 13, label: '1 PM', score: 0.9 },
    { hour: 17, label: '5 PM', score: 0.8 },
    { hour: 19, label: '7 PM', score: 0.7 },
  ],
  x: [
    { hour: 8, label: '8 AM', score: 0.8 },
    { hour: 12, label: '12 PM', score: 1.0 },
    { hour: 17, label: '5 PM', score: 0.9 },
    { hour: 21, label: '9 PM', score: 0.6 },
  ],
  facebook: [
    { hour: 9, label: '9 AM', score: 0.7 },
    { hour: 13, label: '1 PM', score: 1.0 },
    { hour: 16, label: '4 PM', score: 0.8 },
    { hour: 19, label: '7 PM', score: 0.6 },
  ],
}

/**
 * Get optimal posting times for a platform on a given day of the week.
 * dayOfWeek: 0 (Sunday) to 6 (Saturday)
 */
export function getOptimalPostingTimes(
  platform: string,
  _dayOfWeek: number = 1,
): PostingTimeSlot[] {
  // Weekends typically have slightly different patterns, but for
  // simplicity we return the same times. Could be expanded later.
  return PLATFORM_TIMES[platform] || PLATFORM_TIMES.instagram || []
}

/**
 * Get the single best posting time for a platform.
 */
export function getBestPostingTime(platform: string): PostingTimeSlot | null {
  const times = getOptimalPostingTimes(platform)
  return times.reduce<PostingTimeSlot | null>((best, slot) => {
    if (!best || slot.score > best.score) return slot
    return best
  }, null)
}

/**
 * Get all platforms' best posting times for a given day.
 */
export function getAllPlatformBestTimes(): Record<string, PostingTimeSlot> {
  const result: Record<string, PostingTimeSlot> = {}
  for (const platform of Object.keys(PLATFORM_TIMES)) {
    const best = getBestPostingTime(platform)
    if (best) result[platform] = best
  }
  return result
}
