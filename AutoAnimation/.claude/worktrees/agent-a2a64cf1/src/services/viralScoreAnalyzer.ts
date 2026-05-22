/**
 * Viral Score Analyzer — Multi-dimensional clip analysis for pre-publish scoring.
 *
 * Analyzes a completed clip across 6 dimensions:
 * - Hook (first 3 seconds)
 * - Pacing (cuts per minute, visual variety)
 * - Emotion (variety and intensity from dialogue)
 * - Visual (layer count, transitions, template usage)
 * - Trend (caption style, aspect ratio, duration alignment)
 * - Rewatch (non-linear interest curve, surprise elements)
 *
 * Returns actionable suggestions with estimated point impact.
 */

import type { ViralScoreDimensions } from '@/types/orchestrator'
import { logger } from '@/utils/logger'

export interface AnalysisInput {
  /** Total duration in seconds */
  durationSeconds: number
  /** Frames per second */
  fps: number
  /** Aspect ratio */
  aspectRatio: string
  /** Number of dialogue lines */
  dialogueLineCount: number
  /** Dialogue emotions (extracted from scripts) */
  dialogueEmotions: string[]
  /** Number of text overlays */
  textOverlayCount: number
  /** Number of shapes */
  shapeCount: number
  /** Number of stock media items */
  stockMediaCount: number
  /** Number of HTML templates */
  htmlTemplateCount: number
  /** Number of SVG objects */
  svgObjectCount: number
  /** Has background music */
  hasMusic: boolean
  /** Has sound effects */
  hasSoundEffects: boolean
  /** Caption style */
  captionStyle: string
  /** First dialogue line (hook text) */
  hookText: string
  /** Number of scene transitions */
  transitionCount: number
  /** Has camera movement */
  hasCameraMovement: boolean
  /** Target platform */
  targetPlatform?: string
}

export interface ActionableSuggestion {
  id: string
  text: string
  dimension: keyof ViralScoreDimensions
  impact: number // estimated point increase
  priority: 'high' | 'medium' | 'low'
}

export interface EnhancedViralAnalysis {
  overall: number
  dimensions: ViralScoreDimensions
  suggestions: ActionableSuggestion[]
  /** Radar chart data points (0-100) */
  radarData: { dimension: string; value: number; label: string }[]
}

/**
 * Score the hook — first 3 seconds effectiveness.
 */
function scoreHook(input: AnalysisInput): { score: number; suggestions: ActionableSuggestion[] } {
  let score = 50 // baseline
  const suggestions: ActionableSuggestion[] = []

  // Check hook text quality
  if (input.hookText) {
    const hookLength = input.hookText.length

    // Question hooks are effective
    if (input.hookText.includes('?')) {
      score += 15
    }

    // Short punchy hooks (under 15 words) are better
    const wordCount = input.hookText.split(/\s+/).length
    if (wordCount <= 10) {
      score += 10
    } else if (wordCount > 20) {
      score -= 10
      suggestions.push({
        id: 'hook-shorten',
        text: 'Shorten the opening line to under 10 words for a punchier hook',
        dimension: 'hook',
        impact: 10,
        priority: 'high',
      })
    }

    // Numbers/stats in hook are attention-grabbing
    if (/\d/.test(input.hookText)) {
      score += 8
    }

    // Too long text for first 3 seconds
    if (hookLength > 100) {
      score -= 5
    }
  } else {
    score -= 20
    suggestions.push({
      id: 'hook-add',
      text: 'Add a strong opening hook — a question or surprising fact in the first 3 seconds',
      dimension: 'hook',
      impact: 20,
      priority: 'high',
    })
  }

  // Visual hook: stock media or template in first few seconds
  if (input.stockMediaCount > 0 || input.htmlTemplateCount > 0) {
    score += 5
  }

  return { score: Math.max(0, Math.min(100, score)), suggestions }
}

/**
 * Score pacing — visual variety and timing.
 */
