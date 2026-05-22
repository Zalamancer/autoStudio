/**
 * useViralityScore — Debounced scoring hook that watches store changes
 * and calls the learning system to produce a live 0-100 virality score.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import type { SocialPlatform } from '@/types/social'

export interface ViralityFactor {
  name: string
  value: number
  impact: 'positive' | 'negative' | 'neutral'
  label: string
}

export interface ViralitySuggestion {
  id: string
  text: string
  impact: number
  actionType?: string
  actionPayload?: unknown
}

export interface ViralityScoreResult {
  score: number
  confidence: number
  factors: ViralityFactor[]
  suggestions: ViralitySuggestion[]
  platform: SocialPlatform
}

const DEBOUNCE_MS = 300

/**
 * Extracts a quick feature snapshot from current stores for scoring.
 */
function extractQuickFeatures() {
  const chars = useMultiCharacterStore.getState().characters
  const lines = useMultiCharacterStore.getState().dialogueLines
  const voices = useVoiceStore.getState().generatedVoices
  const textOverlays = useTextOverlayStore.getState().overlays
  const animations = useAnimationStore.getState().activeAnimations
  const fps = useTimelineStore.getState().fps
  const totalFrames = useTimelineStore.getState().totalFrames
  const aspectRatio = useEditorStore.getState().aspectRatio

  const durationSeconds = totalFrames / (fps || 30)
  const totalWords = lines.reduce((sum, l) => sum + l.script.split(/\s+/).length, 0)
  const speechRate = durationSeconds > 0 ? (totalWords / durationSeconds) * 60 : 0

  // Emotion diversity: count unique emotions
  const emotions = new Set(lines.map((l) => l.emotion || 'Auto'))

  // Hook analysis: check if first 3 seconds have text/visual
  const hookFrames = Math.round(3 * (fps || 30))
  const hasHook = textOverlays.some((t) => (t.startFrame ?? 0) < hookFrames) || lines.some((l) => l.startFrame < hookFrames)

  // Pacing: words per second consistency
  let pacingScore = 0.5
  if (lines.length >= 2) {
    const wpsValues = lines.map((l) => {
      const dur = (l.endFrame - l.startFrame) / (fps || 30)
      return dur > 0 ? l.script.split(/\s+/).length / dur : 0
    })
    const avgWps = wpsValues.reduce((a, b) => a + b, 0) / wpsValues.length
    const variance = wpsValues.reduce((sum, v) => sum + (v - avgWps) ** 2, 0) / wpsValues.length
    const cv = avgWps > 0 ? Math.sqrt(variance) / avgWps : 1
    pacingScore = Math.max(0, 1 - cv) // Lower variance = better pacing
  }

  return {
    characterCount: chars.length,
    dialogueLines: lines.length,
    totalWords,
    speechRate,
    voiceCount: new Set(voices.map((v) => v.voiceId)).size,
    textOverlayCount: textOverlays.length,
    hasTitle: textOverlays.some((t) => t.presetType === 'title'),
    hasCTA: textOverlays.some((t) => t.presetType === 'cta'),
    animationCount: animations.length,
    durationSeconds,
    aspectRatio,
    emotionDiversity: emotions.size / 7, // 7 emotion categories
    hasHook,
    pacingScore,
  }
}

/**
 * Compute a heuristic virality score from features.
 * This runs client-side for instant feedback. The backend model
 * provides a more accurate score when available.
 */
