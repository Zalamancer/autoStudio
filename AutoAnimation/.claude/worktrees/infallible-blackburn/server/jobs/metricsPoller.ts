/**
 * Engagement Metrics Poller.
 *
 * Periodically fetches latest engagement metrics from social platform APIs
 * and updates performance_records.  Triggers pattern discovery when new
 * data changes correlations.
 *
 * Polling frequency: every 6 hours.
 */

import { getSupabaseAdmin } from '../middleware/supabaseAuth'
import { recomputePerformanceScores, computeCorrelations, updateLearnedPatterns } from '../services/scoringModel'
import logger from '../lib/logger'

const POLL_INTERVAL_MS = 6 * 60 * 60 * 1000 // 6 hours

let pollInterval: ReturnType<typeof setInterval> | null = null

/**
 * Fetch and update metrics for all users with published posts.
 */
async function refreshMetrics(): Promise<void> {
  try {
    const supabase = getSupabaseAdmin()

    // Find performance_records that haven't been refreshed in >6 hours
    // and have associated published posts
    const sixHoursAgo = new Date(Date.now() - POLL_INTERVAL_MS).toISOString()

    const { data: staleRecords, error } = await supabase
      .from('performance_records')
      .select('id, user_id, snapshot_id, last_refreshed_at')
      .or(`last_refreshed_at.is.null,last_refreshed_at.lt.${sixHoursAgo}`)
      .order('last_refreshed_at', { ascending: true, nullsFirst: true })
      .limit(50)

    if (error) {
      logger.error({ error }, '[MetricsPoller] Failed to query stale records')
      return
    }

    if (!staleRecords || staleRecords.length === 0) {
      logger.debug('[MetricsPoller] No stale records to refresh')
      return
    }

    logger.info(`[MetricsPoller] Refreshing metrics for ${staleRecords.length} record(s)`)

    // Group by user_id for batch processing
    const userIds = [...new Set(staleRecords.map((r) => r.user_id))]

    for (const userId of userIds) {
      try {
        // Look up the user's social platform tokens
        const { data: socialAccounts } = await supabase
          .from('social_accounts')
          .select('platform, access_token')
          .eq('user_id', userId)
          .eq('is_active', true)

        if (!socialAccounts || socialAccounts.length === 0) {
          // No connected social accounts — just mark as refreshed
          const recordIds = staleRecords
            .filter((r) => r.user_id === userId)
            .map((r) => r.id)

          await supabase
            .from('performance_records')
            .update({ last_refreshed_at: new Date().toISOString() })
            .in('id', recordIds)

          continue
        }

        // For each connected platform, try to fetch updated metrics
        for (const account of socialAccounts) {
          try {
            const metrics = await fetchPlatformMetrics(account.platform, account.access_token)
            if (!metrics) continue

            // Update any records for this user/platform
            const userRecords = staleRecords.filter((r) => r.user_id === userId)
            for (const record of userRecords) {
              // Check if this record's snapshot matches the platform
              const { data: snapshot } = await supabase
                .from('project_snapshots')
                .select('platform, published_post_id')
                .eq('id', record.snapshot_id)
                .single()

              if (snapshot?.platform !== account.platform) continue

              // Update the record
              await supabase
                .from('performance_records')
                .update({
                  views: metrics.views,
                  likes: metrics.likes,
                  comments: metrics.comments,
                  shares: metrics.shares,
                  saves: metrics.saves,
                  engagement_rate: metrics.engagementRate,
                  avg_watch_time_sec: metrics.avgWatchTimeSec,
                  reach: metrics.reach,
                  impressions: metrics.impressions,
                  last_refreshed_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', record.id)
            }
          } catch (err) {
            logger.warn({ err, platform: account.platform }, '[MetricsPoller] Platform fetch failed')
          }
        }

        // Recompute scores + patterns for this user
        await recomputePerformanceScores(userId)

        // Update learned patterns if enough data
        const correlations = await computeCorrelations(userId)
        if (correlations.length > 0) {
          await updateLearnedPatterns(userId, correlations)
        }

        logger.info(`[MetricsPoller] Refreshed metrics for user ${userId}`)
      } catch (err) {
        logger.warn({ err, userId }, '[MetricsPoller] User metrics refresh failed')
      }
    }
  } catch (err) {
    logger.error({ err }, '[MetricsPoller] Unexpected error')
  }
}

/**
 * Fetch engagement metrics from a social platform API.
 * Returns null if the platform is not supported or the token is invalid.
 */
async function fetchPlatformMetrics(
  platform: string,
  accessToken: string,
): Promise<{
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  engagementRate: number
  avgWatchTimeSec: number
  reach: number
  impressions: number
} | null> {
  // Platform-specific API calls
  // Each platform has its own analytics endpoint
  switch (platform) {
    case 'tiktok':
      return fetchTikTokMetrics(accessToken)
    case 'instagram':
      return fetchInstagramMetrics(accessToken)
    case 'youtube':
      return fetchYouTubeMetrics(accessToken)
    default:
      return null
  }
}

async function fetchTikTokMetrics(accessToken: string) {
  try {
    const resp = await fetch('https://open.tiktokapis.com/v2/video/list/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        max_count: 5,
        fields: ['view_count', 'like_count', 'comment_count', 'share_count'],
      }),
    })

    if (!resp.ok) return null

    const data = await resp.json()
    const videos = data.data?.videos || []
    if (videos.length === 0) return null

    // Average across recent videos
    const totals = videos.reduce(
      (acc: any, v: any) => ({
        views: acc.views + (v.view_count || 0),
        likes: acc.likes + (v.like_count || 0),
        comments: acc.comments + (v.comment_count || 0),
        shares: acc.shares + (v.share_count || 0),
      }),
      { views: 0, likes: 0, comments: 0, shares: 0 },
    )

    const totalEngagement = totals.likes + totals.comments + totals.shares
    const engagementRate = totals.views > 0 ? totalEngagement / totals.views : 0

    return {
      views: totals.views,
      likes: totals.likes,
      comments: totals.comments,
      shares: totals.shares,
      saves: 0,
      engagementRate,
      avgWatchTimeSec: 0,
      reach: totals.views,
      impressions: totals.views,
    }
  } catch {
    return null
  }
}

