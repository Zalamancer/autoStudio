import { useState, useCallback, useEffect, useMemo } from 'react'
import {
  BarChart3,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Clock,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  Users,
  MousePointer,
  UserPlus,
  Repeat2,
  Quote,
  Film,
  Facebook,
  Instagram,
  Music2,
  AtSign,
  Loader2,
  Brain,
  Youtube,
} from 'lucide-react'
import { useEditorStore } from '@/stores'
import { useRecordingsStore } from '@/stores/useRecordingsStore'
import { useAnalyticsStore } from '@/stores/useAnalyticsStore'
import { DonutChart, GaugeChart, ComparisonBar, CHART_COLORS } from '@/components/charts'
import type { SocialPlatform } from '@/types/social'
import type {
  PostMetrics,
  FacebookMetrics,
  InstagramMetrics,
  TikTokMetrics,
  XMetrics,
  AggregatedMetrics,
} from '@/types/analytics'

// ── Helpers ──────────────────────────────────────────────────────────────
function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`
}

function formatWatchTime(sec: number): string {
  if (sec >= 60) return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`
  return `${sec.toFixed(1)}s`
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.floor(diffHr / 24)}d ago`
}

const PLATFORM_CONFIG: Record<SocialPlatform, { label: string; icon: typeof Facebook; color: string; bgColor: string }> = {
  facebook: { label: 'Facebook', icon: Facebook, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  instagram: { label: 'Instagram', icon: Instagram, color: 'text-pink-400', bgColor: 'bg-pink-500/10' },
  tiktok: { label: 'TikTok', icon: Music2, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
  x: { label: 'X', icon: AtSign, color: 'text-zinc-300', bgColor: 'bg-zinc-500/10' },
  youtube: { label: 'YouTube', icon: Youtube, color: 'text-red-400', bgColor: 'bg-red-500/10' },
}

// ── Summary Stat Card ────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: typeof Eye; color: string }) {
  return (
    <div className="bg-zinc-900/40 backdrop-blur-md rounded-xl border border-white/5 p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className={color} />
        <span className="text-[10px] text-zinc-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-lg font-semibold text-white">{value}</div>
    </div>
  )
}

// ── Metric Row ───────────────────────────────────────────────────────────
function MetricRow({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Eye }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-zinc-400 flex items-center gap-1.5">
        {Icon && <Icon size={12} className="text-zinc-500" />}
        {label}
      </span>
      <span className="text-xs font-medium text-white">{value}</span>
    </div>
  )
}

// ── Section header ──────────────────────────────────────────────────────
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h5 className="text-[10px] text-zinc-500 uppercase tracking-wide mb-2">{children}</h5>
  )
}

// ── Bar Chart (CSS-only) — for demographics / sources ───────────────────
function BarChart({ data, color }: { data: Record<string, number>; color: string }) {
  const entries = Object.entries(data)
  if (entries.length === 0) return null
  const max = Math.max(...entries.map(([, v]) => v), 1)

  return (
    <div className="space-y-1.5">
      {entries.map(([label, value]) => (
        <div key={label} className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 w-16 text-right truncate">{label}</span>
          <div className="flex-1 h-4 bg-zinc-800 rounded-sm overflow-hidden">
            <div
              className={`h-full rounded-sm ${color} transition-all duration-500`}
              style={{ width: `${(value / max) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-zinc-400 w-8">{value}%</span>
        </div>
      ))}
    </div>
  )
}

