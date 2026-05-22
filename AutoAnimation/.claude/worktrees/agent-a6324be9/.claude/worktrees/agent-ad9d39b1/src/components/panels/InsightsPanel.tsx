import { useState, useEffect, useCallback } from 'react'
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Loader2,
  Lightbulb,
  Sparkles,
  BarChart3,
  Facebook,
  Instagram,
  Music2,
  AtSign,
  X,
  Youtube,
} from 'lucide-react'
import { useLearningStore } from '@/stores/useLearningStore'
import { useEditorStore } from '@/stores'
import { GaugeChart } from '@/components/charts'
import type { SocialPlatform } from '@/types/social'
import type { LearnedPattern, GeminiTrend } from '@/types/learning'

// ── Platform Config ──

const PLATFORM_CONFIG: Record<SocialPlatform, { label: string; icon: typeof Facebook; color: string }> = {
  facebook: { label: 'Facebook', icon: Facebook, color: 'text-blue-400' },
  instagram: { label: 'Instagram', icon: Instagram, color: 'text-pink-400' },
  tiktok: { label: 'TikTok', icon: Music2, color: 'text-cyan-400' },
  x: { label: 'X', icon: AtSign, color: 'text-zinc-300' },
  youtube: { label: 'YouTube', icon: Youtube, color: 'text-red-400' },
}

const PLATFORMS: SocialPlatform[] = ['tiktok', 'instagram', 'facebook', 'x', 'youtube']

// ── Insight Card ──

