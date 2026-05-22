/**
 * Analytics service for fetching post performance metrics from social platforms.
 * Calls the backend proxy which fetches real data from each platform's API.
 * The backend handles token management — frontend only sends its Supabase JWT.
 */

import type {
  FacebookMetrics,
  InstagramMetrics,
  TikTokMetrics,
  XMetrics,
  PlatformMetrics,
  PublishedPost,
} from '@/types/analytics'
import { useAuthStore } from '@/stores/useAuthStore'

// ── Helpers ──────────────────────────────────────────────────────────────

function getAuthHeaders(): HeadersInit {
  const token = useAuthStore.getState().session?.access_token
  if (!token) throw new Error('Not authenticated. Please sign in first.')
  return {
    Authorization: `Bearer ${token}`,
  }
}

async function fetchMetricsFromBackend(platform: string, postId: string): Promise<any> {
  const resp = await fetch(`/api/social/metrics/${platform}/${encodeURIComponent(postId)}`, {
    headers: getAuthHeaders(),
  })

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({ error: resp.statusText }))
    throw new Error(errData.error || `Failed to fetch ${platform} metrics`)
  }

  return resp.json()
}

// ── Platform-specific fetch functions ────────────────────────────────────

export async function fetchFacebookMetrics(postId: string): Promise<FacebookMetrics> {
  const data = await fetchMetricsFromBackend('facebook', postId)
  return {
    views: data.views ?? 0,
    likes: data.likes ?? 0,
    comments: data.comments ?? 0,
    shares: data.shares ?? 0,
    saves: data.saves ?? 0,
    engagementRate: data.engagementRate ?? 0,
    avgWatchTimeSec: data.avgWatchTimeSec ?? 0,
    lastFetchedAt: data.lastFetchedAt || new Date().toISOString(),
    reach: data.reach ?? 0,
    impressions: data.impressions ?? 0,
    clicks: data.clicks ?? 0,
    ctaClicks: data.ctaClicks ?? 0,
    demographicsAge: data.demographicsAge ?? {},
    demographicsGender: data.demographicsGender ?? {},
  }
}

export async function fetchInstagramMetrics(postId: string): Promise<InstagramMetrics> {
  const data = await fetchMetricsFromBackend('instagram', postId)
  return {
    views: data.views ?? 0,
    likes: data.likes ?? 0,
    comments: data.comments ?? 0,
    shares: data.shares ?? 0,
    saves: data.saves ?? 0,
    engagementRate: data.engagementRate ?? 0,
    avgWatchTimeSec: data.avgWatchTimeSec ?? 0,
    lastFetchedAt: data.lastFetchedAt || new Date().toISOString(),
    reach: data.reach ?? 0,
    impressions: data.impressions ?? 0,
    profileVisits: data.profileVisits ?? 0,
    followsFromPost: data.followsFromPost ?? 0,
    storyReplies: data.storyReplies ?? 0,
  }
}

export async function fetchTikTokMetrics(postId: string): Promise<TikTokMetrics> {
  const data = await fetchMetricsFromBackend('tiktok', postId)
  return {
    views: data.views ?? 0,
    likes: data.likes ?? 0,
    comments: data.comments ?? 0,
    shares: data.shares ?? 0,
    saves: data.saves ?? 0,
    engagementRate: data.engagementRate ?? 0,
    avgWatchTimeSec: data.avgWatchTimeSec ?? 0,
    lastFetchedAt: data.lastFetchedAt || new Date().toISOString(),
    fullVideoViewsPercent: data.fullVideoViewsPercent ?? 0,
    trafficSources: data.trafficSources ?? {},
    audienceTerritories: data.audienceTerritories ?? {},
  }
}

export async function fetchXMetrics(postId: string): Promise<XMetrics> {
  const data = await fetchMetricsFromBackend('x', postId)
  return {
    views: data.views ?? 0,
    likes: data.likes ?? 0,
    comments: data.comments ?? 0,
    shares: data.shares ?? 0,
    saves: data.saves ?? 0,
    engagementRate: data.engagementRate ?? 0,
    avgWatchTimeSec: data.avgWatchTimeSec ?? 0,
    lastFetchedAt: data.lastFetchedAt || new Date().toISOString(),
    impressions: data.impressions ?? 0,
    retweets: data.retweets ?? 0,
    quoteTweets: data.quoteTweets ?? 0,
    bookmarks: data.bookmarks ?? 0,
    urlClicks: data.urlClicks ?? 0,
    profileClicks: data.profileClicks ?? 0,
    followerGrowth: data.followerGrowth ?? 0,
  }
}

/** Fetch metrics for all published posts of a recording in parallel */
export async function fetchAllMetricsForRecording(
  posts: PublishedPost[]
): Promise<Array<{ postId: string; metrics: PlatformMetrics }>> {
  const results = await Promise.allSettled(
    posts.map(async (post) => {
      // Skip posts without a real postId (empty or placeholder)
      if (!post.postId) {
        throw new Error('No post ID available')
      }

      let metrics: PlatformMetrics | undefined
      switch (post.platform) {
        case 'facebook':
          metrics = await fetchFacebookMetrics(post.postId)
          break
        case 'instagram':
          metrics = await fetchInstagramMetrics(post.postId)
          break
        case 'tiktok':
          metrics = await fetchTikTokMetrics(post.postId)
          break
        case 'x':
          metrics = await fetchXMetrics(post.postId)
          break
      }
      if (!metrics) throw new Error(`Unsupported platform: ${post.platform}`)
      return { postId: post.id, metrics }
    })
  )

  return results
    .filter((r): r is PromiseFulfilledResult<{ postId: string; metrics: PlatformMetrics }> => r.status === 'fulfilled')
    .map((r) => r.value)
}
