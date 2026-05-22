/**
 * Local Scoring Model: lightweight statistical correlation system.
 * Computes Pearson correlations between project features and engagement performance.
 * No external ML libraries needed — pure math on arrays.
 */

import { getSupabaseAdmin } from '../middleware/supabaseAuth'

// ── Types ──

export interface FeatureCorrelation {
  featureKey: string
  correlation: number      // -1 to 1
  sampleSize: number
  optimalRange: { min: number; max: number }
}

export interface ScoringFactor {
  featureKey: string
  label: string
  currentValue: number
  optimalValue: number
  impact: 'positive' | 'negative' | 'neutral'
  description: string
}

export interface ScoreResult {
  score: number          // 0-100
  confidence: number     // 0-1
  factors: ScoringFactor[]
}

export interface LocalRecommendation {
  category: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  confidence: number
  actionType: string | null
  actionPayload: Record<string, unknown>
}

// ── Feature key display labels ──

const FEATURE_LABELS: Record<string, string> = {
  aspect_ratio: 'Aspect Ratio',
  duration: 'Duration',
  fps: 'Frame Rate',
  character_count: 'Character Count',
  dialogue_lines: 'Dialogue Lines',
  word_count: 'Word Count',
  voice_count: 'Voice Count',
  speech_rate: 'Speech Rate',
  animation_count: 'Animation Count',
  has_lottie_bg: 'Lottie Background',
  has_svg: 'SVG Animations',
  has_html_templates: 'HTML Templates',
  text_overlay_count: 'Text Overlays',
  has_title: 'Title Card',
  has_cta: 'Call to Action',
  has_captions: 'Captions',
  posting_hour: 'Posting Hour',
  posting_day: 'Posting Day',
  emotion_diversity: 'Emotion Diversity',
}

// ── Platform Defaults (cold start) ──

const PLATFORM_DEFAULTS: Record<string, LocalRecommendation[]> = {
  tiktok: [
    {
      category: 'duration',
      title: 'Keep videos 15-30 seconds',
      description: 'Short-form TikTok videos between 15-30 seconds tend to get the highest completion rates and engagement.',
      priority: 'high',
      confidence: 0.7,
      actionType: 'set_duration',
      actionPayload: { durationSeconds: 25 },
    },
    {
      category: 'aspect_ratio',
      title: 'Use 9:16 vertical format',
      description: 'Vertical video (9:16) is native to TikTok and maximizes screen real estate.',
      priority: 'high',
      confidence: 0.9,
      actionType: 'set_aspect_ratio',
      actionPayload: { aspectRatio: '9:16' },
    },
    {
      category: 'caption_style',
      title: 'Always add captions',
      description: 'Most TikTok users browse with sound off. Captions dramatically improve retention and accessibility.',
      priority: 'high',
      confidence: 0.85,
      actionType: 'set_caption_style',
      actionPayload: { captionStyle: 'word-by-word' },
    },
    {
      category: 'posting_time',
      title: 'Post between 7-9 PM',
      description: 'Evening hours (7-9 PM) typically see the highest engagement on TikTok.',
      priority: 'medium',
      confidence: 0.6,
      actionType: 'change_posting_time',
      actionPayload: { suggestedHour: 20 },
    },
  ],
  instagram: [
    {
      category: 'duration',
      title: 'Keep Reels 15-30 seconds',
      description: 'Instagram Reels between 15-30 seconds get the best reach and engagement.',
      priority: 'high',
      confidence: 0.7,
      actionType: 'set_duration',
      actionPayload: { durationSeconds: 20 },
    },
    {
      category: 'aspect_ratio',
      title: 'Use 9:16 vertical format',
      description: 'Vertical 9:16 Reels take up the full screen and get prioritized by the algorithm.',
      priority: 'high',
      confidence: 0.9,
      actionType: 'set_aspect_ratio',
      actionPayload: { aspectRatio: '9:16' },
    },
    {
      category: 'caption_style',
      title: 'Add captions for accessibility',
      description: 'Captioned Reels see significantly higher watch time and shares.',
      priority: 'high',
      confidence: 0.8,
      actionType: 'set_caption_style',
      actionPayload: { captionStyle: 'word-by-word' },
    },
    {
      category: 'general',
      title: 'Add a call-to-action',
      description: 'Reels with a clear CTA (follow, comment, share) typically get 2x more engagement.',
      priority: 'medium',
      confidence: 0.65,
      actionType: 'add_cta',
      actionPayload: { content: 'Follow for more!' },
    },
  ],
  facebook: [
    {
      category: 'duration',
      title: 'Aim for 30-60 seconds',
      description: 'Facebook videos between 30-60 seconds hit the sweet spot for engagement.',
      priority: 'high',
      confidence: 0.65,
      actionType: 'set_duration',
      actionPayload: { durationSeconds: 45 },
    },
    {
      category: 'aspect_ratio',
      title: 'Use 1:1 or 16:9 format',
      description: 'Square (1:1) and landscape (16:9) perform best in the Facebook feed.',
      priority: 'medium',
      confidence: 0.6,
      actionType: null,
      actionPayload: {},
    },
    {
      category: 'caption_style',
      title: 'Add captions',
      description: 'Facebook autoplay is muted by default. Captions keep viewers watching.',
      priority: 'high',
      confidence: 0.8,
      actionType: 'set_caption_style',
      actionPayload: { captionStyle: 'sentence' },
    },
  ],
  x: [
    {
      category: 'duration',
      title: 'Keep videos 15-45 seconds',
      description: 'X (Twitter) users prefer short, punchy video content.',
      priority: 'high',
      confidence: 0.65,
      actionType: 'set_duration',
      actionPayload: { durationSeconds: 30 },
    },
    {
      category: 'aspect_ratio',
      title: 'Use 16:9 landscape',
      description: 'Landscape format (16:9) displays best in the X timeline.',
      priority: 'medium',
      confidence: 0.6,
      actionType: 'set_aspect_ratio',
      actionPayload: { aspectRatio: '16:9' },
    },
    {
      category: 'general',
      title: 'Add a title card',
      description: 'Videos with title cards at the start get more clicks in the timeline preview.',
      priority: 'medium',
      confidence: 0.55,
      actionType: null,
      actionPayload: {},
    },
  ],
}

