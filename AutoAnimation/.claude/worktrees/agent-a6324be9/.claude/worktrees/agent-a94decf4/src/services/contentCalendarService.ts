/**
 * Content calendar planning and scheduling service.
 */

export interface CalendarEntry {
  date: string
  platform: string
  contentType: string
  suggestedTime: string
  status: 'planned' | 'created' | 'published'
}

/**
 * Generate a content calendar.
 */
export function generateCalendar(
  platforms: string[],
  frequency: number,
  _timezone: string = 'UTC',
): CalendarEntry[] {
  const entries: CalendarEntry[] = []
  const contentTypes = ['educational', 'entertainment', 'promotional', 'behind-the-scenes', 'tutorial']
  const now = new Date()

  for (let week = 0; week < 4; week++) {
    for (let post = 0; post < frequency; post++) {
      const date = new Date(now)
      date.setDate(date.getDate() + week * 7 + Math.floor(post * (7 / frequency)))
      const platform = platforms[post % platforms.length]
      const contentType = contentTypes[(week * frequency + post) % contentTypes.length]

      entries.push({
        date: date.toISOString().split('T')[0],
        platform,
        contentType,
        suggestedTime: suggestPostingTime(platform, contentType),
        status: 'planned',
      })
    }
  }

  return entries
}

/**
 * Suggest optimal posting time for a platform and content type.
 */
export function suggestPostingTime(platform: string, _contentType: string): string {
  const times: Record<string, string> = {
    tiktok: '17:00',
    'youtube-shorts': '14:00',
    'instagram-reels': '12:00',
    youtube: '15:00',
    facebook: '13:00',
    twitter: '09:00',
    linkedin: '08:00',
  }
  return times[platform] ?? '12:00'
}

/**
 * Analyze scheduling gaps in the calendar.
 */
export function analyzeScheduleGaps(calendar: CalendarEntry[]): {
  longestGapDays: number
  platformCoverage: Record<string, number>
  suggestion: string
} {
  const sorted = [...calendar].sort((a, b) => a.date.localeCompare(b.date))
  let longestGap = 0

  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime()) / 86400000
    if (diff > longestGap) longestGap = diff
  }

  const platformCoverage: Record<string, number> = {}
  for (const entry of calendar) {
    platformCoverage[entry.platform] = (platformCoverage[entry.platform] ?? 0) + 1
  }

  const suggestion = longestGap > 3
    ? 'Consider adding more posts to fill the gap'
    : 'Schedule looks well-distributed'

  return { longestGapDays: longestGap, platformCoverage, suggestion }
}
