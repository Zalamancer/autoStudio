/**
 * Frontend API client for the AI Content Performance Learning system.
 * Calls /api/learning/* endpoints on the backend.
 */

import type {
  ProjectFeatureSnapshot,
  LearnedPattern,
  Recommendation,
  ScoreResult,
  GeminiAnalysisResult,
} from '@/types/learning'
import type { SocialPlatform } from '@/types/social'
import { useAuthStore } from '@/stores/useAuthStore'

// ── Helpers ──

function getAuthHeaders(): HeadersInit {
  const token = useAuthStore.getState().session?.access_token
  if (!token) throw new Error('Not authenticated. Please sign in first.')
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(`/api/learning${path}`, {
    ...options,
    headers: { ...getAuthHeaders(), ...options?.headers },
  })
  const data = await resp.json()
  if (!resp.ok) {
    throw new Error(data.error || `Request failed (${resp.status})`)
  }
  return data
}

// ── Snapshot ──

/** Store a project feature snapshot after publishing */
export async function captureSnapshot(
  recordingId: string,
  platform: SocialPlatform,
  snapshot: ProjectFeatureSnapshot,
  projectId?: string,
  publishedPostId?: string,
): Promise<{ snapshotId: string }> {
  return apiRequest('/snapshot', {
    method: 'POST',
    body: JSON.stringify({
      recordingId,
      projectId,
      publishedPostId,
      platform,
      snapshot,
    }),
  })
}

// ── Metrics Update ──

/** Update performance records with latest engagement data */
export async function updateMetrics(
  snapshotId: string,
  metrics: {
    views: number
    likes: number
    comments: number
    shares: number
    saves: number
    engagementRate: number
    avgWatchTimeSec: number
    reach?: number
    impressions?: number
    fullVideoViewsPercent?: number
  },
): Promise<void> {
  await apiRequest('/update-metrics', {
    method: 'POST',
    body: JSON.stringify({ snapshotId, metrics }),
  })
}

// ── Scoring ──

/** Get predicted performance score for current project features */
export async function getScore(
  platform: SocialPlatform,
  featureVector: Record<string, number>,
): Promise<ScoreResult & { recommendations: Recommendation[] }> {
  return apiRequest('/score', {
    method: 'POST',
    body: JSON.stringify({ platform, featureVector }),
  })
}

// ── Insights ──

/** Fetch learned patterns/insights for the user */
export async function getInsights(platform?: SocialPlatform): Promise<{ insights: LearnedPattern[] }> {
  const params = platform ? `?platform=${platform}` : ''
  return apiRequest(`/insights${params}`)
}

// ── Recommendations ──

/** Fetch recommendations for a recording (or 'current' for general recs) */
export async function getRecommendations(
  recordingId: string,
  platform?: SocialPlatform,
): Promise<{ recommendations: Recommendation[] }> {
  const params = platform ? `?platform=${platform}` : ''
  return apiRequest(`/recommendations/${encodeURIComponent(recordingId)}${params}`)
}

/** Update recommendation status */
export async function updateRecommendationStatus(id: string, status: 'applied' | 'dismissed'): Promise<void> {
  await apiRequest(`/recommendations/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

// ── Gemini Analysis ──

/** Trigger Gemini deep analysis */
export async function triggerGeminiAnalysis(
  platform: SocialPlatform,
  recordingId?: string,
  currentFeatures?: Record<string, unknown>,
): Promise<GeminiAnalysisResult> {
  return apiRequest('/analyze-gemini', {
    method: 'POST',
    body: JSON.stringify({ platform, recordingId, currentFeatures }),
  })
}

// ── Model Recalculation ──

/** Trigger full model recalculation */
export async function recalculateModel(platform?: SocialPlatform): Promise<void> {
  await apiRequest('/recalculate', {
    method: 'POST',
    body: JSON.stringify({ platform }),
  })
}

// ── Optimal Posting Time (with heuristic fallback) ──

import { getBestPostingTime } from './postingTimeHeuristics'

export interface OptimalPostingTimeResult {
  suggestedTime: string
  confidence: number
  reason: string
}

/**
 * Get optimal posting time from the API. Falls back to static heuristics
 * if the API is unavailable.
 */
export async function getOptimalPostingTime(platform: SocialPlatform): Promise<OptimalPostingTimeResult> {
  try {
    return await apiRequest<OptimalPostingTimeResult>(`/optimal-time?platform=${platform}`)
  } catch {
    // Heuristic fallback
    const best = getBestPostingTime(platform)
    const hour = best?.hour ?? 12
    const now = new Date()
    now.setHours(hour, 0, 0, 0)
    if (now.getTime() < Date.now()) now.setDate(now.getDate() + 1)

    return {
      suggestedTime: now.toISOString(),
      confidence: best?.score ?? 0.5,
      reason: `Heuristic best time for ${platform}: ${best?.label ?? '12 PM'}`,
    }
  }
}