// ── Math helpers ──

function mean(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length
  if (n < 3) return 0

  const mx = mean(x)
  const my = mean(y)

  let num = 0
  let denX = 0
  let denY = 0

  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx
    const dy = y[i] - my
    num += dx * dy
    denX += dx * dx
    denY += dy * dy
  }

  const den = Math.sqrt(denX * denY)
  if (den === 0) return 0
  return num / den
}

// ── Core Functions ──

/**
 * Compute Pearson correlations between each feature and performance_score.
 */
export async function computeCorrelations(
  userId: string,
  platform?: string
): Promise<FeatureCorrelation[]> {
  const supabase = getSupabaseAdmin()

  // Fetch all snapshots with their performance records
  let query = supabase
    .from('project_snapshots')
    .select('feature_vector, performance_records!inner(performance_score)')
    .eq('user_id', userId)

  if (platform) {
    query = query.eq('platform', platform)
  }

  const { data, error } = await query

  if (error || !data || data.length < 3) {
    return []
  }

  // Extract feature vectors and scores
  const featureKeys = Object.keys(data[0].feature_vector || {})
  const scores = data.map((row: any) => {
    const records = row.performance_records
    return Array.isArray(records) ? records[0]?.performance_score ?? 0 : records?.performance_score ?? 0
  })

  const correlations: FeatureCorrelation[] = []

  for (const key of featureKeys) {
    const values = data.map((row: any) => row.feature_vector?.[key] ?? 0)

    const corr = pearsonCorrelation(values, scores)

    // Compute optimal range (top quartile of performers)
    const sorted = data
      .map((row: any, i: number) => ({ value: values[i], score: scores[i] }))
      .sort((a: any, b: any) => b.score - a.score)

    const topQuartile = sorted.slice(0, Math.max(1, Math.floor(sorted.length / 4)))
    const topValues = topQuartile.map((d: any) => d.value)

    correlations.push({
      featureKey: key,
      correlation: corr,
      sampleSize: data.length,
      optimalRange: {
        min: Math.min(...topValues),
        max: Math.max(...topValues),
      },
    })
  }

  return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
}

/**
 * Predict a performance score for a new project based on learned correlations.
 */
