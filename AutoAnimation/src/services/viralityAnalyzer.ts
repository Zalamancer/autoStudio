/**
 * Virality Analyzer
 *
 * Fast client-side analysis (free, instant) computed from Zustand store data.
 * Deep analysis (credits) sends features to Gemini for NLP evaluation.
 */

import type {
  ViralityAnalysis,
  ViralityAnalysisInput,
  ViralityDimension,
  ViralityImprovement,
} from '@/types/virality'
import { analyzePlatformFit } from './platformOptimizer'
import type { TargetPlatform } from '@/types/platformOptimization'
import type { CaptionStyle } from '@/types/voice'
import { apiClient } from './apiClient'

// ── Dimension Scorers ──

function scoreHookStrength(input: ViralityAnalysisInput): number {
  let score = 50

  // Early hook — dialogue in first 3 seconds
  if (input.hasEarlyHook) score += 20
  else score -= 20

  // First line analysis
  const firstLine = input.firstLineText.toLowerCase()
  // Penalize generic openers
  if (firstLine.startsWith('hey') || firstLine.startsWith('hi') ||
      firstLine.startsWith('hello') || firstLine.startsWith('welcome') ||
      firstLine.includes('in this video')) {
    score -= 25
  }

  // Reward question marks, numbers, bold claims
  if (firstLine.includes('?')) score += 15
  if (/\d/.test(firstLine)) score += 10
  if (firstLine.includes('!')) score += 5
  if (firstLine.includes('secret') || firstLine.includes('never') ||
      firstLine.includes('worst') || firstLine.includes('best') ||
      firstLine.includes('insane') || firstLine.includes('shocking')) {
    score += 10
  }

  return Math.max(0, Math.min(100, score))
}

function scoreVisualPacing(input: ViralityAnalysisInput): number {
  let score = 50

  // Scene changes per 10 seconds
  const changesPer10s = (input.sceneChangeCount / input.durationSeconds) * 10
  if (changesPer10s >= 2 && changesPer10s <= 5) score += 25
  else if (changesPer10s >= 1) score += 10
  else score -= 15

  // Template usage
  if (input.templateCount >= 1) score += 10
  if (input.templateCount >= 2) score += 5

  // Stock media (B-roll)
  if (input.stockMediaCount >= 1) score += 10

  // SVG objects (visual richness)
  if (input.svgObjectCount >= 1) score += 5

  return Math.max(0, Math.min(100, score))
}

function scoreEmotionalArc(input: ViralityAnalysisInput): number {
  let score = 40

  // Emotion variety — more variety = better engagement
  if (input.emotionVariety >= 4) score += 35
  else if (input.emotionVariety >= 3) score += 25
  else if (input.emotionVariety >= 2) score += 15
  else score -= 10

  // Flat emotional line is boring
  if (input.emotionVariety <= 1 && input.dialogueLineCount > 3) score -= 20

  // More dialogue lines generally means better pacing
  if (input.dialogueLineCount >= 5) score += 10
  if (input.dialogueLineCount >= 10) score += 5

  return Math.max(0, Math.min(100, score))
}

function scoreAudioQuality(input: ViralityAnalysisInput): number {
  let score = 50

  // Optimal speaking rate: 140-170 WPM
  if (input.wpm >= 140 && input.wpm <= 170) score += 25
  else if (input.wpm >= 120 && input.wpm <= 190) score += 10
  else if (input.wpm > 0) score -= 10

  // Background music
  if (input.hasBackgroundMusic) score += 15
  else score -= 10

  // Sound effects
  if (input.hasSoundEffects) score += 10

  return Math.max(0, Math.min(100, score))
}