function InsightCard({ insight }: { insight: LearnedPattern }) {
  const impactColor = insight.impactScore > 0.6
    ? 'text-red-400 bg-red-500/10'
    : insight.impactScore > 0.3
    ? 'text-amber-400 bg-amber-500/10'
    : 'text-green-400 bg-green-500/10'

  const typeIcon = insight.patternType === 'gemini_insight'
    ? Sparkles
    : insight.patternType === 'feature_correlation'
    ? BarChart3
    : Lightbulb

  const TypeIcon = typeIcon

  return (
    <div className="bg-zinc-800/60 rounded-lg border border-zinc-700/40 p-3 space-y-2">
      <div className="flex items-start gap-2">
        <TypeIcon size={14} className="text-purple-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-medium text-white leading-tight">{insight.title}</h4>
          {insight.description && (
            <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">{insight.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${impactColor}`}>
          {insight.impactScore > 0.6 ? 'High Impact' : insight.impactScore > 0.3 ? 'Medium Impact' : 'Low Impact'}
        </span>
        <span className="text-[9px] text-zinc-500">
          Confidence: {Math.round(insight.confidence * 100)}%
        </span>
        {insight.sampleSize > 0 && (
          <span className="text-[9px] text-zinc-500">
            ({insight.sampleSize} posts)
          </span>
        )}
      </div>
    </div>
  )
}

// ── Trend Card ──

function TrendCard({ trend }: { trend: GeminiTrend }) {
  const TrendIcon = trend.direction === 'improving'
    ? TrendingUp
    : trend.direction === 'declining'
    ? TrendingDown
    : Minus

  const trendColor = trend.direction === 'improving'
    ? 'text-green-400'
    : trend.direction === 'declining'
    ? 'text-red-400'
    : 'text-zinc-400'

  return (
    <div className="flex items-start gap-2 bg-zinc-800/40 rounded-lg p-2.5">
      <TrendIcon size={14} className={`${trendColor} mt-0.5 flex-shrink-0`} />
      <div>
        <h4 className="text-xs font-medium text-white">{trend.title}</h4>
        <p className="text-[10px] text-zinc-400 mt-0.5">{trend.description}</p>
      </div>
    </div>
  )
}

// ── Main Panel ──

export function InsightsPanel() {
  const {
    insights,
    isLoadingInsights,
    isAnalyzing,
    currentScore,
    analysisResult,
    fetchInsights,
    triggerGeminiAnalysis,
    scoreCurrentProject,
  } = useLearningStore()
  const closeModal = useCallback(() => useEditorStore.getState().setInsightsModalOpen(false), [])

  const [activePlatform, setActivePlatform] = useState<SocialPlatform | null>(null)

  useEffect(() => {
    fetchInsights(activePlatform || undefined)
  }, [activePlatform, fetchInsights])

  const handleRefresh = useCallback(() => {
    fetchInsights(activePlatform || undefined)
    if (activePlatform) scoreCurrentProject(activePlatform)
  }, [activePlatform, fetchInsights, scoreCurrentProject])

  const handleGeminiAnalysis = useCallback(() => {
    if (activePlatform) {
      triggerGeminiAnalysis(activePlatform)
    }
  }, [activePlatform, triggerGeminiAnalysis])

  // Group insights by category
  const groupedInsights = insights.reduce<Record<string, LearnedPattern[]>>((acc, insight) => {
    const key = insight.featureKey || 'general'
    if (!acc[key]) acc[key] = []
    acc[key].push(insight)
    return acc
  }, {})

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
      <div className="bg-zinc-900 border border-zinc-700/60 rounded-xl w-[520px] max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-700/40">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-purple-400" />
            <h2 className="text-sm font-semibold text-white">Performance Insights</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleRefresh}
              className="p-1.5 rounded-md hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition-colors"
              title="Refresh insights">
              <RefreshCw size={14} className={isLoadingInsights ? 'animate-spin' : ''} />
            </button>
            <button onClick={closeModal}
              className="p-1.5 rounded-md hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Platform Tabs */}
        <div className="flex items-center gap-1 px-5 py-3 border-b border-zinc-700/20">
          <button
            onClick={() => setActivePlatform(null)}
            className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${
              !activePlatform ? 'bg-purple-500/20 text-purple-300' : 'text-zinc-400 hover:text-white hover:bg-zinc-700/40'
            }`}>
            All
          </button>
          {PLATFORMS.map((p) => {
            const cfg = PLATFORM_CONFIG[p]
            const Icon = cfg.icon
            return (
              <button key={p}
                onClick={() => setActivePlatform(p)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${
                  activePlatform === p ? 'bg-purple-500/20 text-purple-300' : 'text-zinc-400 hover:text-white hover:bg-zinc-700/40'
                }`}>
                <Icon size={10} />
                {cfg.label}
              </button>
            )
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Score Gauge */}
          {currentScore && (
            <div className="flex justify-center">
              <GaugeChart
                value={currentScore.score}
                max={100}
                label="Performance Score"
                formatValue={(v) => `${v}`}
              />
            </div>
          )}

          {/* Loading State */}
          {isLoadingInsights && (
            <div className="flex items-center justify-center gap-2 py-8 text-zinc-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs">Loading insights...</span>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingInsights && insights.length === 0 && (
            <div className="text-center py-8 space-y-3">
              <Brain size={32} className="mx-auto text-zinc-600" />
              <p className="text-xs text-zinc-400">
                No insights yet. Publish content and track performance to start learning.
              </p>
              {activePlatform && (
                <button onClick={handleGeminiAnalysis}
                  disabled={isAnalyzing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-purple-500/20 text-purple-300 text-xs hover:bg-purple-500/30 disabled:opacity-50 transition-colors">
                  {isAnalyzing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  Run AI Analysis
                </button>
              )}
            </div>
          )}

          {/* Insights by Category */}
          {Object.entries(groupedInsights).map(([category, catInsights]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-[10px] uppercase tracking-wide text-zinc-500 font-medium">
                {category.replace(/_/g, ' ')}
              </h3>
              {catInsights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          ))}

          {/* Trends from Gemini */}
          {analysisResult?.trends && analysisResult.trends.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[10px] uppercase tracking-wide text-zinc-500 font-medium">
                Trends
              </h3>
              {analysisResult.trends.map((trend, i) => (
                <TrendCard key={i} trend={trend} />
              ))}
            </div>
          )}

          {/* Gemini Analysis Button */}
          {insights.length > 0 && activePlatform && (
            <button onClick={handleGeminiAnalysis}
              disabled={isAnalyzing}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium hover:bg-purple-500/20 disabled:opacity-50 transition-colors">
              {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {isAnalyzing ? 'Analyzing...' : 'Deep AI Analysis'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
