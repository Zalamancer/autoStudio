/**
 * YouTube Data API v3 discovery for trending shorts/videos.
 * Reuses YOUTUBE_API_KEY env var from brandDirector.
 */

import type { NormalizedVideo } from './types'

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

function getApiKey(): string | null {
  return process.env.YOUTUBE_API_KEY || null
}

interface YouTubeSearchItem {
  id?: { videoId?: string }
}

interface YouTubeVideoItem {
  id: string
  snippet: {
    title: string
    description: string
    publishedAt: string
    channelTitle: string
    channelId: string
    thumbnails?: {
      medium?: { url: string }
      high?: { url: string }
    }
    tags?: string[]
  }
  statistics: {
    viewCount?: string
    likeCount?: string
    commentCount?: string
  }
  contentDetails: {
    duration: string
  }
}

/** Parse ISO 8601 duration (PT1M30S) to seconds */
function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const h = parseInt(match[1] || '0')
  const m = parseInt(match[2] || '0')
  const s = parseInt(match[3] || '0')
  return h * 3600 + m * 60 + s
}

/** Extract hashtags from description and tags */
function extractHashtags(desc: string, tags?: string[]): string[] {
  const set = new Set<string>()
  if (tags) tags.forEach((t) => set.add(t.replace(/^#/, '')))
  const matches = desc.match(/#[\w\u00C0-\u024F]+/g)
  if (matches) matches.forEach((m) => set.add(m.replace(/^#/, '')))
  return [...set].slice(0, 30)
}

/**
 * Search YouTube for trending short-form videos matching keywords.
 * Returns normalized videos sorted by view count.
 */
export async function discoverYouTube(
  keywords: string[],
  maxResults = 15,
): Promise<NormalizedVideo[]> {
  const apiKey = getApiKey()
  if (!apiKey) {
    console.log('[ViralScraper] YOUTUBE_API_KEY not set, skipping YouTube discovery')
    return []
  }

  const query = keywords.join(' | ')
  const publishedAfter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Search for short-form videos
  const searchURL = `${YOUTUBE_API_BASE}/search?` + new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    videoDuration: 'short',
    order: 'viewCount',
    publishedAfter,
    maxResults: String(Math.min(maxResults, 50)),
    relevanceLanguage: 'en',
    key: apiKey,
  })

  console.log(`[ViralScraper] YouTube search: "${query}" (max ${maxResults})`)

  const searchRes = await fetch(searchURL)
  if (!searchRes.ok) {
    const err = await searchRes.text()
    throw new Error(`YouTube search API error ${searchRes.status}: ${err}`)
  }

  const searchData = await searchRes.json()
  const videoIds = (searchData.items || [])
    .map((item: YouTubeSearchItem) => item.id?.videoId)
    .filter(Boolean)
    .join(',')

  if (!videoIds) return []

  // Fetch full video details (statistics + contentDetails for duration filtering)
  const statsURL = `${YOUTUBE_API_BASE}/videos?` + new URLSearchParams({
    part: 'statistics,snippet,contentDetails',
    id: videoIds,
    key: apiKey,
  })

  const statsRes = await fetch(statsURL)
  if (!statsRes.ok) {
    throw new Error(`YouTube videos API error: ${statsRes.status}`)
  }

  const statsData = await statsRes.json()
  const videos: NormalizedVideo[] = []

  for (const video of (statsData.items || []) as YouTubeVideoItem[]) {
    const duration = parseDuration(video.contentDetails.duration)

    // Filter for Shorts: duration under 60s
    if (duration > 60) continue

    const views = parseInt(video.statistics.viewCount || '0')
    const likes = parseInt(video.statistics.likeCount || '0')
    const comments = parseInt(video.statistics.commentCount || '0')

    videos.push({
      id: `youtube:${video.id}`,
      platform: 'youtube',
      url: `https://youtube.com/shorts/${video.id}`,
      title: video.snippet.title,
      description: (video.snippet.description || '').slice(0, 500),
      author: {
        username: video.snippet.channelId,
        displayName: video.snippet.channelTitle,
      },
      stats: {
        views,
        likes,
        comments,
        shares: 0,
        engagementRate: views > 0 ? Number((((likes + comments) / views) * 100).toFixed(2)) : undefined,
      },
      media: {
        thumbnailUrl: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.medium?.url || '',
        duration,
      },
      metadata: {
        hashtags: extractHashtags(video.snippet.description || '', video.snippet.tags),
        publishedAt: video.snippet.publishedAt,
      },
      fetchedAt: new Date().toISOString(),
    })
  }

  // Sort by views descending
  videos.sort((a, b) => b.stats.views - a.stats.views)

  console.log(`[ViralScraper] YouTube: found ${videos.length} shorts`)
  return videos
}