function scoreCaptionEffectiveness(input: ViralityAnalysisInput): number {
  let score = 40

  // Has captions at all
  if (!input.hasCaptions) return 20

  score += 20

  // Animated styles score higher for short-form
  const isShortForm = input.durationSeconds <= 60
  const animatedStyles = ['animated-pop', 'animated-bounce', 'animated-glow', 'animated-wave']
  if (isShortForm && animatedStyles.includes(input.captionStyle)) {
    score += 20
  } else if (isShortForm && input.captionStyle === 'karaoke') {
    score += 15
  } else if (!isShortForm && input.captionStyle === 'sentence') {
    score += 15
  }

  return Math.max(0, Math.min(100, score))
}

function scoreContentRelevance(input: ViralityAnalysisInput): number {
  let score = 50

  // Duration appropriateness
  if (input.durationSeconds >= 15 && input.durationSeconds <= 90) score += 15
  else if (input.durationSeconds > 180) score -= 15

  // CTA presence
  if (input.hasCTA) score += 15

  // Word count vs duration (too sparse = boring, too dense = overwhelming)
  const wordsPerSecond = input.totalWordCount / input.durationSeconds
  if (wordsPerSecond >= 2 && wordsPerSecond <= 3.5) score += 15
  else if (wordsPerSecond >= 1.5 && wordsPerSecond <= 4) score += 5
  else score -= 10

  return Math.max(0, Math.min(100, score))
}

function scorePlatformFit(input: ViralityAnalysisInput): number {
  const platform = (input.targetPlatform || detectPlatformFromAspect(input.aspectRatio)) as TargetPlatform
  if (platform === 'general') return 70

  const result = analyzePlatformFit(platform, {
    aspectRatio: input.aspectRatio,
    durationSeconds: input.durationSeconds,
    captionStyle: input.captionStyle as CaptionStyle,
    captionPosition: 'bottom', // default for scoring
    textOverlayCount: input.textOverlayCount,
    textOverlayPositions: [],
    hasCTA: input.hasCTA,
  })

  return result.score
}

function detectPlatformFromAspect(aspectRatio: string): TargetPlatform {
  if (aspectRatio === '9:16') return 'tiktok'
  if (aspectRatio === '1:1') return 'instagram-feed'
  if (aspectRatio === '16:9') return 'youtube'
  return 'general'
}

// ── Fast Analysis (Free, Instant) ──

export function analyzeViralityFast(input: ViralityAnalysisInput): ViralityAnalysis {
  const dimensions: ViralityDimension[] = [
    {
      name: 'hook',
      score: scoreHookStrength(input),
      label: 'Hook Strength',
      description: 'First 3 seconds — grabs attention?',
      weight: 0.20,
    },
    {
      name: 'pacing',
      score: scoreVisualPacing(input),
      label: 'Visual Pacing',
      description: 'Scene changes, visual variety',
      weight: 0.15,
    },
    {
      name: 'emotion',
      score: scoreEmotionalArc(input),
      label: 'Emotional Arc',
      description: 'Emotion variety and progression',
      weight: 0.15,
    },
    {
      name: 'audio',
      score: scoreAudioQuality(input),
      label: 'Audio Quality',
      description: 'Speech rate, music, SFX',
      weight: 0.15,
    },
    {
      name: 'captions',
      score: scoreCaptionEffectiveness(input),
      label: 'Caption Effectiveness',
      description: 'Style match, readability',
      weight: 0.10,
    },
    {
      name: 'content',
      score: scoreContentRelevance(input),
      label: 'Content Relevance',
      description: 'Duration, CTA, density',
      weight: 0.10,
    },
    {
      name: 'platform',
      score: scorePlatformFit(input),
      label: 'Platform Fit',
      description: 'Aspect ratio, duration, style',
      weight: 0.15,
    },
  ]

  // Weighted average
  const overall = Math.round(
    dimensions.reduce((sum, d) => sum + d.score * d.weight, 0)
  )

  // Generate improvements (top 3 by potential gain)
  const improvements = generateImprovements(dimensions, input)

  return {
    overall,
    dimensions,
    improvements: improvements.slice(0, 3),
    mode: 'fast',
    timestamp: Date.now(),
  }
}