function computeHeuristicScore(
  features: ReturnType<typeof extractQuickFeatures>,
  platform: SocialPlatform,
): ViralityScoreResult {
  const factors: ViralityFactor[] = []
  let score = 50 // Base score

  // Duration scoring
  const idealDuration = platform === 'tiktok' ? 30 : platform === 'instagram' ? 30 : 60
  const durationDiff = Math.abs(features.durationSeconds - idealDuration) / idealDuration
  const durationScore = Math.max(0, 1 - durationDiff)
  score += (durationScore - 0.5) * 20
  factors.push({
    name: 'duration',
    value: durationScore,
    impact: durationScore > 0.6 ? 'positive' : durationScore < 0.3 ? 'negative' : 'neutral',
    label: `Duration: ${Math.round(features.durationSeconds)}s (ideal ~${idealDuration}s)`,
  })

  // Hook (first 3 seconds)
  if (features.hasHook) {
    score += 10
    factors.push({ name: 'hook', value: 1, impact: 'positive', label: 'Strong opening hook detected' })
  } else {
    score -= 5
    factors.push({ name: 'hook', value: 0, impact: 'negative', label: 'No hook in first 3 seconds' })
  }

  // Pacing
  score += (features.pacingScore - 0.5) * 15
  factors.push({
    name: 'pacing',
    value: features.pacingScore,
    impact: features.pacingScore > 0.6 ? 'positive' : features.pacingScore < 0.3 ? 'negative' : 'neutral',
    label: `Pacing consistency: ${Math.round(features.pacingScore * 100)}%`,
  })

  // Emotion arc
  score += features.emotionDiversity * 10
  factors.push({
    name: 'emotionArc',
    value: features.emotionDiversity,
    impact: features.emotionDiversity > 0.3 ? 'positive' : 'neutral',
    label: `Emotion diversity: ${Math.round(features.emotionDiversity * 100)}%`,
  })

  // CTA presence
  if (features.hasCTA) {
    score += 5
    factors.push({ name: 'cta', value: 1, impact: 'positive', label: 'Has call-to-action' })
  }

  // Title
  if (features.hasTitle) {
    score += 3
    factors.push({ name: 'title', value: 1, impact: 'positive', label: 'Has title overlay' })
  }

  // Speech rate
  const idealWpm = 150
  const wpmDiff = Math.abs(features.speechRate - idealWpm) / idealWpm
  const speechScore = Math.max(0, 1 - wpmDiff)
  score += (speechScore - 0.5) * 10
  factors.push({
    name: 'speechRate',
    value: speechScore,
    impact: speechScore > 0.6 ? 'positive' : speechScore < 0.3 ? 'negative' : 'neutral',
    label: `Speech rate: ${Math.round(features.speechRate)} WPM (ideal ~150)`,
  })

  // Aspect ratio for platform
  const idealAspect = platform === 'youtube' ? '16:9' : '9:16'
  if (features.aspectRatio === idealAspect) {
    score += 5
    factors.push({ name: 'aspectRatio', value: 1, impact: 'positive', label: `Optimal aspect ratio for ${platform}` })
  }

  // Clamp
  score = Math.max(0, Math.min(100, Math.round(score)))

  // Generate suggestions
  const suggestions: ViralitySuggestion[] = []
  if (!features.hasHook) {
    suggestions.push({
      id: 'add-hook',
      text: 'Add a title or text overlay in the first 3 seconds to hook viewers',
      impact: 10,
      actionType: 'add-text-overlay',
      actionPayload: { preset: 'title', startFrame: 0 },
    })
  }
  if (!features.hasCTA) {
    suggestions.push({
      id: 'add-cta',
      text: 'Add a call-to-action overlay to drive engagement',
      impact: 5,
      actionType: 'add-text-overlay',
      actionPayload: { preset: 'cta' },
    })
  }
  if (features.speechRate > 200) {
    suggestions.push({
      id: 'slow-down',
      text: 'Speech rate is high. Consider slowing down for better comprehension.',
      impact: 8,
    })
  }
  if (features.durationSeconds > idealDuration * 1.5) {
    suggestions.push({
      id: 'shorten',
      text: `Clip is long for ${platform}. Consider trimming to ~${idealDuration}s.`,
      impact: 7,
    })
  }
  if (features.emotionDiversity < 0.15) {
    suggestions.push({
      id: 'add-emotion',
      text: 'Add more emotion variety to create a stronger emotional arc',
      impact: 6,
    })
  }

  // Sort factors by absolute impact
  factors.sort((a, b) => Math.abs(b.value - 0.5) - Math.abs(a.value - 0.5))

  return {
    score,
    confidence: features.dialogueLines > 0 ? 0.7 : 0.3,
    factors: factors.slice(0, 6),
    suggestions: suggestions.sort((a, b) => b.impact - a.impact).slice(0, 3),
    platform,
  }
}

export function useViralityScore(platform: SocialPlatform = 'tiktok') {
  const [result, setResult] = useState<ViralityScoreResult | null>(null)
  const [isScoring, setIsScoring] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fingerprint of stores to detect changes
  const dialogueLines = useMultiCharacterStore((s) => s.dialogueLines.length)
  const chars = useMultiCharacterStore((s) => s.characters.length)
  const voices = useVoiceStore((s) => s.generatedVoices.length)
  const totalFrames = useTimelineStore((s) => s.totalFrames)
  const aspectRatio = useEditorStore((s) => s.aspectRatio)

  const refresh = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setIsScoring(true)
    timerRef.current = setTimeout(() => {
      const features = extractQuickFeatures()
      const scored = computeHeuristicScore(features, platform)
      setResult(scored)
      setIsScoring(false)
    }, DEBOUNCE_MS)
  }, [platform])

  // Auto-refresh when key stores change
  useEffect(() => {
    refresh()
  }, [dialogueLines, chars, voices, totalFrames, aspectRatio, platform, refresh])

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { result, isScoring, refresh }
}