async function fetchInstagramMetrics(accessToken: string) {
  try {
    const resp = await fetch(
      `https://graph.instagram.com/me/media?fields=like_count,comments_count,timestamp&access_token=${accessToken}&limit=5`,
    )

    if (!resp.ok) return null

    const data = await resp.json()
    const media = data.data || []
    if (media.length === 0) return null

    const totals = media.reduce(
      (acc: any, m: any) => ({
        likes: acc.likes + (m.like_count || 0),
        comments: acc.comments + (m.comments_count || 0),
      }),
      { likes: 0, comments: 0 },
    )

    return {
      views: 0,
      likes: totals.likes,
      comments: totals.comments,
      shares: 0,
      saves: 0,
      engagementRate: 0,
      avgWatchTimeSec: 0,
      reach: 0,
      impressions: 0,
    }
  } catch {
    return null
  }
}

async function fetchYouTubeMetrics(accessToken: string) {
  try {
    const resp = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true&access_token=${accessToken}`,
    )

    if (!resp.ok) return null

    const data = await resp.json()
    const stats = data.items?.[0]?.statistics

    if (!stats) return null

    return {
      views: parseInt(stats.viewCount || '0', 10),
      likes: 0,
      comments: parseInt(stats.commentCount || '0', 10),
      shares: 0,
      saves: 0,
      engagementRate: 0,
      avgWatchTimeSec: 0,
      reach: parseInt(stats.viewCount || '0', 10),
      impressions: parseInt(stats.viewCount || '0', 10),
    }
  } catch {
    return null
  }
}

/**
 * Start the metrics polling loop.
 */
export function startMetricsPoller(): void {
  if (pollInterval) {
    logger.warn('[MetricsPoller] Already running')
    return
  }

  logger.info(`[MetricsPoller] Starting (poll every ${POLL_INTERVAL_MS / 3600000}h)`)

  // Run first check after 5 minutes (don't hit APIs immediately on startup)
  setTimeout(refreshMetrics, 5 * 60 * 1000)

  pollInterval = setInterval(refreshMetrics, POLL_INTERVAL_MS)
}

/**
 * Stop the metrics polling loop.
 */
export function stopMetricsPoller(): void {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
    logger.info('[MetricsPoller] Stopped')
  }
}
