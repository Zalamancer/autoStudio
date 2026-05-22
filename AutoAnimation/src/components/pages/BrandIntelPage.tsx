import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Globe,
  Users,
  MessageSquare,
  Swords,
  BarChart3,
  TrendingUp,
  Lightbulb,
  RefreshCw,
  Loader2,
  Check,
  ExternalLink,
  Search,
  ChevronRight,
  ChevronDown,
  Plus,
  Eye,
  X,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Star,
  AlertTriangle,
  Target,
  Sparkles,
  Play,
} from 'lucide-react'
import { useBrandIntelStore, type AnalysisStep } from '@/stores/useBrandIntelStore'
import type {
  BrandIntelSection,
  BrandMention,
  CompetitorProfile,
  CompetitiveInsight,
  SocialAccount,
  VideoIdea,
  IdeaSourceEvidence,
} from '@/types/brandDirector'

// ── Section config ──

const SECTIONS: Array<{ id: BrandIntelSection; label: string; icon: typeof Globe }> = [
  { id: 'overview', label: 'Overview', icon: Globe },
  { id: 'social', label: 'Social', icon: Users },
  { id: 'mentions', label: 'Mentions', icon: MessageSquare },
  { id: 'competitors', label: 'Competitors', icon: Swords },
  { id: 'analysis', label: 'Analysis', icon: BarChart3 },
  { id: 'trends', label: 'Trends', icon: TrendingUp },
  { id: 'ideas', label: 'Ideas', icon: Lightbulb },
]

// ── Helper components ──

function SectionHeader({ title, onRefresh, isLoading }: { title: string; onRefresh?: () => void; isLoading?: boolean }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      )}
    </div>
  )
}

function LoadingCard({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-gray-500">
      <Loader2 size={20} className="animate-spin" />
      <span>{text}</span>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-gray-600">
      <span>{text}</span>
    </div>
  )
}

// ── URL Input (landing state) ──

function URLInputSection() {
  const brandUrl = useBrandIntelStore((s) => s.brandUrl)
  const setBrandUrl = useBrandIntelStore((s) => s.setBrandUrl)
  const analyzeFullBrand = useBrandIntelStore((s) => s.analyzeFullBrand)
  const phase = useBrandIntelStore((s) => s.phase)
  const error = useBrandIntelStore((s) => s.error)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    analyzeFullBrand()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-8">
      <div className="w-full max-w-xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-6">
          <Search size={32} className="text-violet-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Brand Intelligence</h1>
        <p className="text-gray-400 mb-8">
          Enter your business website to get a complete competitive analysis, social presence audit, online mentions, trending content, and actionable video ideas.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="url"
            value={brandUrl}
            onChange={(e) => setBrandUrl(e.target.value)}
            placeholder="https://your-business.com"
            className="flex-1 px-4 py-3 rounded-xl bg-[#1a1a1a] border border-panel-surface text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 text-sm"
            required
          />
          <button
            type="submit"
            disabled={phase === 'analyzing'}
            className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {phase === 'analyzing' ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Analyze Brand
              </>
            )}
          </button>
        </form>
        {error && (
          <p className="mt-4 text-sm text-red-400">{error}</p>
        )}

        {/* Analysis progress steps */}
        <AnalysisProgress />
      </div>
    </div>
  )
}