function scorePacing(input: AnalysisInput): { score: number; suggestions: ActionableSuggestion[] } {
  let score = 50
  const suggestions: ActionableSuggestion[] = []

  // Optimal duration for short-form: 15-60 seconds
  if (input.durationSeconds >= 15 && input.durationSeconds <= 60) {
    score += 20
  } else if (input.durationSeconds < 10) {
    score -= 10
    suggestions.push({
      id: 'pacing-longer',
      text: 'Consider extending to at least 15 seconds for better engagement',
      dimension: 'pacing',
      impact: 10,
      priority: 'medium',
    })
  } else if (input.durationSeconds > 90) {
    score -= 15
    suggestions.push({
      id: 'pacing-shorter',
      text: 'Trim to under 60 seconds — shorter clips get more completions',
      dimension: 'pacing',
      impact: 15,
      priority: 'high',
    })
  }

  // Visual cuts (transitions, media changes)
  const visualElements = input.textOverlayCount + input.stockMediaCount + input.htmlTemplateCount + input.svgObjectCount
  const cutsPerMinute = (visualElements / input.durationSeconds) * 60
  if (cutsPerMinute >= 8 && cutsPerMinute <= 20) {
    score += 15 // good pacing
  } else if (cutsPerMinute < 4) {
    score -= 10
    suggestions.push({
      id: 'pacing-more-cuts',
      text: 'Add more visual elements (text, media, templates) for faster pacing',
      dimension: 'pacing',
      impact: 10,
      priority: 'medium',
    })
  }

  // Scene transitions add dynamism
  if (input.transitionCount > 0) {
    score += 5
  }

  // Camera movement adds engagement
  if (input.hasCameraMovement) {
    score += 5
  }

  return { score: Math.max(0, Math.min(100, score)), suggestions }
}

/**
 * Score emotional content.
 */
function scoreEmotion(input: AnalysisInput): { score: number; suggestions: ActionableSuggestion[] } {
  let score = 50
  const suggestions: ActionableSuggestion[] = []

  // Emotion variety
  const uniqueEmotions = new Set(input.dialogueEmotions.map((e) => e.toLowerCase()))
  if (uniqueEmotions.size >= 3) {
    score += 20 // good emotional arc
  } else if (uniqueEmotions.size === 2) {
    score += 10
  } else if (uniqueEmotions.size <= 1) {
    suggestions.push({
      id: 'emotion-variety',
      text: 'Add emotion variety — mix joy, surprise, and tension for a better emotional arc',
      dimension: 'emotion',
      impact: 15,
      priority: 'medium',
    })
  }

  // Multiple dialogue lines suggest a story
  if (input.dialogueLineCount >= 3) {
    score += 10
  }

  // Sound effects add emotional impact
  if (input.hasSoundEffects) {
    score += 5
  }

  // Music adds emotional depth
  if (input.hasMusic) {
    score += 10
  } else {
    suggestions.push({
      id: 'emotion-music',
      text: 'Add background music to enhance the emotional impact',
      dimension: 'emotion',
      impact: 10,
      priority: 'medium',
    })
  }

  return { score: Math.max(0, Math.min(100, score)), suggestions }
}

/**
 * Score visual richness.
 */
function scoreVisual(input: AnalysisInput): { score: number; suggestions: ActionableSuggestion[] } {
  let score = 40
  const suggestions: ActionableSuggestion[] = []

  // Layer count indicates visual richness
  const totalLayers = input.textOverlayCount + input.stockMediaCount +
    input.htmlTemplateCount + input.svgObjectCount + input.shapeCount

  if (totalLayers >= 5) {
    score += 25
  } else if (totalLayers >= 3) {
    score += 15
  } else if (totalLayers < 2) {
    suggestions.push({
      id: 'visual-layers',
      text: 'Add text overlays, stock media, or templates for more visual interest',
      dimension: 'visual',
      impact: 15,
      priority: 'medium',
    })
  }

  // Stock media (B-roll) is visually engaging
  if (input.stockMediaCount > 0) {
    score += 10
  }

  // HTML templates add production value
  if (input.htmlTemplateCount > 0) {
    score += 10
  }

  // SVG objects add unique visuals
  if (input.svgObjectCount > 0) {
    score += 5
  }

  return { score: Math.max(0, Math.min(100, score)), suggestions }
}