// ── Core Metrics (shared across all platforms) ──────────────────────────
function CoreMetrics({ m }: { m: PostMetrics }) {
  const totalInteractions = m.likes + m.comments + m.shares + m.saves

  return (
    <div className="space-y-4">
      {/* Visual charts row: Donut + Gauge */}
      <div className="flex flex-wrap justify-center gap-4">
        <DonutChart
          data={[
            { label: 'Likes', value: m.likes, color: CHART_COLORS.likes },
            { label: 'Comments', value: m.comments, color: CHART_COLORS.comments },
            { label: 'Shares', value: m.shares, color: CHART_COLORS.shares },
            { label: 'Saves', value: m.saves, color: CHART_COLORS.saves },
          ]}
          centerValue={formatNumber(totalInteractions)}
          centerLabel="Interactions"
          size={130}
        />

        <GaugeChart
          value={m.engagementRate}
          max={15}
          label="Engagement Rate"
          formatValue={(v) => `${v.toFixed(1)}%`}
        />
      </div>

      {/* Detailed number breakdown */}
      <div className="border-t border-zinc-700/40 pt-3 space-y-0.5">
        <MetricRow label="Views" value={formatNumber(m.views)} icon={Eye} />
        <MetricRow label="Likes" value={formatNumber(m.likes)} icon={Heart} />
        <MetricRow label="Comments" value={formatNumber(m.comments)} icon={MessageCircle} />
        <MetricRow label="Shares" value={formatNumber(m.shares)} icon={Share2} />
        <MetricRow label="Saves" value={formatNumber(m.saves)} icon={Bookmark} />
        <MetricRow label="Avg Watch Time" value={formatWatchTime(m.avgWatchTimeSec)} icon={Clock} />
        <MetricRow label="Engagement Rate" value={formatPercent(m.engagementRate)} icon={TrendingUp} />
      </div>
    </div>
  )
}

// ── Platform-Specific Metric Sections ────────────────────────────────────

function FacebookDetails({ m }: { m: FacebookMetrics }) {
  return (
    <div className="space-y-4">
      <CoreMetrics m={m} />

      <div className="border-t border-zinc-700/40 pt-3">
        <SectionHeader>Discovery</SectionHeader>
        <ComparisonBar
          pairs={[{
            label: '',
            values: [
              { name: 'Reach', value: m.reach, color: CHART_COLORS.reach },
              { name: 'Impressions', value: m.impressions, color: CHART_COLORS.impressions },
            ],
          }]}
        />
        <div className="mt-2 space-y-0.5">
          <MetricRow label="Reach" value={formatNumber(m.reach)} icon={Users} />
          <MetricRow label="Impressions" value={formatNumber(m.impressions)} icon={Eye} />
          <MetricRow label="Clicks" value={formatNumber(m.clicks)} icon={MousePointer} />
          <MetricRow label="CTA Clicks" value={formatNumber(m.ctaClicks)} icon={MousePointer} />
        </div>
      </div>

      {Object.keys(m.demographicsAge).length > 0 && (
        <div className="border-t border-zinc-700/40 pt-3">
          <SectionHeader>Age Demographics</SectionHeader>
          <BarChart data={m.demographicsAge} color="bg-blue-500/60" />
        </div>
      )}

      {Object.keys(m.demographicsGender).length > 0 && (
        <div className="border-t border-zinc-700/40 pt-3">
          <SectionHeader>Gender</SectionHeader>
          <BarChart data={m.demographicsGender} color="bg-blue-400/60" />
        </div>
      )}
    </div>
  )
}

function InstagramDetails({ m }: { m: InstagramMetrics }) {
  return (
    <div className="space-y-4">
      <CoreMetrics m={m} />

      <div className="border-t border-zinc-700/40 pt-3">
        <SectionHeader>Discovery</SectionHeader>
        <ComparisonBar
          pairs={[{
            label: '',
            values: [
              { name: 'Reach', value: m.reach, color: CHART_COLORS.reach },
              { name: 'Impressions', value: m.impressions, color: CHART_COLORS.impressions },
            ],
          }]}
        />
        <div className="mt-2 space-y-0.5">
          <MetricRow label="Reach" value={formatNumber(m.reach)} icon={Users} />
          <MetricRow label="Impressions" value={formatNumber(m.impressions)} icon={Eye} />
          <MetricRow label="Profile Visits" value={formatNumber(m.profileVisits)} icon={MousePointer} />
          <MetricRow label="New Follows" value={formatNumber(m.followsFromPost)} icon={UserPlus} />
        </div>
      </div>
    </div>
  )
}