export function predictScore(
  featureVector: Record<string, number>,
  correlations: FeatureCorrelation[]
): ScoreResult {
  if (correlations.length === 0) {
    return { score: 50, confidence: 0, factors: [] }
  }

  let weightedSum = 0
  let totalWeight = 0
  const factors: ScoringFactor[] = []

  for (const corr of correlations) {
    const currentValue = featureVector[corr.featureKey] ?? 0
    const weight = Math.abs(corr.correlation)
    const { min: optMin, max: optMax } = corr.optimalRange

    // How close is the current value to the optimal range?
    let proximity = 1
    if (optMax > optMin) {
      if (currentValue >= optMin && currentValue <= optMax) {
        proximity = 1
      } else if (currentValue < optMin) {
        proximity = 1 - Math.min(1, (optMin - currentValue) / (optMax - optMin + 0.01))
      } else {
        proximity = 1 - Math.min(1, (currentValue - optMax) / (optMax - optMin + 0.01))
      }
    }

    // Weight by correlation strength
    const contribution = proximity * weight
    weightedSum += contribution
    totalWeight += weight

    const optimalValue = (optMin + optMax) / 2
    const isPositive = corr.correlation > 0
      ? currentValue >= optMin
      : currentValue <= optMax

    factors.push({
      featureKey: corr.featureKey,
      label: FEATURE_LABELS[corr.featureKey] || corr.featureKey,
      currentValue,
      optimalValue,
      impact: Math.abs(corr.correlation) < 0.1
        ? 'neutral'
        : isPositive ? 'positive' : 'negative',
      description: generateFactorDescription(corr.featureKey, currentValue, optMin, optMax, corr.correlation),
    })
  }

  const score = totalWeight > 0
    ? Math.round((weightedSum / totalWeight) * 100)
    : 50

  // Confidence based on sample size (needs ~20 posts for full confidence)
  const avgSampleSize = mean(correlations.map((c) => c.sampleSize))
  const confidence = Math.min(avgSampleSize / 20, 1)

  // Sort factors by absolute impact
  factors.sort((a, b) => {
    const aCorr = correlations.find((c) => c.featureKey === a.featureKey)
    const bCorr = correlations.find((c) => c.featureKey === b.featureKey)
    return Math.abs(bCorr?.correlation ?? 0) - Math.abs(aCorr?.correlation ?? 0)
  })

  return { score: Math.max(0, Math.min(100, score)), confidence, factors: factors.slice(0, 10) }
}

/**
 * Generate recommendations by comparing current features against optimal ranges.
 */
export function generateLocalRecommendations(
  featureVector: Record<string, number>,
  correlations: FeatureCorrelation[],
  platform: string
): LocalRecommendation[] {
  // If not enough data, return platform defaults
  if (correlations.length === 0 || correlations[0].sampleSize < 5) {
    return PLATFORM_DEFAULTS[platform] || PLATFORM_DEFAULTS.tiktok
  }

  const recommendations: LocalRecommendation[] = []

  for (const corr of correlations) {
    if (Math.abs(corr.correlation) < 0.15) continue // Skip weak correlations

    const currentValue = featureVector[corr.featureKey] ?? 0
    const { min: optMin, max: optMax } = corr.optimalRange
    const optMid = (optMin + optMax) / 2

    // Check if current value is outside optimal range
    const isInRange = currentValue >= optMin && currentValue <= optMax
    if (isInRange) continue

    const rec = buildRecommendation(corr.featureKey, currentValue, optMin, optMax, optMid, corr, platform)
    if (rec) recommendations.push(rec)
  }

  // Sort by priority then confidence
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
  recommendations.sort(
    (a, b) => (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1) || b.confidence - a.confidence
  )

  return recommendations.slice(0, 8)
}

/**
 * Recompute performance_score for all of a user's performance records.
 * Normalizes scores 0-100 based on the user's own distribution.
 */
export async function recomputePerformanceScores(userId: string): Promise<void> {
  const supabase = getSupabaseAdmin()

  const { data: records, error } = await supabase
    .from('performance_records')
    .select('id, views, likes, comments, shares, saves, engagement_rate, avg_watch_time_sec')
    .eq('user_id', userId)

  if (error || !records || records.length === 0) return

  // Compute raw composite score for each record
  const rawScores = records.map((r: any) => {
    // Weighted composite: engagement_rate(40%) + views_norm(20%) + saves(15%) + shares(15%) + watch_time(10%)
    return {
      id: r.id,
      raw: (r.engagement_rate || 0) * 40
        + Math.min((r.views || 0) / 1000, 1) * 20
        + Math.min((r.saves || 0) / 100, 1) * 15
        + Math.min((r.shares || 0) / 50, 1) * 15
        + Math.min((r.avg_watch_time_sec || 0) / 30, 1) * 10,
    }
  })

  // Normalize to 0-100
  const maxRaw = Math.max(...rawScores.map((s) => s.raw), 0.01)
  const minRaw = Math.min(...rawScores.map((s) => s.raw))
  const range = maxRaw - minRaw || 1

  for (const score of rawScores) {
    const normalized = Math.round(((score.raw - minRaw) / range) * 100)
    await supabase
      .from('performance_records')
      .update({ performance_score: normalized, updated_at: new Date().toISOString() })
      .eq('id', score.id)
  }
}

/**
 * Update learned_patterns table with latest correlations.
 */