/**
 * Score trend alignment.
 */
function scoreTrend(input: AnalysisInput): { score: number; suggestions: ActionableSuggestion[] } {
  let score = 50
  const suggestions: ActionableSuggestion[] = []

  // Vertical format is trending
  if (input.aspectRatio === '9:16') {
    score += 15
  } else if (input.aspectRatio === '1:1') {
    score += 5
  } else {
    suggestions.push({
      id: 'trend-vertical',
      text: 'Consider 9:16 vertical format — it performs best on TikTok and Reels',
      dimension: 'trend',
      impact: 10,
      priority: 'low',
    })
  }

  // Captions are essential for engagement (most viewers watch muted)
  if (input.captionStyle && input.captionStyle !== 'none') {
    score += 15
  } else {
    suggestions.push({
      id: 'trend-captions',
      text: 'Add captions — 80% of viewers watch without sound',
      dimension: 'trend',
      impact: 15,
      priority: 'high',
    })
  }

  // Animated caption styles are trending
  if (input.captionStyle?.startsWith('animated-')) {
    score += 10
  }

  // Platform-specific optimizations
  if (input.targetPlatform === 'tiktok' && input.durationSeconds <= 60) {
    score += 5
  }
  if (input.targetPlatform === 'youtube-shorts' && input.durationSeconds <= 60) {
    score += 5
  }

  return { score: Math.max(0, Math.min(100, score)), suggestions }
}

/**
 * Score rewatch potential.
 */
function scoreRewatch(input: AnalysisInput): { score: number; suggestions: ActionableSuggestion[] } {
  let score = 40
  const suggestions: ActionableSuggestion[] = []

  // Shorter clips get more rewatches
  if (input.durationSeconds <= 30) {
    score += 15
  } else if (input.durationSeconds <= 15) {
    score += 25
  }

  // Multiple visual elements create "did I miss that?" effect
  const totalElements = input.textOverlayCount + input.svgObjectCount + input.stockMediaCount
  if (totalElements >= 4) {
    score += 10
  }

  // Emotional variety encourages rewatching
  const uniqueEmotions = new Set(input.dialogueEmotions)
  if (uniqueEmotions.size >= 3) {
    score += 10
  }

  // Sound effects create memorable moments
  if (input.hasSoundEffects) {
    score += 5
  }

  // Camera movement makes clips feel dynamic
  if (input.hasCameraMovement) {
    score += 5
  }

  if (score < 50) {
    suggestions.push({
      id: 'rewatch-surprise',
      text: 'Add a surprise element or visual twist to encourage rewatches',
      dimension: 'rewatch',
      impact: 10,
      priority: 'low',
    })
  }

  return { score: Math.max(0, Math.min(100, score)), suggestions }
}

/**
 * Run full multi-dimensional analysis on a clip.
 */
