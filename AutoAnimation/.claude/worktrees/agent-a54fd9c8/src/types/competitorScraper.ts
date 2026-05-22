/**
 * Types for the Competitor Video Scraper feature.
 */

export type ScraperPlatform = 'tiktok' | 'youtube' | 'instagram'

export interface CompetitorVideoAuthor {
  username: string
  displayName: string
  followerCount?: number
  avatarUrl?: string
}

export interface CompetitorVideoStats {
  views: number
  likes: number
  comments: number
  shares: number
  engagementRate?: number
}

export interface CompetitorTranscript {
  text: string
  words?: Array<{ word: string; start: number; end: number }>
  language?: string
  source: 'subtitles' | 'whisper' | 'deepgram'
}

export interface CompetitorAnalysis {
  hookScore: number // 0-100
  contentStructure: string
  engagementInsights: string[]
  keyTakeaways: string[]
  replicationPrompt: string
}

export interface CompetitorVideo {
  id: string
  platform: ScraperPlatform
  url: string
  title: string
  description: string
  author: CompetitorVideoAuthor
  stats: CompetitorVideoStats
  thumbnailUrl: string
  duration: number
  publishedAt: string
  hashtags: string[]
  transcript?: CompetitorTranscript
  analysis?: CompetitorAnalysis
  fetchedAt: string
}

export type ScraperJobType = 'url' | 'username' | 'keyword'
export type ScraperJobStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface ScraperJob {
  id: string
  type: ScraperJobType
  status: ScraperJobStatus
  query: string
  platform?: ScraperPlatform
  results: CompetitorVideo[]
  error?: string
  startedAt: string
  completedAt?: string
}