function TikTokDetails({ m }: { m: TikTokMetrics }) {
  return (
    <div className="space-y-4">
      <CoreMetrics m={m} />

      <div className="border-t border-zinc-700/40 pt-3">
        <SectionHeader>Retention</SectionHeader>
        {m.fullVideoViewsPercent > 0 && (
          <div className="flex justify-center mb-2">
            <GaugeChart
              value={m.fullVideoViewsPercent}
              max={100}
              label="Full Video Views"
              formatValue={(v) => `${v.toFixed(0)}%`}
              color="#22d3ee"
              width={120}
            />
          </div>
        )}
        <MetricRow label="Full Video Views" value={formatPercent(m.fullVideoViewsPercent)} icon={Eye} />
      </div>

      {Object.keys(m.trafficSources).length > 0 && (
        <div className="border-t border-zinc-700/40 pt-3">
          <SectionHeader>Traffic Sources</SectionHeader>
          <BarChart data={m.trafficSources} color="bg-cyan-500/60" />
        </div>
      )}

      {Object.keys(m.audienceTerritories).length > 0 && (
        <div className="border-t border-zinc-700/40 pt-3">
          <SectionHeader>Audience Territories</SectionHeader>
          <BarChart data={m.audienceTerritories} color="bg-cyan-400/60" />
        </div>
      )}
    </div>
  )
}

function XDetails({ m }: { m: XMetrics }) {
  return (
    <div className="space-y-4">
      <CoreMetrics m={m} />

      <div className="border-t border-zinc-700/40 pt-3">
        <SectionHeader>Engagement Breakdown</SectionHeader>
        <DonutChart
          data={[
            { label: 'Retweets', value: m.retweets, color: CHART_COLORS.retweets },
            { label: 'Quotes', value: m.quoteTweets, color: CHART_COLORS.quotes },
            { label: 'Bookmarks', value: m.bookmarks, color: CHART_COLORS.bookmarks },
            { label: 'URL Clicks', value: m.urlClicks, color: CHART_COLORS.urlClicks },
            { label: 'Profile', value: m.profileClicks, color: CHART_COLORS.profileClicks },
          ]}
          centerValue={formatNumber(m.impressions)}
          centerLabel="Impressions"
          size={130}
        />
        <div className="mt-3 space-y-0.5">
          <MetricRow label="Impressions" value={formatNumber(m.impressions)} icon={Eye} />
          <MetricRow label="Retweets" value={formatNumber(m.retweets)} icon={Repeat2} />
          <MetricRow label="Quote Tweets" value={formatNumber(m.quoteTweets)} icon={Quote} />
          <MetricRow label="Bookmarks" value={formatNumber(m.bookmarks)} icon={Bookmark} />
          <MetricRow label="URL Clicks" value={formatNumber(m.urlClicks)} icon={MousePointer} />
          <MetricRow label="Profile Clicks" value={formatNumber(m.profileClicks)} icon={MousePointer} />
          <MetricRow label="Follower Growth" value={`+${formatNumber(m.followerGrowth)}`} icon={UserPlus} />
        </div>
      </div>
    </div>
  )
}