function generateImprovements(
  dimensions: ViralityDimension[],
  input: ViralityAnalysisInput,
): ViralityImprovement[] {
  const improvements: ViralityImprovement[] = []

  // Sort by lowest score first
  const sorted = [...dimensions].sort((a, b) => a.score - b.score)

  for (const dim of sorted) {
    if (dim.score >= 80) continue // already good

    switch (dim.name) {
      case 'hook':
        if (!input.hasEarlyHook) {
          improvements.push({
            dimension: 'hook',
            description: 'Start with dialogue in the first 3 seconds to hook viewers',
            impact: 'high',
          })
        }
        if (input.firstLineText.toLowerCase().startsWith('hey') ||
            input.firstLineText.toLowerCase().startsWith('hello')) {
          improvements.push({
            dimension: 'hook',
            description: 'Replace generic opener with a question, fact, or bold claim',
            impact: 'high',
          })
        }
        break

      case 'pacing':
        if (input.sceneChangeCount < 2) {
          improvements.push({
            dimension: 'pacing',
            description: 'Add more visual variety — use B-roll, templates, or scene changes',
            impact: 'medium',
          })
        }
        break

      case 'emotion':
        if (input.emotionVariety < 3) {
          improvements.push({
            dimension: 'emotion',
            description: 'Use more emotion variety in dialogue (happy, surprised, serious)',
            impact: 'medium',
          })
        }
        break

      case 'audio':
        if (!input.hasBackgroundMusic) {
          improvements.push({
            dimension: 'audio',
            description: 'Add background music to boost engagement',
            impact: 'medium',
          })
        }
        break

      case 'captions':
        if (!input.hasCaptions) {
          improvements.push({
            dimension: 'captions',
            description: 'Enable captions — most viewers watch without sound',
            impact: 'high',
          })
        } else if (input.durationSeconds <= 60 && !input.captionStyle.startsWith('animated-')) {
          improvements.push({
            dimension: 'captions',
            description: 'Switch to animated captions for short-form content',
            impact: 'low',
          })
        }
        break

      case 'content':
        if (!input.hasCTA) {
          improvements.push({
            dimension: 'content',
            description: 'Add a call-to-action text overlay',
            impact: 'medium',
          })
        }
        break

      case 'platform':
        improvements.push({
          dimension: 'platform',
          description: 'Check platform fitness in Export panel for specific optimizations',
          impact: 'low',
        })
        break
    }
  }

  return improvements
}

// ── Deep Analysis (Credits) ──

export async function analyzeViralityDeep(
  input: ViralityAnalysisInput,
  script: string,
): Promise<ViralityAnalysis> {
  // Start with fast analysis as base
  const fastResult = analyzeViralityFast(input)

  try {
    const response = await apiClient.post('/api/virality/analyze', {
      script,
      features: {
        durationSeconds: input.durationSeconds,
        dialogueLineCount: input.dialogueLineCount,
        emotionVariety: input.emotionVariety,
        wpm: input.wpm,
        hasBackgroundMusic: input.hasBackgroundMusic,
        captionStyle: input.captionStyle,
        aspectRatio: input.aspectRatio,
        firstLineText: input.firstLineText,
      },
    })

    const data = (response as { data: unknown }).data as {
      adjustedScores?: Record<string, number>
      nlpImprovements?: string[]
      percentile?: number
    }

    // Merge deep analysis results
    if (data.adjustedScores) {
      for (const dim of fastResult.dimensions) {
        if (data.adjustedScores[dim.name] !== undefined) {
          // Blend: 60% fast + 40% deep
          dim.score = Math.round(dim.score * 0.6 + data.adjustedScores[dim.name] * 0.4)
        }
      }
    }

    if (data.nlpImprovements) {
      const deepImprovements = data.nlpImprovements.map((desc: string) => ({
        dimension: 'content',
        description: desc,
        impact: 'medium' as const,
      }))
      fastResult.improvements = [...deepImprovements, ...fastResult.improvements].slice(0, 5)
    }

    // Recalculate overall
    fastResult.overall = Math.round(
      fastResult.dimensions.reduce((sum, d) => sum + d.score * d.weight, 0)
    )
    fastResult.mode = 'deep'
    fastResult.percentile = data.percentile
    fastResult.timestamp = Date.now()

    return fastResult
  } catch {
    // If deep analysis fails, return fast result
    return fastResult
  }
}

