import type { SocialPlatform } from './social'

/** Shared metrics normalized across all platforms */
export interface PostMetrics {
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  engagementRate: number
  avgWatchTimeSec: number
  lastFetchedAt: string
}

export interface FacebookMetrics extends PostMetrics {
  reach: number
  impressions: number
  clicks: number
  ctaClicks: number
  demographicsAge: Record<string, number>
  demographicsGender: Record<string, number>
}

export interface InstagramMetrics extends PostMetrics {
  reach: number
  impressions: number
  profileVisits: number
  followsFromPost: number
  storyReplies: number
}

export interface TikTokMetrics extends PostMetrics {
  fullVideoViewsPercent: number
  trafficSources: Record<string, number>
  audienceTerritories: Record<string, number>
}

export interface XMetrics extends PostMetrics {
  impressions: number
  retweets: number
  quoteTweets: number
  bookmarks: number
  urlClicks: number
  profileClicks: number
  followerGrowth: number
}

export type PlatformMetrics = FacebookMetrics | InstagramMetrics | TikTokMetrics | XMetrics

export interface PublishedPost {
  id: string
  recordingId: string
  platform: SocialPlatform
  postId: string
  postUrl: string
  publishedAt: string
  metrics: PlatformMetrics | null
}

export interface AggregatedMetrics {
  totalViews: number
  totalLikes: number
  totalComments: number
  totalShares: number
  totalSaves: number
  avgEngagementRate: number
  platforms: Array<{ platform: SocialPlatform; metrics: PostMetrics }>
}