// ── Main Analytics Panel ─────────────────────────────────────────────────
export function AnalyticsPanel() {
  const analyticsRecordingId = useEditorStore((s) => s.analyticsRecordingId)
  const recording = useRecordingsStore((s) =>
    s.recordings.find((r) => r.id === analyticsRecordingId)
  )
  const publishedPosts = useAnalyticsStore((s) => s.publishedPosts)
  const isRefreshing = useAnalyticsStore((s) => s.isRefreshing)
  const lastRefreshedAt = useAnalyticsStore((s) => s.lastRefreshedAt)
  const refreshMetrics = useAnalyticsStore((s) => s.refreshMetrics)

  const posts = useMemo(() => {
    if (!analyticsRecordingId) return []
    return publishedPosts.filter((p) => p.recordingId === analyticsRecordingId)
  }, [publishedPosts, analyticsRecordingId])

  const aggregated = useMemo(() => {
    if (!analyticsRecordingId) return null
    const withMetrics = publishedPosts.filter(
      (p) => p.recordingId === analyticsRecordingId && p.metrics
    )
    if (withMetrics.length === 0) {
      return { totalViews: 0, totalLikes: 0, totalComments: 0, totalShares: 0, totalSaves: 0, avgEngagementRate: 0, platforms: [] as AggregatedMetrics['platforms'] }
    }
    let totalViews = 0, totalLikes = 0, totalComments = 0, totalShares = 0, totalSaves = 0, weightedEngagement = 0
    const platforms: AggregatedMetrics['platforms'] = []
    for (const post of withMetrics) {
      const m = post.metrics!
      totalViews += m.views
      totalLikes += m.likes
      totalComments += m.comments
      totalShares += m.shares
      totalSaves += m.saves
      weightedEngagement += m.engagementRate * m.views
      platforms.push({ platform: post.platform, metrics: m })
    }
    return { totalViews, totalLikes, totalComments, totalShares, totalSaves, avgEngagementRate: totalViews > 0 ? weightedEngagement / totalViews : 0, platforms }
  }, [publishedPosts, analyticsRecordingId])

  const [activePlatformIdx, setActivePlatformIdx] = useState(0)

  // Auto-refresh on mount
  useEffect(() => {
    if (analyticsRecordingId && posts.length > 0) {
      refreshMetrics(analyticsRecordingId)
    }
  }, [analyticsRecordingId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = useCallback(() => {
    if (analyticsRecordingId) {
      refreshMetrics(analyticsRecordingId)
    }
  }, [analyticsRecordingId, refreshMetrics])

  const platformsWithPosts = useMemo(() => {
    const seen = new Set<SocialPlatform>()
    return posts.filter((p) => {
      if (seen.has(p.platform)) return false
      seen.add(p.platform)
      return true
    })
  }, [posts])

  // No recording selected
  if (!recording) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BarChart3 size={32} className="text-zinc-600 mb-3" />
        <p className="text-sm text-zinc-400">No recording selected</p>
      </div>
    )
  }

  // No posts published yet
  if (posts.length === 0) {
    return (
      <div className="space-y-6">
        {/* Recording header */}
        <div className="flex items-center gap-3 p-3 bg-zinc-900/40 backdrop-blur-md rounded-xl border border-white/5">
          {recording.thumbnailUrl ? (
            <img src={recording.thumbnailUrl} alt="" className="w-20 h-12 object-contain rounded bg-black" />
          ) : (
            <div className="w-20 h-12 bg-zinc-900 rounded flex items-center justify-center">
              <Film size={16} className="text-zinc-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white truncate">{recording.name}</h3>
            <p className="text-[10px] text-zinc-500">{recording.format.toUpperCase()} &middot; {recording.width}x{recording.height}</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-2xl bg-zinc-800/60 mb-4">
            <BarChart3 size={36} className="text-zinc-600" />
          </div>
          <h3 className="text-sm font-medium text-zinc-400 mb-1">No posts yet</h3>
          <p className="text-xs text-zinc-500 max-w-[260px]">
            Share this recording to social media first. Analytics will appear here once your post is published.
          </p>
        </div>
      </div>
    )
  }

  const activePost = platformsWithPosts[activePlatformIdx] ?? platformsWithPosts[0]

  return (
    <div className="space-y-5">
      {/* Recording header */}
      <div className="flex items-center gap-3 p-3 bg-zinc-900/40 backdrop-blur-md rounded-xl border border-white/5">
        {recording.thumbnailUrl ? (
          <img src={recording.thumbnailUrl} alt="" className="w-20 h-12 object-contain rounded bg-black" />
        ) : (
          <div className="w-20 h-12 bg-zinc-900 rounded flex items-center justify-center">
            <Film size={16} className="text-zinc-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white truncate">{recording.name}</h3>
          <p className="text-[10px] text-zinc-500">
            Published to {platformsWithPosts.length} platform{platformsWithPosts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => useEditorStore.getState().setInsightsModalOpen(true)}
          className="p-2 rounded-lg text-zinc-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
          title="View AI Insights"
        >
          <Brain size={16} />
        </button>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700/60 transition-colors disabled:opacity-50"
          title="Refresh metrics"
        >
          {isRefreshing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
        </button>
      </div>

      {/* Summary cards */}
      {aggregated && aggregated.totalViews > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <StatCard label="Total Views" value={formatNumber(aggregated.totalViews)} icon={Eye} color="text-blue-400" />
          <StatCard label="Total Likes" value={formatNumber(aggregated.totalLikes)} icon={Heart} color="text-pink-400" />
          <StatCard label="Total Comments" value={formatNumber(aggregated.totalComments)} icon={MessageCircle} color="text-green-400" />
          <StatCard label="Engagement" value={formatPercent(aggregated.avgEngagementRate)} icon={TrendingUp} color="text-amber-400" />
        </div>
      )}

      {/* Platform tabs */}
      {platformsWithPosts.length > 1 && (
        <div className="flex gap-1">
          {platformsWithPosts.map((post, idx) => {
            const cfg = PLATFORM_CONFIG[post.platform]
            const Icon = cfg.icon
            const isActive = idx === activePlatformIdx
            return (
              <button
                key={post.id}
                onClick={() => setActivePlatformIdx(idx)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs rounded-lg transition-colors ${isActive
                    ? `${cfg.bgColor} ${cfg.color} ring-1 ring-current/30`
                    : 'bg-zinc-900/50 border border-white/5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                  }`}
              >
                <Icon size={14} />
                {cfg.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Platform metrics */}
      {activePost && (
        <div className="bg-zinc-900/40 backdrop-blur-md rounded-xl border border-white/5 p-4">
          {/* Platform header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {(() => {
                const cfg = PLATFORM_CONFIG[activePost.platform]
                const Icon = cfg.icon
                return (
                  <>
                    <Icon size={16} className={cfg.color} />
                    <span className="text-sm font-medium text-white">{cfg.label}</span>
                  </>
                )
              })()}
            </div>
            <div className="flex items-center gap-2">
              {activePost.postUrl && (
                <a
                  href={activePost.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <ExternalLink size={10} />
                  View post
                </a>
              )}
              {activePost.metrics?.lastFetchedAt && (
                <span className="text-[10px] text-zinc-600">
                  Updated {timeAgo(activePost.metrics.lastFetchedAt)}
                </span>
              )}
            </div>
          </div>

          {/* Metrics content */}
          {activePost.metrics ? (
            <>
              {activePost.platform === 'facebook' && <FacebookDetails m={activePost.metrics as FacebookMetrics} />}
              {activePost.platform === 'instagram' && <InstagramDetails m={activePost.metrics as InstagramMetrics} />}
              {activePost.platform === 'tiktok' && <TikTokDetails m={activePost.metrics as TikTokMetrics} />}
              {activePost.platform === 'x' && <XDetails m={activePost.metrics as XMetrics} />}
            </>
          ) : isRefreshing ? (
            <div className="py-8 text-center">
              <Loader2 size={20} className="animate-spin text-zinc-500 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">Loading metrics...</p>
            </div>
          ) : (
            <div className="py-8 text-center">
              <BarChart3 size={20} className="text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">Metrics not available yet.</p>
              <p className="text-[10px] text-zinc-600 mt-1">New posts may take a few minutes before analytics are ready.</p>
              <button
                onClick={handleRefresh}
                className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Last refreshed */}
      {lastRefreshedAt && (
        <p className="text-[10px] text-zinc-600 text-center">
          Last refreshed {timeAgo(lastRefreshedAt)}
        </p>
      )}
    </div>
  )
}
