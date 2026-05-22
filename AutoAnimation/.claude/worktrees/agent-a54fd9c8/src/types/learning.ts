import type { SocialPlatform } from './social'

// ── Feature Snapshot ──

export interface ProjectFeatureSnapshot {
  // Canvas
  aspectRatio: string
  fps: number
  durationSeconds: number
  canvasWidth: number
  canvasHeight: number

  // Characters
  characterCount: number
  emotionDistribution: Record<string, number>
  dialogueLineCount: number
  totalScriptWordCount: number

  // Voice
  voiceIds: string[]
  voiceCount: number
  avgSpeechRateWpm: number

  // Animation
  animationCount: number
  hasLottieBackground: boolean
  hasSVGAnimations: boolean
  hasHTMLTemplates: boolean
  htmlTemplateIds: string[]

  // Captions
  captionStyle: string | null
  captionPosition: string | null

  // Text overlays
  textOverlayCount: number
  hasTitle: boolean
  hasCTA: boolean

  // Script analysis (computed server-side or via Gemini)
  scriptSentiment?: string
  scriptTone?: string
  dominantTopics?: string[]

  // Publishing context (filled at publish time)
  platform: SocialPlatform
  publishedAt: string
  postingHour: number
  postingDayOfWeek: number

  // Normalized numeric vector for scoring model
  featureVector: Record<string, number>
}

// ── Performance Records ──

export interface PerformanceRecord {
  id: string
  snapshotId: string
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  engagementRate: number
  avgWatchTimeSec: number
  reach: number
  impressions: number
  fullVideoViewsPercent: number
  performanceScore: number
  refreshCount: number
  lastRefreshedAt: string | null
}

// ── Learned Patterns ──

export type PatternType = 'feature_correlation' | 'best_combo' | 'trend' | 'gemini_insight' | 'platform_default'

export interface LearnedPattern {
  id: string
  patternType: PatternType
  platform: SocialPlatform | null
  confidence: number
  sampleSize: number
  title: string
  description: string | null
  featureKey: string | null
  featureValue: string | null
  impactScore: number
  data: Record<string, unknown>
  isActive: boolean
  expiresAt: string | null
  createdAt: string
}

// ── Recommendations ──

export type RecommendationCategory =
  | 'duration'
  | 'aspect_ratio'
  | 'caption_style'
  | 'posting_time'
  | 'emotion'
  | 'voice'
  | 'animation'
  | 'general'

export type RecommendationPriority = 'high' | 'medium' | 'low'
export type RecommendationStatus = 'pending' | 'applied' | 'dismissed' | 'expired'

export type RecommendationActionType =
  | 'set_aspect_ratio'
  | 'set_duration'
  | 'set_caption_style'
  | 'add_cta'
  | 'change_posting_time'
  | 'add_emotion'

export interface Recommendation {
  id: string
  source: 'local_model' | 'gemini'
  category: RecommendationCategory
  title: string
  description: string
  priority: RecommendationPriority
  confidence: number
  actionType: RecommendationActionType | null
  actionPayload: Record<string, unknown>
  status: RecommendationStatus
  appliedAt: string | null
  platform: SocialPlatform | null
  createdAt: string
}

// ── Scoring ──

export interface ScoringFactor {
  featureKey: string
  label: string
  currentValue: number
  optimalValue: number
  impact: 'positive' | 'negative' | 'neutral'
  description: string
}

export interface ScoreResult {
  score: number
  confidence: number
  factors: ScoringFactor[]
}

export interface FeatureCorrelation {
  featureKey: string
  correlation: number
  sampleSize: number
  optimalRange: { min: number; max: number }
}

// ── Gemini Analysis ──

export interface GeminiInsight {
  title: string
  description: string
  confidence: number
  category: RecommendationCategory
  impact: 'high' | 'medium' | 'low'
}

export interface GeminiTrend {
  title: string
  description: string
  direction: 'improving' | 'declining' | 'stable'
}

export interface GeminiAnalysisResult {
  insights: GeminiInsight[]
  recommendations: Recommendation[]
  trends: GeminiTrend[]
}

// ── Learning Context for Orchestrator ──

export interface LearningContext {
  recommendedAspectRatio?: string
  recommendedDuration?: number
  recommendedCaptionStyle?: string
  performanceInsights?: string[]
}