function AnalysisProgress() {
  const phase = useBrandIntelStore((s) => s.phase)
  const steps = useBrandIntelStore((s) => s.analysisSteps)

  if (phase !== 'analyzing' || steps.length === 0) return null

  const doneCount = steps.filter((s) => s.status === 'done').length

  return (
    <div className="mt-8 w-full max-w-md mx-auto">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500">Progress</span>
        <span className="text-xs text-gray-500">{doneCount}/{steps.length}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#1a1a1a] mb-4 overflow-hidden">
        <div
          className="h-full rounded-full bg-violet-500 transition-all duration-500"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      {/* Step list */}
      <div className="space-y-1.5">
        {steps.map((step: AnalysisStep) => (
          <div key={step.id} className="flex items-center gap-2.5 text-sm">
            {step.status === 'running' && <Loader2 size={14} className="animate-spin text-violet-400 shrink-0" />}
            {step.status === 'done' && <Check size={14} className="text-green-500 shrink-0" />}
            {step.status === 'failed' && <X size={14} className="text-red-400 shrink-0" />}
            {step.status === 'pending' && <div className="w-3.5 h-3.5 rounded-full border border-[#333] shrink-0" />}
            <span className={
              step.status === 'running' ? 'text-white' :
              step.status === 'done' ? 'text-gray-500' :
              step.status === 'failed' ? 'text-red-400' :
              'text-gray-600'
            }>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Overview Section ──

function OverviewSection() {
  const profile = useBrandIntelStore((s) => s.profile)
  const images = useBrandIntelStore((s) => s.images)

  if (!profile) return <EmptyState text="No brand data yet" />

  return (
    <div>
      <SectionHeader title="Brand Overview" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main profile card */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#1a1a1a] border border-panel-surface">
          <div className="flex items-start gap-4 mb-4">
            {images.find((i) => i.role === 'logo') && (
              <img
                src={images.find((i) => i.role === 'logo')!.base64}
                alt="Logo"
                className="w-14 h-14 rounded-lg object-contain bg-white/5"
              />
            )}
            <div>
              <h3 className="text-lg font-semibold text-white">{profile.businessName}</h3>
              <p className="text-sm text-gray-400">{profile.industry} / {profile.niche}</p>
              {profile.tagline && <p className="text-xs text-violet-400 mt-1">"{profile.tagline}"</p>}
            </div>
          </div>
          <p className="text-sm text-gray-300 mb-4">{profile.description}</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-500">Tone</span>
              <p className="text-gray-300 capitalize">{profile.tone}</p>
            </div>
            <div>
              <span className="text-gray-500">Target Audience</span>
              <p className="text-gray-300">{profile.targetAudience.join(', ')}</p>
            </div>
            <div>
              <span className="text-gray-500">Products</span>
              <p className="text-gray-300">{profile.products.join(', ')}</p>
            </div>
            <div>
              <span className="text-gray-500">Brand Values</span>
              <p className="text-gray-300">{profile.brandValues.join(', ')}</p>
            </div>
          </div>
        </div>

        {/* Colors + Images */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#1a1a1a] border border-panel-surface">
            <h4 className="text-xs text-gray-500 mb-2">Brand Colors</h4>
            <div className="flex gap-2 flex-wrap">
              {profile.primaryColors.map((c, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-md border border-white/10" style={{ backgroundColor: c }} />
                  <span className="text-xs text-gray-400 font-mono">{c}</span>
                </div>
              ))}
            </div>
          </div>
          {images.length > 0 && (
            <div className="p-4 rounded-xl bg-[#1a1a1a] border border-panel-surface">
              <h4 className="text-xs text-gray-500 mb-2">Brand Images</h4>
              <div className="grid grid-cols-3 gap-2">
                {images.slice(0, 6).map((img, i) => (
                  <img
                    key={i}
                    src={img.base64}
                    alt={img.alt || img.role}
                    className="w-full aspect-square rounded-lg object-cover bg-white/5"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Social Presence Section ──

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'text-pink-400',
  tiktok: 'text-cyan-400',
  youtube: 'text-red-400',
  twitter: 'text-sky-400',
  facebook: 'text-blue-400',
  linkedin: 'text-blue-300',
  other: 'text-gray-400',
}

function SocialPresenceSection() {
  const socialPresence = useBrandIntelStore((s) => s.socialPresence)
  const isSocialLoading = useBrandIntelStore((s) => s.isSocialLoading)
  const refreshSocialPresence = useBrandIntelStore((s) => s.refreshSocialPresence)

  if (isSocialLoading) return <LoadingCard text="Discovering social accounts..." />
  if (!socialPresence) return (
    <div>
      <SectionHeader title="Social Presence" onRefresh={refreshSocialPresence} isLoading={isSocialLoading} />
      <EmptyState text="No social presence data" />
    </div>
  )

  return (
    <div>
      <SectionHeader title="Social Presence" onRefresh={refreshSocialPresence} isLoading={isSocialLoading} />
      {socialPresence.assessment && (
        <p className="text-sm text-gray-400 mb-4 p-3 rounded-lg bg-[#1a1a1a] border border-panel-surface">
          {socialPresence.assessment}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {socialPresence.accounts.map((acc: SocialAccount, i: number) => (
          <a
            key={i}
            href={acc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl bg-[#1a1a1a] border border-panel-surface hover:border-panel-border transition-colors group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium capitalize ${PLATFORM_COLORS[acc.platform] || 'text-gray-300'}`}>
                {acc.platform}
              </span>
              <ExternalLink size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
            </div>
            {acc.handle && <p className="text-xs text-gray-400">@{acc.handle}</p>}
            {acc.followerCount != null && (
              <p className="text-lg font-semibold text-white mt-1">
                {acc.followerCount >= 1000000
                  ? `${(acc.followerCount / 1000000).toFixed(1)}M`
                  : acc.followerCount >= 1000
                    ? `${(acc.followerCount / 1000).toFixed(1)}K`
                    : acc.followerCount}
                <span className="text-xs text-gray-500 font-normal ml-1">followers</span>
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              {acc.verified && (
                <span className="flex items-center gap-0.5 text-blue-400">
                  <Check size={10} /> Verified
                </span>
              )}
              {acc.postFrequency && <span>{acc.postFrequency}</span>}
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

// ── Mentions Section ──

const SENTIMENT_ICON = {
  positive: ThumbsUp,
  neutral: Minus,
  negative: ThumbsDown,
}

const SENTIMENT_COLOR = {
  positive: 'text-green-400 bg-green-500/10',
  neutral: 'text-gray-400 bg-gray-500/10',
  negative: 'text-red-400 bg-red-500/10',
}

function MentionsSection() {
  const mentionsSummary = useBrandIntelStore((s) => s.mentionsSummary)
  const isMentionsLoading = useBrandIntelStore((s) => s.isMentionsLoading)
  const refreshMentions = useBrandIntelStore((s) => s.refreshMentions)
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all')

  if (isMentionsLoading) return <LoadingCard text="Scanning online mentions..." />
  if (!mentionsSummary) return (
    <div>
      <SectionHeader title="Online Mentions" onRefresh={refreshMentions} isLoading={isMentionsLoading} />
      <EmptyState text="No mentions data" />
    </div>
  )

  const { sentimentBreakdown } = mentionsSummary
  const total = sentimentBreakdown.positive + sentimentBreakdown.neutral + sentimentBreakdown.negative

  const filtered = sentimentFilter === 'all'
    ? mentionsSummary.mentions
    : mentionsSummary.mentions.filter((m: BrandMention) => m.sentiment === sentimentFilter)

  return (
    <div>
      <SectionHeader title="Online Mentions" onRefresh={refreshMentions} isLoading={isMentionsLoading} />

      {/* Sentiment bar */}
      {total > 0 && (
        <div className="mb-4 p-4 rounded-xl bg-[#1a1a1a] border border-panel-surface">
          <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-3">
            {sentimentBreakdown.positive > 0 && (
              <div className="bg-green-500" style={{ width: `${(sentimentBreakdown.positive / total) * 100}%` }} />
            )}
            {sentimentBreakdown.neutral > 0 && (
              <div className="bg-gray-500" style={{ width: `${(sentimentBreakdown.neutral / total) * 100}%` }} />
            )}
            {sentimentBreakdown.negative > 0 && (
              <div className="bg-red-500" style={{ width: `${(sentimentBreakdown.negative / total) * 100}%` }} />
            )}
          </div>
          <div className="flex gap-4 text-xs">
            <button onClick={() => setSentimentFilter('all')} className={`${sentimentFilter === 'all' ? 'text-white' : 'text-gray-500'}`}>All ({total})</button>
            <button onClick={() => setSentimentFilter('positive')} className={`${sentimentFilter === 'positive' ? 'text-green-400' : 'text-gray-500'}`}>Positive ({sentimentBreakdown.positive})</button>
            <button onClick={() => setSentimentFilter('neutral')} className={`${sentimentFilter === 'neutral' ? 'text-gray-300' : 'text-gray-500'}`}>Neutral ({sentimentBreakdown.neutral})</button>
            <button onClick={() => setSentimentFilter('negative')} className={`${sentimentFilter === 'negative' ? 'text-red-400' : 'text-gray-500'}`}>Negative ({sentimentBreakdown.negative})</button>
          </div>
          {mentionsSummary.overallSentiment && (
            <p className="text-xs text-gray-400 mt-3">{mentionsSummary.overallSentiment}</p>
          )}
        </div>
      )}

      {/* Mention cards */}
      <div className="space-y-2">
        {filtered.map((m: BrandMention) => {
          const Icon = SENTIMENT_ICON[m.sentiment]
          return (
            <div key={m.id} className="p-3 rounded-lg bg-[#1a1a1a] border border-panel-surface">
              <div className="flex items-start gap-3">
                <div className={`p-1.5 rounded-lg ${SENTIMENT_COLOR[m.sentiment]}`}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500 capitalize">{m.platform}</span>
                    <span className="text-xs text-gray-600">{m.source}</span>
                    {m.date && <span className="text-xs text-gray-600">{m.date}</span>}
                  </div>
                  {m.title && <p className="text-sm text-white mb-0.5">{m.title}</p>}
                  <p className="text-xs text-gray-400">{m.snippet}</p>
                </div>
                {m.url && (
                  <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-400">
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Competitors Section ──

function CompetitorsSection() {
  const competitorProfiles = useBrandIntelStore((s) => s.competitorProfiles)
  const isCompetitorsLoading = useBrandIntelStore((s) => s.isCompetitorsLoading)
  const refreshCompetitors = useBrandIntelStore((s) => s.refreshCompetitors)
  const addCompetitorManually = useBrandIntelStore((s) => s.addCompetitorManually)
  const removeCompetitor = useBrandIntelStore((s) => s.removeCompetitor)
  const [addUrl, setAddUrl] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (addUrl.trim()) {
      addCompetitorManually(addUrl.trim())
      setAddUrl('')
    }
  }

  return (
    <div>
      <SectionHeader title="Competitors" onRefresh={refreshCompetitors} isLoading={isCompetitorsLoading} />

      {/* Add manually */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          type="url"
          value={addUrl}
          onChange={(e) => setAddUrl(e.target.value)}
          placeholder="Add competitor URL..."
          className="flex-1 px-3 py-2 rounded-lg bg-[#1a1a1a] border border-panel-surface text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50"
        />
        <button
          type="submit"
          disabled={isCompetitorsLoading || !addUrl.trim()}
          className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          <Plus size={14} />
          Add
        </button>
      </form>

      {isCompetitorsLoading && competitorProfiles.length === 0 && (
        <LoadingCard text="Discovering and analyzing competitors..." />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {competitorProfiles.map((c: CompetitorProfile) => (
          <div key={c.id} className="p-4 rounded-xl bg-[#1a1a1a] border border-panel-surface group">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="text-sm font-medium text-white">{c.businessName}</h4>
                <p className="text-xs text-gray-500">{c.industry} / {c.niche}</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 capitalize">{c.source}</span>
                <button
                  onClick={() => removeCompetitor(c.id)}
                  className="p-1 rounded text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-2 line-clamp-2">{c.description}</p>
            <div className="flex flex-wrap gap-1">
              {c.products.slice(0, 4).map((p, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400">{p}</span>
              ))}
            </div>
            {c.primaryColors.length > 0 && (
              <div className="flex gap-1 mt-2">
                {c.primaryColors.slice(0, 4).map((clr, i) => (
                  <div key={i} className="w-4 h-4 rounded border border-white/10" style={{ backgroundColor: clr }} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Competitive Analysis Section ──

const INSIGHT_STYLES = {
  strength: { bg: 'bg-green-500/5', border: 'border-green-500/20', icon: Star, iconColor: 'text-green-400' },
  weakness: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', icon: AlertTriangle, iconColor: 'text-amber-400' },
  opportunity: { bg: 'bg-violet-500/5', border: 'border-violet-500/20', icon: Target, iconColor: 'text-violet-400' },
  gap: { bg: 'bg-blue-500/5', border: 'border-blue-500/20', icon: Lightbulb, iconColor: 'text-blue-400' },
}

function InsightCard({ insight }: { insight: CompetitiveInsight }) {
  const style = INSIGHT_STYLES[insight.category] || INSIGHT_STYLES.opportunity
  const Icon = style.icon

  return (
    <div className={`p-3 rounded-lg ${style.bg} border ${style.border}`}>
      <div className="flex items-start gap-2">
        <Icon size={14} className={style.iconColor + ' mt-0.5 shrink-0'} />
        <div>
          <h5 className="text-sm text-white font-medium">{insight.title}</h5>
          <p className="text-xs text-gray-400 mt-1">{insight.description}</p>
          {insight.recommendation && (
            <p className="text-xs text-gray-300 mt-2 italic">{insight.recommendation}</p>
          )}
          {insight.competitorNames.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {insight.competitorNames.map((name, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500">{name}</span>
              ))}
            </div>
          )}
        </div>
        <span className="text-xs text-gray-600 shrink-0 ml-auto">{insight.impactScore}/10</span>
      </div>
    </div>
  )
}

function CompetitiveAnalysisSection() {
  const analysis = useBrandIntelStore((s) => s.competitiveAnalysis)
  const isAnalysisLoading = useBrandIntelStore((s) => s.isAnalysisLoading)
  const refreshAnalysis = useBrandIntelStore((s) => s.refreshAnalysis)

  if (isAnalysisLoading) return <LoadingCard text="Running competitive analysis..." />
  if (!analysis) return (
    <div>
      <SectionHeader title="Competitive Analysis" onRefresh={refreshAnalysis} isLoading={isAnalysisLoading} />
      <EmptyState text="No competitive analysis yet" />
    </div>
  )

  return (
    <div>
      <SectionHeader title="Competitive Analysis" onRefresh={refreshAnalysis} isLoading={isAnalysisLoading} />

      {analysis.summary && (
        <p className="text-sm text-gray-400 mb-6 p-3 rounded-lg bg-[#1a1a1a] border border-panel-surface">
          {analysis.summary}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Our Strengths */}
        <div>
          <h4 className="text-xs text-green-400 font-medium mb-2 uppercase tracking-wide">Our Strengths</h4>
          <div className="space-y-2">
            {analysis.ourStrengths.map((insight, i) => <InsightCard key={i} insight={insight} />)}
          </div>
        </div>

        {/* Learn From Them */}
        <div>
          <h4 className="text-xs text-blue-400 font-medium mb-2 uppercase tracking-wide">Learn From Competitors</h4>
          <div className="space-y-2">
            {analysis.competitorStrengths.map((insight, i) => <InsightCard key={i} insight={insight} />)}
          </div>
        </div>

        {/* Their Weaknesses */}
        <div>
          <h4 className="text-xs text-amber-400 font-medium mb-2 uppercase tracking-wide">Competitor Gaps</h4>
          <div className="space-y-2">
            {analysis.competitorWeaknesses.map((insight, i) => <InsightCard key={i} insight={insight} />)}
          </div>
        </div>

        {/* Content Opportunities */}
        <div>
          <h4 className="text-xs text-violet-400 font-medium mb-2 uppercase tracking-wide">Content Opportunities</h4>
          <div className="space-y-2">
            {analysis.contentOpportunities.map((insight, i) => <InsightCard key={i} insight={insight} />)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Trends Section ──

function TrendsSection() {
  const trends = useBrandIntelStore((s) => s.trends)
  const isTrendsLoading = useBrandIntelStore((s) => s.isTrendsLoading)
  const refreshTrends = useBrandIntelStore((s) => s.refreshTrends)

  if (isTrendsLoading) return <LoadingCard text="Discovering trending content..." />
  if (!trends) return (
    <div>
      <SectionHeader title="Trending Content" onRefresh={refreshTrends} isLoading={isTrendsLoading} />
      <EmptyState text="No trends data" />
    </div>
  )

  return (
    <div>
      <SectionHeader title="Trending Content" onRefresh={refreshTrends} isLoading={isTrendsLoading} />

      {trends.summary && (
        <p className="text-sm text-gray-400 mb-4 p-3 rounded-lg bg-[#1a1a1a] border border-panel-surface">
          {trends.summary}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {trends.items.slice(0, 15).map((item, i) => (
          <div key={i} className="rounded-xl bg-[#1a1a1a] border border-panel-surface overflow-hidden group">
            {item.thumbnailUrl && (
              <div className="aspect-video bg-black/50 relative">
                <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Play size={24} className="text-white" />
                  </a>
                )}
              </div>
            )}
            <div className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 capitalize">
                  {item.source.platform === 'gemini-search' ? 'trending' : item.source.platform}
                </span>
                {item.category && (
                  <span className="text-[10px] text-gray-600 capitalize">{item.category}</span>
                )}
                {item.viewCount != null && item.viewCount > 0 && (
                  <span className="text-[10px] text-gray-600">
                    {item.viewCount >= 1000000
                      ? `${(item.viewCount / 1000000).toFixed(1)}M views`
                      : item.viewCount >= 1000
                        ? `${(item.viewCount / 1000).toFixed(0)}K views`
                        : `${item.viewCount} views`}
                  </span>
                )}
                {item.url && !item.thumbnailUrl && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="ml-auto text-gray-600 hover:text-gray-400">
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
              <h4 className="text-sm text-white line-clamp-2">{item.title}</h4>
              {item.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-3">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Evidence Panel ──

const PERFORMANCE_BADGE = {
  overperforming: { label: 'Overperforming', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  average: { label: 'Average', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' },
  underperforming: { label: 'Underperforming', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  unknown: { label: 'Unknown', color: 'text-gray-500 bg-gray-500/5 border-gray-500/10' },
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function IdeaEvidencePanel({ idea }: { idea: VideoIdea }) {
  const viralityEvidence = useBrandIntelStore((s) => s.viralityEvidence)
  const breakdowns = viralityEvidence?.breakdowns || []

  return (
    <div className="mt-3 space-y-3">
      {/* Reasoning chain */}
      {idea.reasoningChain && (
        <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/15">
          <h5 className="text-[10px] uppercase tracking-wide text-violet-400 mb-1.5 font-medium">Reasoning Chain</h5>
          <p className="text-xs text-gray-300 leading-relaxed">{idea.reasoningChain}</p>
        </div>
      )}

      {/* Engagement rationale */}
      {idea.engagementRationale && (
        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/15">
          <h5 className="text-[10px] uppercase tracking-wide text-blue-400 mb-1.5 font-medium">Engagement Rationale</h5>
          <p className="text-xs text-gray-300 leading-relaxed">{idea.engagementRationale}</p>
        </div>
      )}

      {/* Source video cards */}
      {idea.sourceEvidence && idea.sourceEvidence.length > 0 && (
        <div>
          <h5 className="text-[10px] uppercase tracking-wide text-gray-500 mb-2 font-medium">Source Videos</h5>
          <div className="space-y-2">
            {idea.sourceEvidence.map((src: IdeaSourceEvidence, i: number) => {
              const breakdown = breakdowns.find(b => b.trendItemIndex === src.breakdownIndex)
              const perf = breakdown?.performanceVsBaseline || 'unknown'
              const badge = PERFORMANCE_BADGE[perf]

              return (
                <div key={i} className="p-3 rounded-lg bg-[#151515] border border-[#252525]">
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    {src.sourceThumbnail && (
                      <div className="shrink-0 w-20 h-14 rounded-md overflow-hidden bg-black/50">
                        <img src={src.sourceThumbnail} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Platform + Performance badge */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 capitalize">
                          {src.sourcePlatform}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Title */}
                      <h6 className="text-xs text-white font-medium line-clamp-1">
                        {src.sourceUrl ? (
                          <a href={src.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-violet-300 transition-colors">
                            {src.sourceTitle}
                          </a>
                        ) : src.sourceTitle}
                      </h6>

                      {/* Metrics from breakdown */}
                      {breakdown && (
                        <div className="flex gap-3 mt-1 text-[10px] text-gray-500">
                          {breakdown.viewCount > 0 && <span>{formatCount(breakdown.viewCount)} views</span>}
                          {breakdown.likeCount > 0 && <span>{formatCount(breakdown.likeCount)} likes</span>}
                          {breakdown.authorFollowerCount > 0 && <span>{formatCount(breakdown.authorFollowerCount)} followers</span>}
                          {breakdown.viewsToFollowerRatio > 0 && (
                            <span className={breakdown.viewsToFollowerRatio > 2 ? 'text-green-500' : breakdown.viewsToFollowerRatio < 0.5 ? 'text-amber-500' : ''}>
                              {breakdown.viewsToFollowerRatio.toFixed(2)}x views/follower
                            </span>
                          )}
                        </div>
                      )}

                      {/* Why viral */}
                      {breakdown?.whyViral && (
                        <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">{breakdown.whyViral}</p>
                      )}

                      {/* Connection reasoning */}
                      <p className="text-[10px] text-violet-400/80 mt-1.5 italic">
                        Borrowed: {src.aspectBorrowed} — {src.connectionReasoning}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Ideas Section ──

function IdeasSection() {
  const ideas = useBrandIntelStore((s) => s.ideas)
  const isIdeasLoading = useBrandIntelStore((s) => s.isIdeasLoading)
  const isViralityLoading = useBrandIntelStore((s) => s.isViralityLoading)
  const refreshIdeas = useBrandIntelStore((s) => s.refreshIdeas)
  const selectIdea = useBrandIntelStore((s) => s.selectIdea)
  const getSelectedIdeaPrompt = useBrandIntelStore((s) => s.getSelectedIdeaPrompt)
  const navigate = useNavigate()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleUseIdea = (idea: VideoIdea) => {
    selectIdea(idea.id)
    const prompt = getSelectedIdeaPrompt()
    if (prompt) {
      navigate('/editor', { state: { clipPrompt: prompt } })
    }
  }

  if (isViralityLoading) return <LoadingCard text="Analyzing why trending videos went viral..." />
  if (isIdeasLoading) return <LoadingCard text="Generating evidence-based video ideas..." />
  if (ideas.length === 0) return (
    <div>
      <SectionHeader title="Video Ideas" onRefresh={refreshIdeas} isLoading={isIdeasLoading} />
      <EmptyState text="No video ideas yet" />
    </div>
  )

  const engagementColors = {
    low: 'text-gray-400 bg-gray-500/10',
    medium: 'text-blue-400 bg-blue-500/10',
    high: 'text-green-400 bg-green-500/10',
    viral: 'text-violet-400 bg-violet-500/10',
  }

  return (
    <div>
      <SectionHeader title="Video Ideas" onRefresh={refreshIdeas} isLoading={isIdeasLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {ideas.map((idea: VideoIdea) => {
          const sourceCount = idea.sourceEvidence?.length || 0
          const isExpanded = expandedIds.has(idea.id)
          const hasEvidence = sourceCount > 0 || idea.reasoningChain || idea.engagementRationale

          return (
            <div key={idea.id} className="p-4 rounded-xl bg-[#1a1a1a] border border-panel-surface">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-medium text-white flex-1">{idea.title}</h4>
                <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${engagementColors[idea.estimatedEngagement]}`}>
                  {idea.estimatedEngagement}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-2">{idea.concept}</p>
              <p className="text-xs text-violet-400/70 mb-3">{idea.trendAlignment}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2 text-[10px] text-gray-500">
                  <span>{idea.suggestedDuration}s</span>
                  <span>{idea.suggestedAspectRatio}</span>
                  <span className="capitalize">{idea.suggestedTemplateStyle}</span>
                </div>
                <button
                  onClick={() => handleUseIdea(idea)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
                >
                  <ChevronRight size={12} />
                  Use in Orchestrator
                </button>
              </div>
              {idea.tags.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {idea.tags.map((tag, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500">#{tag}</span>
                  ))}
                </div>
              )}

              {/* Evidence toggle */}
              {hasEvidence && (
                <button
                  onClick={() => toggleExpanded(idea.id)}
                  className="flex items-center gap-1.5 mt-3 text-[11px] text-gray-500 hover:text-violet-400 transition-colors"
                >
                  <Eye size={12} />
                  {isExpanded ? 'Hide' : 'Show'} Evidence{sourceCount > 0 ? ` (${sourceCount} source${sourceCount > 1 ? 's' : ''})` : ''}
                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
              )}

              {/* Expandable evidence panel */}
              {isExpanded && <IdeaEvidencePanel idea={idea} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Sidebar ──

function Sidebar() {
  const activeSection = useBrandIntelStore((s) => s.activeSection)
  const setActiveSection = useBrandIntelStore((s) => s.setActiveSection)
  const profile = useBrandIntelStore((s) => s.profile)
  const socialPresence = useBrandIntelStore((s) => s.socialPresence)
  const isSocialLoading = useBrandIntelStore((s) => s.isSocialLoading)
  const mentionsSummary = useBrandIntelStore((s) => s.mentionsSummary)
  const isMentionsLoading = useBrandIntelStore((s) => s.isMentionsLoading)
  const competitorProfiles = useBrandIntelStore((s) => s.competitorProfiles)
  const isCompetitorsLoading = useBrandIntelStore((s) => s.isCompetitorsLoading)
  const competitiveAnalysis = useBrandIntelStore((s) => s.competitiveAnalysis)
  const isAnalysisLoading = useBrandIntelStore((s) => s.isAnalysisLoading)
  const trends = useBrandIntelStore((s) => s.trends)
  const isTrendsLoading = useBrandIntelStore((s) => s.isTrendsLoading)
  const ideas = useBrandIntelStore((s) => s.ideas)
  const isIdeasLoading = useBrandIntelStore((s) => s.isIdeasLoading)
  const isViralityLoading = useBrandIntelStore((s) => s.isViralityLoading)

  const sectionStatus: Record<BrandIntelSection, 'idle' | 'loading' | 'done'> = {
    overview: profile ? 'done' : 'idle',
    social: isSocialLoading ? 'loading' : socialPresence ? 'done' : 'idle',
    mentions: isMentionsLoading ? 'loading' : mentionsSummary ? 'done' : 'idle',
    competitors: isCompetitorsLoading ? 'loading' : competitorProfiles.length > 0 ? 'done' : 'idle',
    analysis: isAnalysisLoading ? 'loading' : competitiveAnalysis ? 'done' : 'idle',
    trends: isTrendsLoading ? 'loading' : trends ? 'done' : 'idle',
    ideas: (isIdeasLoading || isViralityLoading) ? 'loading' : ideas.length > 0 ? 'done' : 'idle',
  }

  return (
    <nav className="w-48 shrink-0 border-r border-panel-surface p-3 space-y-0.5">
      {SECTIONS.map(({ id, label, icon: Icon }) => {
        const status = sectionStatus[id]
        const isActive = activeSection === id
        return (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-white/5 text-white'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
            }`}
          >
            <Icon size={16} />
            <span className="flex-1 text-left">{label}</span>
            {status === 'loading' && <Loader2 size={12} className="animate-spin text-violet-400" />}
            {status === 'done' && <Check size={12} className="text-green-500" />}
          </button>
        )
      })}
    </nav>
  )
}

// ── Main Page ──

export default function BrandIntelPage() {
  const profile = useBrandIntelStore((s) => s.profile)
  const phase = useBrandIntelStore((s) => s.phase)
  const activeSection = useBrandIntelStore((s) => s.activeSection)
  const analyzeFullBrand = useBrandIntelStore((s) => s.analyzeFullBrand)
  const reset = useBrandIntelStore((s) => s.reset)

  const hasData = profile !== null

  const renderSection = () => {
    switch (activeSection) {
      case 'overview': return <OverviewSection />
      case 'social': return <SocialPresenceSection />
      case 'mentions': return <MentionsSection />
      case 'competitors': return <CompetitorsSection />
      case 'analysis': return <CompetitiveAnalysisSection />
      case 'trends': return <TrendsSection />
      case 'ideas': return <IdeasSection />
      default: return <OverviewSection />
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-panel-surface bg-[#141414] shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            Dashboard
          </Link>
          <div className="w-px h-5 bg-panel-surface" />
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-violet-400" />
            <span className="text-sm font-medium">Brand Intelligence</span>
            {profile && (
              <span className="text-xs text-gray-500 ml-1">
                - {profile.businessName}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasData && (
            <>
              <button
                onClick={() => analyzeFullBrand()}
                disabled={phase === 'analyzing'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={14} className={phase === 'analyzing' ? 'animate-spin' : ''} />
                Refresh All
              </button>
              <button
                onClick={reset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X size={14} />
                Reset
              </button>
            </>
          )}
        </div>
      </header>

      {/* Body */}
      {!hasData ? (
        <URLInputSection />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-6">
            {renderSection()}
          </main>
        </div>
      )}
    </div>
  )
}
