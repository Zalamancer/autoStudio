/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useCallback } from 'react'
import {
  Building2,
  ChevronRight,
  Loader2,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Globe,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBrandDirectorStore } from '@/stores/useBrandDirectorStore'
import { useMediaStore } from '@/stores/useMediaStore'
import type { BrandProfile, BrandImage, TrendData, VideoIdea } from '@/types/brandDirector'

interface BrandDirectorSectionProps {
  setPrompt: (prompt: string) => void
  updateSettings?: (updates: Record<string, unknown>) => void
}

export function BrandDirectorSection({ setPrompt, updateSettings }: BrandDirectorSectionProps) {
  const {
    url,
    phase,
    error,
    profile,
    images,
    trends,
    ideas,
    selectedIdeaId,
    isExpanded,
    setUrl,
    setExpanded,
    analyze,
    selectIdea,
    reset,
  } = useBrandDirectorStore()

  const handleAnalyze = useCallback(async () => {
    await analyze()
  }, [analyze])

  const handleSelectIdea = useCallback(
    async (ideaId: string) => {
      selectIdea(ideaId)
      // Build prompt and fill textarea
      const store = useBrandDirectorStore.getState()
      const idea = store.ideas.find((i) => i.id === ideaId)
      if (idea && store.profile) {
        const prompt = store.getSelectedIdeaPrompt()
        if (prompt) setPrompt(prompt)

        // Convert brand images to media assets
        const mediaStore = useMediaStore.getState()
        const brandImageAssetIds: string[] = []
        const brandImageRoles: Record<string, string> = {}

        for (const img of store.images) {
          try {
            const res = await fetch(img.base64)
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)

            const assetId = `brand-${img.role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
            mediaStore.addAsset(
              {
                id: assetId,
                name: `Brand: ${img.alt || img.role}`,
                type: img.mimeType || 'image/png',
                size: blob.size,
                category: 'images',
                url,
                addedAt: Date.now(),
              },
              blob,
            )

            brandImageAssetIds.push(assetId)
            brandImageRoles[assetId] = img.role
          } catch (err) {
            console.warn('[BrandDirector] Failed to convert brand image:', err)
          }
        }

        // Set brand context on orchestrator settings so buildPlanPrompt includes it
        if (updateSettings) {
          updateSettings({
            brandContext: {
              businessName: store.profile.businessName,
              industry: store.profile.industry,
              tone: store.profile.tone,
              primaryColors: store.profile.primaryColors,
              tagline: store.profile.tagline,
              ...(brandImageAssetIds.length > 0 ? { brandImageAssetIds, brandImageRoles } : {}),
            },
          })
        }
      }
    },
    [selectIdea, setPrompt, updateSettings],
  )

  const isAnalyzing = phase === 'analyzing-url' || phase === 'fetching-trends' || phase === 'generating-ideas'

  return (
    <div className="bg-panel-bg/60 border border-panel-border/40 rounded-lg overflow-hidden">
      {/* Collapse header */}
      <button
        onClick={() => setExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 transition-colors hover:bg-panel-surface/40"
      >
        <Building2 size={14} className="text-violet-400 shrink-0" />
        <span className="text-[11px] font-medium text-gray-300 flex-1 text-left">
          Brand Director
        </span>
        {phase === 'ready' && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-600/30">
            {ideas.length} ideas
          </span>
        )}
        <ChevronRight
          size={11}
          className={cn(
            'text-gray-500 transition-transform duration-200 shrink-0',
            isExpanded && 'rotate-90',
          )}
        />
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-white/5">
          {/* URL Input */}
          <div className="flex gap-2 pt-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yourbusiness.com"
              className="flex-1 bg-panel-surface border border-panel-border rounded-md px-2.5 py-1.5 text-[11px] text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500/60"
              disabled={isAnalyzing}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && url.trim()) handleAnalyze()
              }}
            />
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !url.trim()}
              className={cn(
                'px-3 py-1.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 shrink-0',
                isAnalyzing || !url.trim()
                  ? 'bg-panel-surface-hover text-gray-500 cursor-not-allowed'
                  : 'bg-violet-600 hover:bg-violet-500 text-white',
              )}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  {phase === 'analyzing-url' && 'Analyzing...'}
                  {phase === 'fetching-trends' && 'Finding trends...'}
                  {phase === 'generating-ideas' && 'Generating ideas...'}
                </>
              ) : (
                <>
                  <Globe size={12} />
                  Analyze
                </>
              )}
            </button>
          </div>

          {/* Phase: Progress indicator */}
          {isAnalyzing && (
            <div className="flex items-center gap-2 px-1">
              <div className="flex gap-1">
                <StepDot active={phase === 'analyzing-url'} done={phase === 'fetching-trends' || phase === 'generating-ideas'} label="Analyze" />
                <StepDot active={phase === 'fetching-trends'} done={phase === 'generating-ideas'} label="Trends" />
                <StepDot active={phase === 'generating-ideas'} done={false} label="Ideas" />
              </div>
            </div>
          )}

          {/* Phase: Error */}
          {phase === 'error' && error && (
            <div className="flex items-center gap-2 px-2 py-2 rounded-md bg-red-900/20 border border-red-700/30">
              <AlertCircle size={12} className="text-red-400 shrink-0" />
              <span className="text-[10px] text-red-300 flex-1">{error}</span>
              <button
                onClick={handleAnalyze}
                className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <RefreshCw size={10} />
                Retry
              </button>
            </div>
          )}

          {/* Phase: Ready — Brand summary + trends + ideas */}
          {phase === 'ready' && profile && (
            <>
              <BrandSummary profile={profile} images={images} />
              {trends && <TrendSummary trends={trends} />}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 px-1">
                  <Sparkles size={11} className="text-amber-400" />
                  <span className="text-[10px] font-medium text-gray-400">
                    Video Ideas — click to use
                  </span>
                </div>
                {ideas.map((idea) => (
                  <VideoIdeaCard
                    key={idea.id}
                    idea={idea}
                    isSelected={selectedIdeaId === idea.id}
                    onSelect={() => handleSelectIdea(idea.id)}
                  />
                ))}
              </div>
              <button
                onClick={reset}
                className="w-full text-[10px] text-gray-500 hover:text-gray-300 transition-colors py-1"
              >
                Clear & Start Over
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Sub-components ──

function StepDot({
  active,
  done,
  label,
}: {
  active: boolean
  done: boolean
  label: string
}) {
  return (
    <div className="flex items-center gap-1">
      <div
        className={cn(
          'w-1.5 h-1.5 rounded-full transition-colors',
          active && 'bg-violet-400 animate-pulse',
          done && !active && 'bg-emerald-400',
          !active && !done && 'bg-gray-600',
        )}
      />
      <span
        className={cn(
          'text-[9px] transition-colors',
          active && 'text-violet-400',
          done && !active && 'text-emerald-400',
          !active && !done && 'text-gray-600',
        )}
      >
        {label}
      </span>
    </div>
  )
}

function BrandSummary({
  profile,
  images,
}: {
  profile: BrandProfile
  images: BrandImage[]
}) {
  return (
    <div className="bg-panel-surface/60 rounded-md p-2.5 space-y-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-medium text-white">{profile.businessName}</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-900/30 text-violet-400 border border-violet-700/30">
          {profile.industry}
        </span>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-900/30 text-blue-400 border border-blue-700/30">
          {profile.tone}
        </span>
      </div>

      <p className="text-[10px] text-gray-400 leading-relaxed">{profile.description}</p>

      {/* Color swatches */}
      {profile.primaryColors.length > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-gray-500">Colors:</span>
          {profile.primaryColors.slice(0, 6).map((color, i) => (
            <div
              key={i}
              className="w-3.5 h-3.5 rounded-sm border border-white/10"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      )}

      {/* Image thumbnails */}
      {images.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto">
          {images.slice(0, 4).map((img, i) => (
            <img
              key={i}
              src={img.base64}
              alt={img.alt || img.role}
              className="w-10 h-10 rounded-sm object-cover border border-white/10 shrink-0"
            />
          ))}
          {images.length > 4 && (
            <div className="w-10 h-10 rounded-sm bg-panel-surface-hover border border-white/10 flex items-center justify-center text-[9px] text-gray-400 shrink-0">
              +{images.length - 4}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TrendSummary({ trends }: { trends: TrendData }) {
  const platforms = new Set(trends.items.map((t) => t.source.platform))
  const platformNames = Array.from(platforms)
    .map((p) => {
      switch (p) {
        case 'youtube': return 'YouTube'
        case 'tiktok': return 'TikTok'
        case 'instagram': return 'Instagram'
        case 'gemini-search': return 'Web'
        default: return p
      }
    })
    .join(', ')

  return (
    <div className="flex items-center gap-1.5 px-1">
      <TrendingUp size={11} className="text-emerald-400 shrink-0" />
      <span className="text-[10px] text-gray-400">
        Found {trends.items.length} trending topics from {platformNames}
      </span>
    </div>
  )
}

const ENGAGEMENT_COLORS = {
  viral: 'bg-rose-900/30 text-rose-400 border-rose-700/30',
  high: 'bg-emerald-900/30 text-emerald-400 border-emerald-700/30',
  medium: 'bg-amber-900/30 text-amber-400 border-amber-700/30',
  low: 'bg-gray-700/30 text-gray-400 border-gray-600/30',
}

function VideoIdeaCard({
  idea,
  isSelected,
  onSelect,
}: {
  idea: VideoIdea
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left rounded-lg p-2.5 transition-all duration-200 border',
        isSelected
          ? 'bg-violet-900/20 border-violet-600/40 ring-1 ring-violet-500/30'
          : 'bg-panel-surface/40 border-panel-border/40 hover:border-[#4a4a4a] hover:bg-panel-surface/60',
      )}
    >
      {/* Title + engagement badge */}
      <div className="flex items-start gap-2">
        <p className="text-[11px] font-medium text-white flex-1 leading-snug">{idea.title}</p>
        <span
          className={cn(
            'text-[8px] px-1.5 py-0.5 rounded-full border shrink-0 uppercase font-medium',
            ENGAGEMENT_COLORS[idea.estimatedEngagement],
          )}
        >
          {idea.estimatedEngagement}
        </span>
      </div>

      {/* Concept */}
      <p className="text-[10px] text-gray-400 mt-1 leading-relaxed line-clamp-2">
        {idea.concept}
      </p>

      {/* Metadata chips */}
      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-panel-surface-hover/60 text-gray-400">
          {idea.suggestedDuration}s
        </span>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-panel-surface-hover/60 text-gray-400">
          {idea.suggestedAspectRatio}
        </span>
        {idea.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="text-[9px] px-1.5 py-0.5 rounded bg-violet-900/20 text-violet-400/70"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <p className="text-[9px] text-violet-400 mt-1.5 flex items-center gap-1">
          <ExternalLink size={9} />
          Prompt filled — click "Plan Clip" to continue
        </p>
      )}
    </button>
  )
}
