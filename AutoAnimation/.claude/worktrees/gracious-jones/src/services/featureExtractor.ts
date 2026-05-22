/**
 * Feature Extractor: reads from all Zustand stores to produce a normalized
 * ProjectFeatureSnapshot at publish time. Used by the AI learning system
 * to correlate project features with engagement outcomes.
 */

import type { ProjectFeatureSnapshot } from '@/types/learning'
import type { SocialPlatform } from '@/types/social'
import { useEditorStore } from '@/stores/useEditorStore'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { usePlaybackStore } from '@/stores/usePlaybackStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { useHTMLTemplateLayerStore } from '@/stores/useHTMLTemplateLayerStore'

// ── Helpers ──────────────────────────────────────────────────────────────

/** Count words in a string */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/** Clamp and normalize a value to 0-1 range */
function normalize(value: number, min: number, max: number): number {
  if (max <= min) return 0
  return Math.max(0, Math.min(1, (value - min) / (max - min)))
}

/** Map aspect ratio to a numeric value for the feature vector */
function aspectRatioToNumeric(ratio: string): number {
  const map: Record<string, number> = {
    '9:16': 0,    // vertical (shorts/reels)
    '4:3': 0.25,  // classic
    '1:1': 0.5,   // square
    '16:9': 0.75, // landscape
    '21:9': 1,    // ultrawide
  }
  return map[ratio] ?? 0.5
}

// ── Main Extractor ───────────────────────────────────────────────────────

/**
 * Extract all relevant features from the current project state.
 * Call this at publish time to capture a snapshot of the project.
 */
export function extractProjectFeatures(platform: SocialPlatform): ProjectFeatureSnapshot {
  const editor = useEditorStore.getState()
  const canvas = useCanvasStore.getState()
  const playback = usePlaybackStore.getState()
  const multiChar = useMultiCharacterStore.getState()
  const voice = useVoiceStore.getState()
  const animations = useAnimationStore.getState()
  const textOverlays = useTextOverlayStore.getState()
  const svgObjects = useSVGObjectStore.getState()
  const htmlTemplates = useHTMLTemplateLayerStore.getState()

  // ── Canvas ──
  const aspectRatio = editor.aspectRatio
  const fps = playback.fps
  const durationSeconds = playback.duration
  const canvasWidth = canvas.canvasWidth
  const canvasHeight = canvas.canvasHeight

  // ── Characters ──
  const characters = multiChar.characters
  const dialogueLines = multiChar.dialogueLines
  const characterCount = characters.length
  const dialogueLineCount = dialogueLines.length

  // Count total words across all dialogue lines
  const totalScriptWordCount = dialogueLines.reduce(
    (sum, line) => sum + countWords(line.script),
    0
  )

  // Compute emotion distribution (normalized to sum to 1)
  const emotionCounts: Record<string, number> = {}
  for (const line of dialogueLines) {
    const emotion = line.emotion || 'Neutral'
    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1
  }
  const totalEmotions = dialogueLines.length || 1
  const emotionDistribution: Record<string, number> = {}
  for (const [emotion, count] of Object.entries(emotionCounts)) {
    emotionDistribution[emotion] = count / totalEmotions
  }

  // ── Voice ──
  const voiceIds = [...new Set(characters.map((c) => c.voiceId).filter(Boolean) as string[])]
  const voiceCount = voiceIds.length

  // Compute average speech rate from dialogue lines with word timelines
  let totalWordsWithTiming = 0
  let totalDurationWithTiming = 0
  for (const line of dialogueLines) {
    if (line.wordTimeline && line.wordTimeline.length > 0) {
      const lineWords = countWords(line.script)
      const lineDuration = (line.endFrame - line.startFrame) / fps
      if (lineDuration > 0) {
        totalWordsWithTiming += lineWords
        totalDurationWithTiming += lineDuration
      }
    }
  }
  const avgSpeechRateWpm = totalDurationWithTiming > 0
    ? (totalWordsWithTiming / totalDurationWithTiming) * 60
    : 0

  // ── Animations ──
  const activeAnimations = animations.activeAnimations
  const animationCount = activeAnimations.length
  const hasLottieBackground = activeAnimations.some(
    (a) => animations.library.find((lib) => lib.id === a.animationId)?.category === 'background'
  )
  const hasSVGAnimations = svgObjects.composition !== null
  const htmlTemplatesList = htmlTemplates.templates
  const hasHTMLTemplates = htmlTemplatesList.length > 0
  const htmlTemplateIds = htmlTemplatesList.map((t) => t.id)

  // ── Captions ──
  const captionStyle = voice.captionStyle || null
  const captionPosition = voice.captionPosition || null

  // ── Text Overlays ──
  const overlays = textOverlays.overlays
  const textOverlayCount = overlays.length
  const hasTitle = overlays.some((o) => o.presetType === 'title')
  const hasCTA = overlays.some((o) => o.presetType === 'cta')

  // ── Publishing Context ──
  const now = new Date()
  const publishedAt = now.toISOString()
  const postingHour = now.getUTCHours()
  const postingDayOfWeek = now.getUTCDay()

  // ── Build normalized feature vector ──
  const featureVector: Record<string, number> = {
    aspect_ratio: aspectRatioToNumeric(aspectRatio),
    duration: normalize(durationSeconds, 0, 180),       // 0-3 minutes
    fps: normalize(fps, 15, 60),
    character_count: normalize(characterCount, 0, 5),
    dialogue_lines: normalize(dialogueLineCount, 0, 20),
    word_count: normalize(totalScriptWordCount, 0, 500),
    voice_count: normalize(voiceCount, 0, 5),
    speech_rate: normalize(avgSpeechRateWpm, 0, 250),
    animation_count: normalize(animationCount, 0, 10),
    has_lottie_bg: hasLottieBackground ? 1 : 0,
    has_svg: hasSVGAnimations ? 1 : 0,
    has_html_templates: hasHTMLTemplates ? 1 : 0,
    text_overlay_count: normalize(textOverlayCount, 0, 10),
    has_title: hasTitle ? 1 : 0,
    has_cta: hasCTA ? 1 : 0,
    has_captions: captionStyle ? 1 : 0,
    posting_hour: normalize(postingHour, 0, 23),
    posting_day: normalize(postingDayOfWeek, 0, 6),
    // Emotion diversity (0 = single emotion, 1 = many emotions)
    emotion_diversity: normalize(Object.keys(emotionDistribution).length, 1, 6),
  }

  return {
    aspectRatio,
    fps,
    durationSeconds,
    canvasWidth,
    canvasHeight,
    characterCount,
    emotionDistribution,
    dialogueLineCount,
    totalScriptWordCount,
    voiceIds,
    voiceCount,
    avgSpeechRateWpm,
    animationCount,
    hasLottieBackground,
    hasSVGAnimations,
    hasHTMLTemplates,
    htmlTemplateIds,
    captionStyle,
    captionPosition,
    textOverlayCount,
    hasTitle,
    hasCTA,
    platform,
    publishedAt,
    postingHour,
    postingDayOfWeek,
    featureVector,
  }
}