/**
 * Extract analysis input from the current Zustand store state.
 * This is called from the PrePublishScore component.
 */
export function extractAnalysisInput(): ViralityAnalysisInput {
  // Dynamic imports to avoid circular deps
  const { useTimelineStore } = require('@/stores')
  const { useVoiceStore } = require('@/stores')
  const { useEditorStore } = require('@/stores')
  const { useMultiCharacterStore } = require('@/stores/useMultiCharacterStore')
  const { useMediaStore } = require('@/stores/useMediaStore')
  const { useTextOverlayStore } = require('@/stores/useTextOverlayStore')
  const { useShapeStore } = require('@/stores')
  const { useHTMLTemplateLayerStore } = require('@/stores/useHTMLTemplateLayerStore')

  const timeline = useTimelineStore.getState()
  const voice = useVoiceStore.getState()
  const editor = useEditorStore.getState()
  const multiChar = useMultiCharacterStore.getState()
  const media = useMediaStore.getState()
  const textOverlays = useTextOverlayStore.getState()
  const shapes = useShapeStore.getState()
  const templates = useHTMLTemplateLayerStore.getState()

  const durationSeconds = timeline.totalFrames / timeline.fps
  const dialogueLines = multiChar.dialogueLines
  const totalWords = dialogueLines.reduce(
    (sum: number, l: { script: string }) => sum + l.script.replace(/\[[\w-]+\]/g, '').split(/\s+/).length,
    0
  )
  const wpm = durationSeconds > 0 ? (totalWords / durationSeconds) * 60 : 0

  // Count distinct emotions
  const emotions = new Set(
    dialogueLines.flatMap(
      (l: { script: string }) => (l.script.match(/\[([\w-]+)\]/g) || []).map((m: string) => m.slice(1, -1))
    )
  )

  // Check hook — is there dialogue in first 3 seconds?
  const hookFrames = 3 * timeline.fps
  const hasEarlyHook = dialogueLines.some(
    (l: { startFrame: number }) => l.startFrame < hookFrames
  )

  const firstLine = dialogueLines.length > 0
    ? dialogueLines[0].script.replace(/\[[\w-]+\]/g, '').trim()
    : ''

  // Count visual "scene changes" (template transitions + stock media switches)
  const sceneChanges = (templates.templates?.length || 0) + (media.canvasItems?.length || 0)

  return {
    durationSeconds,
    fps: timeline.fps,
    totalFrames: timeline.totalFrames,
    dialogueLineCount: dialogueLines.length,
    totalWordCount: totalWords,
    wpm: Math.round(wpm),
    emotionVariety: emotions.size,
    hasEarlyHook,
    firstLineText: firstLine,
    sceneChangeCount: sceneChanges,
    templateCount: templates.templates?.length || 0,
    stockMediaCount: media.canvasItems?.length || 0,
    svgObjectCount: 0, // SVG objects from useSVGObjectStore if needed
    shapeCount: shapes.shapes?.length || 0,
    hasBackgroundMusic: (media.assets || []).some(
      (a: { type: string }) => a.type === 'audio'
    ),
    hasSoundEffects: false, // Could check sound effect store
    soundEffectCount: 0,
    captionStyle: voice.captionStyle,
    hasCaptions: !!voice.activeVoiceId,
    textOverlayCount: textOverlays.overlays?.length || 0,
    hasCTA: (textOverlays.overlays || []).some(
      (t: { content: string }) =>
        t.content?.toLowerCase().includes('subscribe') ||
        t.content?.toLowerCase().includes('follow') ||
        t.content?.toLowerCase().includes('link')
    ),
    aspectRatio: editor.aspectRatio,
  }
}
