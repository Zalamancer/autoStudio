import { useState, useEffect, useCallback } from 'react'
import {
  Zap,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  ArrowRight,
  AlertCircle,
  Facebook,
  Instagram,
  Music2,
  AtSign,
  Youtube,
} from 'lucide-react'
import { useLearningStore } from '@/stores/useLearningStore'
import { useEditorStore } from '@/stores'
import { GaugeChart } from '@/components/charts'
import type { SocialPlatform } from '@/types/social'
import type { Recommendation } from '@/types/learning'

// ── Priority Badge ──

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    high: 'text-red-400 bg-red-500/10',
    medium: 'text-amber-400 bg-amber-500/10',
    low: 'text-green-400 bg-green-500/10',
  }
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium uppercase ${styles[priority] || styles.medium}`}>
      {priority}
    </span>
  )
}

// ── Recommendation Card ──

function RecommendationCard({
  recommendation,
  onApply,
  onDismiss,
}: {
  recommendation: Recommendation
  onApply: () => void
  onDismiss: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isApplied = recommendation.status === 'applied'
  const hasAction = recommendation.actionType !== null

  return (
    <div className={`bg-zinc-800/60 rounded-lg border transition-colors ${
      isApplied ? 'border-green-500/30 bg-green-500/5' : 'border-zinc-700/40'
    }`}>
      <div className="p-3 space-y-2">
        {/* Header */}
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <PriorityBadge priority={recommendation.priority} />
              <span className="text-[9px] text-zinc-500 capitalize">{recommendation.category.replace(/_/g, ' ')}</span>
            </div>
            <h4 className="text-xs font-medium text-white leading-tight">{recommendation.title}</h4>
          </div>
          <button onClick={() => setExpanded(!expanded)}
            className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors">
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        {/* Expanded Description */}
        {expanded && (
          <p className="text-[10px] text-zinc-400 leading-relaxed pl-0.5">
            {recommendation.description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          {hasAction && !isApplied && (
            <button onClick={onApply}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-medium hover:bg-purple-500/30 transition-colors">
              <ArrowRight size={10} />
              Apply
            </button>
          )}
          {isApplied && (
            <span className="flex items-center gap-1 text-[10px] text-green-400">
              <Check size={10} />
              Applied
            </span>
          )}
          {!isApplied && (
            <button onClick={onDismiss}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-zinc-500 text-[10px] hover:text-zinc-300 hover:bg-zinc-700/40 transition-colors">
              <X size={10} />
              Dismiss
            </button>
          )}
          {recommendation.confidence > 0 && (
            <span className="ml-auto text-[9px] text-zinc-500">
              {Math.round(recommendation.confidence * 100)}% confidence
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Panel ──

const PLATFORMS: SocialPlatform[] = ['tiktok', 'instagram', 'facebook', 'x', 'youtube']
const PLATFORM_CONFIG: Record<SocialPlatform, { label: string; icon: typeof Facebook }> = {
  facebook: { label: 'Facebook', icon: Facebook },
  instagram: { label: 'Instagram', icon: Instagram },
  tiktok: { label: 'TikTok', icon: Music2 },
  x: { label: 'X', icon: AtSign },
  youtube: { label: 'YouTube', icon: Youtube },
}

export function RecommendationsPanel() {
  const {
    recommendations,
    isLoadingRecommendations,
    isScoring,
    isAnalyzing,
    currentScore,
    scoreCurrentProject,
    triggerGeminiAnalysis,
    applyRecommendation,
    dismissRecommendation,
  } = useLearningStore()
  const closeModal = useCallback(() => useEditorStore.getState().setRecommendationsModalOpen(false), [])

  const [activePlatform, setActivePlatform] = useState<SocialPlatform>('tiktok')

  useEffect(() => {
    scoreCurrentProject(activePlatform)
  }, [activePlatform, scoreCurrentProject])

  const pendingRecs = recommendations.filter((r) => r.status === 'pending')
  const appliedRecs = recommendations.filter((r) => r.status === 'applied')
  const applyableRecs = pendingRecs.filter((r) => r.actionType !== null)

  const handleApplyAll = useCallback(() => {
    for (const rec of applyableRecs) {
      applyRecommendation(rec)
    }
  }, [applyableRecs, applyRecommendation])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
      <div className="bg-zinc-900 border border-zinc-700/60 rounded-xl w-[480px] max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-700/40">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Recommendations</h2>
          </div>
          <button onClick={closeModal}
            className="p-1.5 rounded-md hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Platform Tabs */}
        <div className="flex items-center gap-1 px-5 py-3 border-b border-zinc-700/20">
          {PLATFORMS.map((p) => {
            const cfg = PLATFORM_CONFIG[p]
            const Icon = cfg.icon
            return (
              <button key={p}
                onClick={() => setActivePlatform(p)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${
                  activePlatform === p ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-400 hover:text-white hover:bg-zinc-700/40'
                }`}>
                <Icon size={10} />
                {cfg.label}
              </button>
            )
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Score Gauge */}
          {(isScoring || currentScore) && (
            <div className="flex justify-center">
              {isScoring ? (
                <div className="flex items-center gap-2 py-6 text-zinc-400">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-xs">Scoring project...</span>
                </div>
              ) : currentScore && (
                <div className="text-center space-y-1">
                  <GaugeChart
                    value={currentScore.score}
                    max={100}
                    label="Predicted Score"
                    formatValue={(v) => `${v}`}
                  />
                  {currentScore.confidence < 0.5 && (
                    <div className="flex items-center justify-center gap-1 text-[9px] text-amber-400">
                      <AlertCircle size={10} />
                      Low confidence — publish more to improve accuracy
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Loading */}
          {isLoadingRecommendations && (
            <div className="flex items-center justify-center gap-2 py-4 text-zinc-400">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-xs">Loading recommendations...</span>
            </div>
          )}

          {/* Pending Recommendations */}
          {pendingRecs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wide text-zinc-500 font-medium">
                  Suggestions ({pendingRecs.length})
                </span>
                {applyableRecs.length > 1 && (
                  <button onClick={handleApplyAll}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-purple-300 hover:bg-purple-500/10 transition-colors">
                    <Check size={10} />
                    Apply All ({applyableRecs.length})
                  </button>
                )}
              </div>
              {pendingRecs.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  onApply={() => applyRecommendation(rec)}
                  onDismiss={() => dismissRecommendation(rec.id)}
                />
              ))}
            </div>
          )}

          {/* Applied Recommendations */}
          {appliedRecs.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wide text-zinc-500 font-medium">
                Applied ({appliedRecs.length})
              </span>
              {appliedRecs.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  onApply={() => {}}
                  onDismiss={() => {}}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoadingRecommendations && pendingRecs.length === 0 && appliedRecs.length === 0 && (
            <div className="text-center py-6 space-y-3">
              <Zap size={28} className="mx-auto text-zinc-600" />
              <p className="text-xs text-zinc-400">
                No recommendations yet. Publish content to start getting suggestions.
              </p>
            </div>
          )}

          {/* Gemini Analysis Button */}
          <button onClick={() => triggerGeminiAnalysis(activePlatform)}
            disabled={isAnalyzing}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium hover:bg-purple-500/20 disabled:opacity-50 transition-colors">
            {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {isAnalyzing ? 'Analyzing with AI...' : 'Get AI Recommendations'}
          </button>
        </div>
      </div>
    </div>
  )
}
