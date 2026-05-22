/**
 * Normalize yt-dlp JSON output into NormalizedVideo format.
 * Handles platform-specific field mapping.
 */

import type { NormalizedVideo, VideoPlatform, VideoComment } from './types'
import type { YtDlpMetadata, YtDlpComment } from './ytdlpRunner'

/** Map yt-dlp extractor key to our platform enum */
function detectPlatform(meta: YtDlpMetadata): VideoPlatform {
  const key = (meta.extractor_key || meta.extractor || '').toLowerCase()
  if (key.includes('tiktok')) return 'tiktok'
  if (key.includes('instagram')) return 'instagram'
  return 'youtube'
}

/** Convert upload_date (YYYYMMDD) to ISO string */
function parseUploadDate(dateStr: string | null): string {
  if (!dateStr || dateStr.length !== 8) return new Date().toISOString()
  const year = dateStr.slice(0, 4)
  const month = dateStr.slice(4, 6)
  const day = dateStr.slice(6, 8)
  return new Date(`${year}-${month}-${day}T00:00:00Z`).toISOString()
}

/** Extract hashtags from description text */
function extractHashtags(text: string | null, tags: string[] | null): string[] {
  const hashtags = new Set<string>()

  // From tags array
  if (tags) {
    for (const tag of tags) {
      hashtags.add(tag.replace(/^#/, ''))
    }
  }

  // From description text
  if (text) {
    const matches = text.match(/#[\w\u00C0-\u024F]+/g)
    if (matches) {
      for (const m of matches) {
        hashtags.add(m.replace(/^#/, ''))
      }
    }
  }

  return [...hashtags].slice(0, 30)
}

/** Get the best thumbnail URL */
function getBestThumbnail(meta: YtDlpMetadata): string {
  if (meta.thumbnails?.length) {
    // Prefer medium-sized thumbnails
    const sorted = [...meta.thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0))
    return sorted[0].url
  }
  return meta.thumbnail || ''
}

/** Calculate engagement rate */
function calcEngagementRate(views: number, likes: number, comments: number, shares: number): number | undefined {
  if (views <= 0) return undefined
  return Number((((likes + comments + shares) / views) * 100).toFixed(2))
}

/**
 * Convert yt-dlp metadata to NormalizedVideo.
 */
export function normalizeVideo(meta: YtDlpMetadata): NormalizedVideo {
  const platform = detectPlatform(meta)
  const views = meta.view_count || 0
  const likes = meta.like_count || 0
  const comments = meta.comment_count || 0
  const shares = meta.repost_count || 0

  return {
    id: `${platform}:${meta.id}`,
    platform,
    url: meta.webpage_url,
    title: meta.title || 'Untitled',
    description: (meta.description || '').slice(0, 500),
    author: {
      username: meta.uploader_id || meta.channel_id || meta.uploader || 'unknown',
      displayName: meta.uploader || meta.channel || 'Unknown',
      followerCount: meta.channel_follower_count ?? undefined,
      avatarUrl: undefined,
    },
    stats: {
      views,
      likes,
      comments,
      shares,
      engagementRate: calcEngagementRate(views, likes, comments, shares),
    },
    media: {
      thumbnailUrl: getBestThumbnail(meta),
      duration: meta.duration || 0,
      width: meta.width ?? undefined,
      height: meta.height ?? undefined,
    },
    metadata: {
      hashtags: extractHashtags(meta.description, meta.tags),
      publishedAt: parseUploadDate(meta.upload_date),
      musicTitle: meta.track || meta.artist ? `${meta.artist || ''} - ${meta.track || ''}`.trim().replace(/^- |- $/, '') : undefined,
      language: meta.language ?? undefined,
    },
    fetchedAt: new Date().toISOString(),
  }
}

/**
 * Convert yt-dlp comments to VideoComment format.
 */
export function normalizeComments(rawComments: YtDlpComment[]): VideoComment[] {
  // Build parent-child relationships
  const rootComments: VideoComment[] = []
  const replyMap = new Map<string, VideoComment[]>()

  for (const c of rawComments) {
    const comment: VideoComment = {
      id: c.id,
      text: c.text,
      author: c.author,
      likes: c.like_count,
      publishedAt: c.timestamp ? new Date(c.timestamp * 1000).toISOString() : '',
    }

    if (c.parent) {
      const replies = replyMap.get(c.parent) || []
      replies.push(comment)
      replyMap.set(c.parent, replies)
    } else {
      rootComments.push(comment)
    }
  }

  // Attach replies to root comments
  for (const root of rootComments) {
    const replies = replyMap.get(root.id)
    if (replies?.length) {
      root.replies = replies
    }
  }

  return rootComments
}
