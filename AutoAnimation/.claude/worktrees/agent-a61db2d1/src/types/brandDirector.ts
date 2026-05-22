// ── Brand Director: URL-to-Video Idea Pipeline Types ──

/** Result of analyzing a business website URL */
export interface BrandProfile {
  url: string
  businessName: string
  industry: string
  niche: string
  targetAudience: string[]
  products: string[]
  brandValues: string[]
  /** Communication style: "professional", "casual", "playful", "authoritative", etc. */
  tone: string
  /** Hex colors extracted from website */
  primaryColors: string[]
  tagline?: string
  /** 2-3 sentence brand summary */
  description: string
}

/** Image downloaded from the analyzed website */
export interface BrandImage {
  /** Original URL from website */
  url: string
  /** Downloaded image as base64 data URL */
  base64: string
  mimeType: string
  role: 'logo' | 'hero' | 'product' | 'other'
  alt?: string
}

// ── Trend Discovery ──

export interface TrendSource {
  platform: 'youtube' | 'tiktok' | 'instagram' | 'gemini-search'
  /** For RapidAPI: which specific API host was used */
  provider?: string
}

export interface TrendItem {
  source: TrendSource
  title: string
  description?: string
  url?: string
  viewCount?: number
  likeCount?: number
  engagementRate?: number
  publishedAt?: string
  thumbnailUrl?: string
  hashtags?: string[]
  category?: string
  /** Author info (from viral scraper NormalizedVideo) */
  authorUsername?: string
  authorDisplayName?: string
  authorFollowerCount?: number
  commentCount?: number
  shareCount?: number
  /** Video duration in seconds */
  duration?: number
}

export interface TrendData {
  /** Niche keywords used for search */
  keywords: string[]
  items: TrendItem[]
  /** ISO timestamp */
  fetchedAt: string
  /** Gemini-generated trend summary */
  summary?: string
}

// ── Virality Analysis ──

export interface VideoViralityBreakdown {
  trendItemIndex: number
  title: string
  url?: string
  thumbnailUrl?: string
  platform: string
  viewCount: number
  likeCount: number
  commentCount: number
  engagementRate: number
  authorName: string
  authorFollowerCount: number
  viewsToFollowerRatio: number
  performanceVsBaseline: 'overperforming' | 'average' | 'underperforming' | 'unknown'
  whyViral: string
  keyFactors: string[]
  timingContext: string | null
  ageInDays: number
}

export interface ViralityEvidence {
  breakdowns: VideoViralityBreakdown[]
  commonPatterns: string[]
  nicheAssessment: string
  analyzedAt: string
}

export interface IdeaSourceEvidence {
  breakdownIndex: number
  sourceTitle: string
  sourceUrl?: string
  sourceThumbnail?: string
  sourcePlatform: string
  connectionReasoning: string
  aspectBorrowed: string
}

// ── Video Ideas ──

export interface VideoIdea {
  id: string
  title: string
  /** 2-3 sentence concept description */
  concept: string
  /** Why this idea aligns with current trends */
  trendAlignment: string
  /** e.g. "explainer with map", "product showcase", "dialogue debate" */
  suggestedTemplateStyle: string
  /** Specific HTML template IDs from the library */
  suggestedTemplateIds?: string[]
  estimatedEngagement: 'low' | 'medium' | 'high' | 'viral'
  suggestedDuration: number
  suggestedAspectRatio: '16:9' | '9:16' | '1:1'
  tags: string[]
  /** Evidence linking this idea to specific source videos */
  sourceEvidence?: IdeaSourceEvidence[]
  /** AI's reasoning chain for generating this idea */
  reasoningChain?: string
  /** Why the AI rated engagement at its chosen level */
  engagementRationale?: string
}

// ── Competitor Analysis ──

export interface CompetitorProfile {
  id: string
  url: string
  businessName: string
  industry: string
  niche: string
  targetAudience: string[]
  products: string[]
  tone: string
  primaryColors: string[]
  tagline?: string
  description: string
  estimatedSize?: string
  source: 'auto-discovered' | 'manual'
  analyzedAt: string
}

export interface CompetitiveInsight {
  category: 'strength' | 'weakness' | 'opportunity' | 'gap'
  title: string
  description: string
  competitorNames: string[]
  recommendation?: string
  impactScore: number
}

export interface CompetitiveAnalysis {
  ourStrengths: CompetitiveInsight[]
  competitorStrengths: CompetitiveInsight[]
  competitorWeaknesses: CompetitiveInsight[]
  contentOpportunities: CompetitiveInsight[]
  summary: string
  analyzedAt: string
}

// ── Social & Mentions ──

export interface BrandMention {
  id: string
  platform: 'reddit' | 'twitter' | 'review-site' | 'forum' | 'news' | 'other'
  source: string
  title?: string
  snippet: string
  url?: string
  sentiment: 'positive' | 'neutral' | 'negative'
  date?: string
  relevanceScore: number
}

export interface MentionsSummary {
  mentions: BrandMention[]
  sentimentBreakdown: { positive: number; neutral: number; negative: number }
  overallSentiment: string
  fetchedAt: string
}

export interface SocialAccount {
  platform: 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'facebook' | 'linkedin' | 'other'
  url: string
  handle?: string
  followerCount?: number
  verified?: boolean
  postFrequency?: string
}

export interface SocialPresence {
  accounts: SocialAccount[]
  assessment: string
  discoveredAt: string
}

// ── Brand Intel Page ──

export type BrandIntelSection =
  | 'overview'
  | 'social'
  | 'mentions'
  | 'competitors'
  | 'analysis'
  | 'trends'
  | 'ideas'

export type BrandIntelPhase =
  | 'idle'
  | 'analyzing'
  | 'ready'
  | 'error'

// ── Phase tracking ──

export type BrandDirectorPhase =
  | 'idle'
  | 'analyzing-url'
  | 'fetching-trends'
  | 'generating-ideas'
  | 'ready'
  | 'error'

// ── Server request/response shapes ──

export interface AnalyzeURLRequest {
  url: string
}

export interface AnalyzeURLResponse {
  profile: BrandProfile
  images: BrandImage[]
}

export interface FetchTrendsRequest {
  keywords: string[]
  industry: string
  niche: string
  sources?: ('youtube' | 'rapidapi' | 'gemini')[]
}

export interface FetchTrendsResponse {
  trends: TrendData
}