export function analyzeClipVirality(input: AnalysisInput): EnhancedViralAnalysis {
  const hookResult = scoreHook(input)
  const pacingResult = scorePacing(input)
  const emotionResult = scoreEmotion(input)
  const visualResult = scoreVisual(input)
  const trendResult = scoreTrend(input)
  const rewatchResult = scoreRewatch(input)

  const dimensions: ViralScoreDimensions = {
    hook: hookResult.score,
    pacing: pacingResult.score,
    emotion: emotionResult.score,
    visual: visualResult.score,
    trend: trendResult.score,
    rewatch: rewatchResult.score,
  }

  // Weighted overall score
  const overall = Math.round(
    dimensions.hook * 0.25 +
    dimensions.pacing * 0.15 +
    dimensions.emotion * 0.15 +
    dimensions.visual * 0.15 +
    dimensions.trend * 0.15 +
    dimensions.rewatch * 0.15,
  )

  // Collect and sort suggestions by impact
  const allSuggestions = [
    ...hookResult.suggestions,
    ...pacingResult.suggestions,
    ...emotionResult.suggestions,
    ...visualResult.suggestions,
    ...trendResult.suggestions,
    ...rewatchResult.suggestions,
  ].sort((a, b) => b.impact - a.impact)

  const radarData = [
    { dimension: 'hook', value: dimensions.hook, label: 'Hook' },
    { dimension: 'pacing', value: dimensions.pacing, label: 'Pacing' },
    { dimension: 'emotion', value: dimensions.emotion, label: 'Emotion' },
    { dimension: 'visual', value: dimensions.visual, label: 'Visual' },
    { dimension: 'trend', value: dimensions.trend, label: 'Trend' },
    { dimension: 'rewatch', value: dimensions.rewatch, label: 'Rewatch' },
  ]

  logger.log(`[ViralScoreAnalyzer] Overall: ${overall}/100`, dimensions)

  return {
    overall,
    dimensions,
    suggestions: allSuggestions,
    radarData,
  }
}

/**
 * Extract analysis input from current store state.
 */
export function extractAnalysisInputFromStores(): AnalysisInput {
  // Lazy import to avoid circular dependencies
  const { useMultiCharacterStore } = require('@/stores/useMultiCharacterStore')
  const { useVoiceStore } = require('@/stores/useVoiceStore')
  const { useTextOverlayStore } = require('@/stores/useTextOverlayStore')
  const { useShapeStore } = require('@/stores/useShapeStore')
  const { useMediaStore } = require('@/stores/useMediaStore')
  const { useHTMLTemplateLayerStore } = require('@/stores/useHTMLTemplateLayerStore')
  const { useSVGObjectStore } = require('@/stores/useSVGObjectStore')
  const { useTimelineStore } = require('@/stores')
  const { useEditorStore } = require('@/stores')
  const { useOrchestratorStore } = require('@/stores/useOrchestratorStore')

  const timeline = useTimelineStore.getState()
  const editor = useEditorStore.getState()
  const dialogue = useMultiCharacterStore.getState()
  const voice = useVoiceStore.getState()
  const text = useTextOverlayStore.getState()
  const shapes = useShapeStore.getState()
  const media = useMediaStore.getState()
  const htmlTemplates = useHTMLTemplateLayerStore.getState()
  const svg = useSVGObjectStore.getState()
  const orchestrator = useOrchestratorStore.getState()

  const durationSeconds = timeline.totalFrames / timeline.fps
  const emotions = dialogue.dialogueLines.map((l: { script: string }) => {
    const match = l.script?.match(/\[([^\]]+)\]/)
    return match ? match[1] : 'neutral'
  })

  const hookText = dialogue.dialogueLines[0]?.script?.replace(/\[.*?\]/g, '').trim() || ''

  return {
    durationSeconds,
    fps: timeline.fps,
    aspectRatio: editor.aspectRatio,
    dialogueLineCount: dialogue.dialogueLines.length,
    dialogueEmotions: emotions,
    textOverlayCount: text.overlays?.length || 0,
    shapeCount: shapes.shapes?.length || 0,
    stockMediaCount: media.canvasItems?.length || 0,
    htmlTemplateCount: htmlTemplates.templates?.length || 0,
    svgObjectCount: svg.composition?.objects?.length || 0,
    hasMusic: voice.generatedVoices?.some((v: { audioDuration: number }) => v.audioDuration > 0) || false,
    hasSoundEffects: false, // TODO: check sound effects store when available
    captionStyle: orchestrator.plan?.captions?.style || 'none',
    hookText,
    transitionCount: orchestrator.plan?.scenes?.length || 0,
    hasCameraMovement: !!orchestrator.plan?.camera || (orchestrator.plan?.cameraDirectives?.length || 0) > 0,
    targetPlatform: orchestrator.settings?.targetPlatform,
  }
}
