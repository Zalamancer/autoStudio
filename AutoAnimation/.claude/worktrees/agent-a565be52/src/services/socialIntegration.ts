import type { ExportProfile } from '@/types/audioExpanded'
import { EXPORT_PROFILES } from '@/data/exportProfiles'

/**
 * Get platform-specific export configuration.
 */
export function getPlatformConfig(platform: string): ExportProfile | undefined {
  return EXPORT_PROFILES.find(p => p.id === platform || p.platform.toLowerCase() === platform.toLowerCase())
}

/**
 * Fetch trending topics for a platform (simulated -- would call real APIs in production).
 */
export async function fetchTrendingTopics(platform: string): Promise<string[]> {
  // Simulated trending topics by platform
  const trendsByPlatform: Record<string, string[]> = {
    tiktok: ['AI art', 'day in my life', 'cooking hacks', 'fashion', 'comedy skit', 'POV', 'get ready with me', 'storytime'],
    'youtube-shorts': ['shorts challenge', 'life hacks', 'before and after', 'tutorial', 'reaction', 'facts', 'motivation'],
    'instagram-reels': ['transition', 'outfit ideas', 'recipe', 'travel', 'fitness', 'aesthetic', 'behind the scenes'],
  }
  return trendsByPlatform[platform] ?? ['trending', 'viral', 'fyp']
}

/**
 * Fetch trending sounds for a platform (simulated).
 */
export async function fetchTrendingSounds(platform: string): Promise<{ name: string; artist: string }[]> {
  void platform
  return [
    { name: 'Original Sound', artist: 'Creator' },
    { name: 'Trending Beat', artist: 'Producer' },
    { name: 'Viral Remix', artist: 'DJ Mix' },
  ]
}

/**
 * Generate hashtags for content and platform.
 */
export function generateHashtags(content: string, platform: string): string[] {
  const profile = getPlatformConfig(platform)
  const limit = profile?.hashtagLimit ?? 10
  const words = content.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const unique = [...new Set(words)].slice(0, Math.min(limit, 15))

  const platformTags: Record<string, string[]> = {
    tiktok: ['fyp', 'foryou', 'viral'],
    'youtube-shorts': ['shorts', 'youtube'],
    'instagram-reels': ['reels', 'instagram', 'explore'],
  }

  const baseTags = platformTags[platform] ?? []
  return [...baseTags, ...unique].slice(0, limit)
}

/**
 * Get optimal posting times for a platform and timezone.
 */
export function getOptimalPostingTimes(
  platform: string,
  _timezone: string = 'UTC',
): { day: string; hour: number; engagement: number }[] {
  const timesByPlatform: Record<string, { day: string; hour: number; engagement: number }[]> = {
    tiktok: [
      { day: 'Tuesday', hour: 9, engagement: 0.85 },
      { day: 'Thursday', hour: 12, engagement: 0.92 },
      { day: 'Friday', hour: 17, engagement: 0.88 },
      { day: 'Saturday', hour: 10, engagement: 0.90 },
    ],
    'youtube-shorts': [
      { day: 'Wednesday', hour: 14, engagement: 0.87 },
      { day: 'Friday', hour: 15, engagement: 0.91 },
      { day: 'Saturday', hour: 11, engagement: 0.89 },
    ],
    'instagram-reels': [
      { day: 'Monday', hour: 11, engagement: 0.83 },
      { day: 'Wednesday', hour: 18, engagement: 0.90 },
      { day: 'Friday', hour: 13, engagement: 0.86 },
    ],
  }

  return timesByPlatform[platform] ?? [
    { day: 'Wednesday', hour: 12, engagement: 0.80 },
    { day: 'Friday', hour: 15, engagement: 0.82 },
  ]
}
