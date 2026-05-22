/**
 * Types for the viral video scraper service.
 */

export type VideoPlatform = 'tiktok' | 'instagram' | 'youtube'

export interface VideoAuthor {
  username: string
  displayName: string
  followerCount?: number
  avatarUrl?: string
}

export interface VideoStats {
  views: number
  likes: number
  comments: number
  shares: number
  engagementRate?: number
}

export interface VideoMedia {
  thumbnailUrl: string
  duration: number
  width?: number
  height?: number
}

export interface VideoMetadata {
  hashtags: string[]
  publishedAt: string
  musicTitle?: string
  language?: string
}

export interface NormalizedVideo {
  /** Format: platform:videoId */
  id: string
  platform: VideoPlatform
  url: string
  title: string
  description: string
  author: VideoAuthor
  stats: VideoStats
  media: VideoMedia
  metadata: VideoMetadata
  fetchedAt: string
}

export interface VideoComment {
  id: string
  text: string
  author: string
  likes: number
  publishedAt: string
  replies?: VideoComment[]
}

export type DownloadStatus = 'queued' | 'downloading' | 'completed' | 'failed'

export interface DownloadJob {
  id: string
  videoUrl: string
  platform: string
  status: DownloadStatus
  localPath?: string
  fileName?: string
  error?: string
  createdAt: number
}

export interface DiscoveryQuery {
  keywords: string[]
  platforms?: VideoPlatform[]
  industry?: string
  niche?: string
  maxResults?: number
}

export interface DiscoveryResult {
  videos: NormalizedVideo[]
  summary?: string
  fetchedAt: string
}