export async function updateLearnedPatterns(
  userId: string,
  correlations: FeatureCorrelation[],
  platform?: string
): Promise<void> {
  const supabase = getSupabaseAdmin()

  // Deactivate old feature_correlation patterns for this user/platform
  await supabase
    .from('learned_patterns')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('pattern_type', 'feature_correlation')
    .is('platform', platform || null)

  // Insert new patterns for significant correlations
  const significantCorrelations = correlations.filter((c) => Math.abs(c.correlation) >= 0.2)

  if (significantCorrelations.length === 0) return

  const patterns = significantCorrelations.map((c) => ({
    user_id: userId,
    pattern_type: 'feature_correlation',
    platform: platform || null,
    confidence: Math.min(Math.abs(c.correlation), 1),
    sample_size: c.sampleSize,
    title: generatePatternTitle(c),
    description: generatePatternDescription(c),
    feature_key: c.featureKey,
    feature_value: JSON.stringify(c.optimalRange),
    impact_score: Math.abs(c.correlation),
    data: {
      correlation: c.correlation,
      optimalRange: c.optimalRange,
      sampleSize: c.sampleSize,
    },
    is_active: true,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  }))

  await supabase.from('learned_patterns').insert(patterns)
}

// ── Internal helpers ──

function generateFactorDescription(
  key: string,
  current: number,
  optMin: number,
  optMax: number,
  correlation: number
): string {
  const label = FEATURE_LABELS[key] || key
  const inRange = current >= optMin && current <= optMax

  if (inRange) {
    return `${label} is in the optimal range.`
  }

  const direction = current < optMin ? 'below' : 'above'
  const strength = Math.abs(correlation) > 0.5 ? 'strongly' : 'moderately'
  return `${label} is ${direction} the optimal range. This ${strength} correlates with performance.`
}

function generatePatternTitle(corr: FeatureCorrelation): string {
  const label = FEATURE_LABELS[corr.featureKey] || corr.featureKey
  const direction = corr.correlation > 0 ? 'positively' : 'negatively'
  return `${label} ${direction} correlates with performance`
}

function generatePatternDescription(corr: FeatureCorrelation): string {
  const label = FEATURE_LABELS[corr.featureKey] || corr.featureKey
  const strength = Math.abs(corr.correlation) > 0.5 ? 'strong' : 'moderate'
  const { min, max } = corr.optimalRange
  return `Based on ${corr.sampleSize} posts, there is a ${strength} correlation (${corr.correlation.toFixed(2)}) between ${label} and engagement. Optimal range: ${min.toFixed(2)} - ${max.toFixed(2)}.`
}

function buildRecommendation(
  key: string,
  current: number,
  optMin: number,
  optMax: number,
  optMid: number,
  corr: FeatureCorrelation,
  platform: string
): LocalRecommendation | null {
  const label = FEATURE_LABELS[key] || key
  const strength = Math.abs(corr.correlation)
  const priority = strength > 0.5 ? 'high' : strength > 0.3 ? 'medium' : 'low'

  // Map feature keys to action types
  const actionMap: Record<string, { type: string; payload: (v: number) => Record<string, unknown> }> = {
    aspect_ratio: {
      type: 'set_aspect_ratio',
      payload: (v) => {
        const ratioMap: Record<number, string> = { 0: '9:16', 0.25: '4:3', 0.5: '1:1', 0.75: '16:9', 1: '21:9' }
        const closest = Object.keys(ratioMap).reduce((a, b) =>
          Math.abs(Number(b) - v) < Math.abs(Number(a) - v) ? b : a
        )
        return { aspectRatio: ratioMap[Number(closest)] }
      },
    },
    duration: {
      type: 'set_duration',
      payload: (v) => ({ durationSeconds: Math.round(v * 180) }),
    },
    has_captions: {
      type: 'set_caption_style',
      payload: () => ({ captionStyle: 'word-by-word' }),
    },
    has_cta: {
      type: 'add_cta',
      payload: () => ({ content: 'Follow for more!' }),
    },
    posting_hour: {
      type: 'change_posting_time',
      payload: (v) => ({ suggestedHour: Math.round(v * 23) }),
    },
  }

  const action = actionMap[key]

  return {
    category: getCategoryForKey(key),
    title: `Optimize ${label}`,
    description: `Your current ${label.toLowerCase()} is outside the optimal range based on your past ${corr.sampleSize} posts on ${platform}. Adjusting this could improve your performance score.`,
    priority,
    confidence: Math.min(strength * (corr.sampleSize / 20), 1),
    actionType: action?.type || null,
    actionPayload: action ? action.payload(optMid) : {},
  }
}

function getCategoryForKey(key: string): string {
  const categoryMap: Record<string, string> = {
    aspect_ratio: 'aspect_ratio',
    duration: 'duration',
    has_captions: 'caption_style',
    posting_hour: 'posting_time',
    posting_day: 'posting_time',
    emotion_diversity: 'emotion',
    character_count: 'general',
    voice_count: 'voice',
    animation_count: 'animation',
    has_cta: 'general',
    has_title: 'general',
  }
  return categoryMap[key] || 'general'
}
