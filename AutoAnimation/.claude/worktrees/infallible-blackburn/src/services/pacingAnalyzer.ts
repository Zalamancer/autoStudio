import { useTimelineStore } from '@/stores/useTimelineStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useKeyframeStore } from '@/stores/useKeyframeStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { useShapeStore } from '@/stores/useShapeStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useHTMLTemplateLayerStore } from '@/stores/useHTMLTemplateLayerStore'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PacingRating = 'fast' | 'good' | 'slow' | 'empty'

export type PacingIssueType = 'too-fast' | 'too-slow' | 'gap' | 'monotonous'

export type PacingProfileId = 'fast-tiktok' | 'calm-explainer' | 'story-driven'

export interface PacingSegment {
  startFrame: number
  endFrame: number
  rating: PacingRating
  density: number
  /** Dialogue words-per-second in this segment */
  dialogueWps: number
  /** Number of keyframe changes in this segment */
  keyframeChanges: number
  /** Whether audio/dialogue is present */
  hasAudio: boolean
  /** Whether visual elements are present */
  hasVisuals: boolean
}

export interface PacingIssue {
  frame: number
  type: PacingIssueType
  suggestion: string
  severity: 'low' | 'medium' | 'high'
}

export interface PacingAnalysis {
  overallScore: number // 0-100
  segments: PacingSegment[]
  issues: PacingIssue[]
  heatmap: Map<number, number> // frame -> intensity 0-1
  profileId: PacingProfileId
}

// ---------------------------------------------------------------------------
// Pacing Profiles — define ideal density ranges for different content styles
// ---------------------------------------------------------------------------

interface PacingProfile {
  id: PacingProfileId
  label: string
  description: string
  /** Ideal words per second range */
  idealWps: [number, number]
  /** Ideal keyframe changes per second range */
  idealKeyframesPerSec: [number, number]
  /** Maximum acceptable gap (seconds) */
  maxGapSeconds: number
  /** Minimum emotion variation expected (0-1) */
  minEmotionVariation: number
}

export const PACING_PROFILES: PacingProfile[] = [
  {
    id: 'fast-tiktok',
    label: 'Fast TikTok',
    description: 'High energy, rapid cuts, dense dialogue',
    idealWps: [3.0, 5.0],
    idealKeyframesPerSec: [2.0, 8.0],
    maxGapSeconds: 1.0,
    minEmotionVariation: 0.3,
  },
  {
    id: 'calm-explainer',
    label: 'Calm Explainer',
    description: 'Moderate pace, clear narration, steady visuals',
    idealWps: [2.0, 3.5],
    idealKeyframesPerSec: [0.5, 3.0],
    maxGapSeconds: 2.5,
    minEmotionVariation: 0.1,
  },
  {
    id: 'story-driven',
    label: 'Story-driven',
    description: 'Varied pacing with dramatic pauses and climaxes',
    idealWps: [1.5, 4.0],
    idealKeyframesPerSec: [0.5, 5.0],
    maxGapSeconds: 3.0,
    minEmotionVariation: 0.4,
  },
]

// ---------------------------------------------------------------------------
// Analysis engine
// ---------------------------------------------------------------------------

/**
 * Analyze the current project's pacing by reading from all relevant stores.
 * Divides the timeline into 1-second segments and evaluates density.
 */
export function analyzePacing(
  fps: number,
  totalFrames: number,
  profileId: PacingProfileId = 'fast-tiktok'
): PacingAnalysis {
  const profile = PACING_PROFILES.find((p) => p.id === profileId) ?? PACING_PROFILES[0]
  const totalSeconds = totalFrames / fps
  const segmentDurationSec = 1 // 1-second segments
  const segmentFrames = Math.round(segmentDurationSec * fps)
  const segmentCount = Math.max(1, Math.ceil(totalSeconds / segmentDurationSec))

  // -----------------------------------------------------------------------
  // Gather data from stores
  // -----------------------------------------------------------------------

  // Voice / dialogue data
  const voiceState = useVoiceStore.getState()
  const wordTimeline = voiceState.activeWordTimeline
  const emotionTimeline = voiceState.activeEmotionTimeline

  // Multi-character dialogue lines
  const multiCharState = useMultiCharacterStore.getState()
  const dialogueLines = multiCharState.dialogueLines

  // Keyframe tracks
  const keyframeTracks = useKeyframeStore.getState().tracks

  // Timeline clips
  const timelineTracks = useTimelineStore.getState().tracks

  // Visual layers (text, shapes, media, animations, templates)
  const textOverlays = useTextOverlayStore.getState().overlays
  const shapes = useShapeStore.getState().shapes
  const mediaItems = useMediaStore.getState().canvasItems
  const animations = useAnimationStore.getState().activeAnimations
  const templates = useHTMLTemplateLayerStore.getState().templates

  // -----------------------------------------------------------------------
  // Build per-segment metrics
  // -----------------------------------------------------------------------

  const segments: PacingSegment[] = []
  const heatmap = new Map<number, number>()

  for (let i = 0; i < segmentCount; i++) {
    const startFrame = i * segmentFrames
    const endFrame = Math.min((i + 1) * segmentFrames, totalFrames)

    // --- Dialogue density (words per second) ---
    let wordCount = 0

    // Single-character word timeline
    for (const w of wordTimeline) {
      if (w.endFrame > startFrame && w.startFrame < endFrame) {
        wordCount++
      }
    }

    // Multi-character dialogue lines word timelines
    for (const line of dialogueLines) {
      if (line.endFrame > startFrame && line.startFrame < endFrame) {
        for (const w of line.wordTimeline) {
          // Word positions are relative to dialogue line — offset them
          const absStart = line.startFrame + w.startFrame
          const absEnd = line.startFrame + w.endFrame
          if (absEnd > startFrame && absStart < endFrame) {
            wordCount++
          }
        }
      }
    }

    const segDuration = (endFrame - startFrame) / fps
    const dialogueWps = segDuration > 0 ? wordCount / segDuration : 0

    // --- Keyframe change density ---
    let keyframeChanges = 0
    for (const track of keyframeTracks) {
      for (const kf of track.keyframes) {
        if (kf.frame >= startFrame && kf.frame < endFrame) {
          keyframeChanges++
        }
      }
    }

    // --- Audio presence ---
    const hasAudio =
      wordTimeline.some((w) => w.endFrame > startFrame && w.startFrame < endFrame) ||
      dialogueLines.some((l) => l.endFrame > startFrame && l.startFrame < endFrame) ||
      timelineTracks.some(
        (t) =>
          t.type === 'audio' &&
          t.clips.some((c) => c.endFrame > startFrame && c.startFrame < endFrame)
      )

    // --- Visual presence ---
    const hasVisuals =
      keyframeChanges > 0 ||
      textOverlays.some(
        (t) =>
          t.startFrame <= endFrame &&
          t.endFrame >= startFrame
      ) ||
      shapes.length > 0 ||
      mediaItems.length > 0 ||
      animations.length > 0 ||
      templates.length > 0 ||
      timelineTracks.some(
        (t) =>
          (t.type === 'video' || t.type === 'sprite') &&
          t.clips.some((c) => c.endFrame > startFrame && c.startFrame < endFrame)
      )

    // --- Compute density (0-1 normalized) ---
    // Weighted combination: dialogue (40%), keyframes (40%), presence (20%)
    const wpsNorm = Math.min(dialogueWps / 5.0, 1.0)
    const kfNorm = Math.min(keyframeChanges / (5 * segmentDurationSec), 1.0)
    const presenceNorm = (hasAudio ? 0.5 : 0) + (hasVisuals ? 0.5 : 0)
    const density = wpsNorm * 0.4 + kfNorm * 0.4 + presenceNorm * 0.2

    // --- Rate the segment against the profile ---
    const rating = rateSegment(
      dialogueWps,
      keyframeChanges / segmentDurationSec,
      hasAudio,
      hasVisuals,
      profile
    )

    segments.push({
      startFrame,
      endFrame,
      rating,
      density,
      dialogueWps,
      keyframeChanges,
      hasAudio,
      hasVisuals,
    })

    // Populate heatmap for every frame in this segment
    for (let f = startFrame; f < endFrame; f++) {
      heatmap.set(f, density)
    }
  }

  // -----------------------------------------------------------------------
  // Detect issues
  // -----------------------------------------------------------------------

  const issues: PacingIssue[] = []

  // Gap detection
  let gapStart: number | null = null
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    if (seg.rating === 'empty') {
      if (gapStart === null) gapStart = seg.startFrame
    } else {
      if (gapStart !== null) {
        const gapFrames = seg.startFrame - gapStart
        const gapSec = gapFrames / fps
        if (gapSec > profile.maxGapSeconds) {
          issues.push({
            frame: gapStart,
            type: 'gap',
            suggestion: `Empty gap of ${gapSec.toFixed(1)}s starting here. Add visuals, dialogue, or music to fill this space.`,
            severity: gapSec > profile.maxGapSeconds * 2 ? 'high' : 'medium',
          })
        }
        gapStart = null
      }
    }
  }
  // Handle trailing gap
  if (gapStart !== null) {
    const gapSec = (totalFrames - gapStart) / fps
    if (gapSec > profile.maxGapSeconds) {
      issues.push({
        frame: gapStart,
        type: 'gap',
        suggestion: `Empty gap of ${gapSec.toFixed(1)}s at the end. Consider trimming the timeline or adding a closing element.`,
        severity: 'high',
      })
    }
  }

  // Too-fast / too-slow detection
  for (const seg of segments) {
    const secMark = seg.startFrame / fps

    if (seg.rating === 'fast') {
      issues.push({
        frame: seg.startFrame,
        type: 'too-fast',
        suggestion: `High density at ${secMark.toFixed(1)}s (${seg.dialogueWps.toFixed(1)} words/sec). Slow down dialogue or spread out keyframe changes.`,
        severity: seg.dialogueWps > profile.idealWps[1] * 1.5 ? 'high' : 'medium',
      })
    }

    if (seg.rating === 'slow' && seg.hasAudio) {
      issues.push({
        frame: seg.startFrame,
        type: 'too-slow',
        suggestion: `Low activity at ${secMark.toFixed(1)}s. Add visual changes, text overlays, or keyframe animations to maintain viewer engagement.`,
        severity: 'low',
      })
    }
  }

  // Monotonous detection — check if density barely changes across 5+ consecutive segments
  const MONOTONE_WINDOW = 5
  if (segments.length >= MONOTONE_WINDOW) {
    for (let i = 0; i <= segments.length - MONOTONE_WINDOW; i++) {
      const window = segments.slice(i, i + MONOTONE_WINDOW)
      const densities = window.map((s) => s.density)
      const avg = densities.reduce((a, b) => a + b, 0) / densities.length
      const variance =
        densities.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / densities.length
      if (variance < 0.005 && avg > 0.1) {
        // Low variance = monotonous
        issues.push({
          frame: window[0].startFrame,
          type: 'monotonous',
          suggestion: `Pacing feels flat for ${MONOTONE_WINDOW}+ seconds starting at ${(window[0].startFrame / fps).toFixed(1)}s. Vary the tempo with pauses, transitions, or intensity changes.`,
          severity: 'medium',
        })
        // Skip ahead to avoid duplicate warnings
        i += MONOTONE_WINDOW - 1
      }
    }
  }

  // Emotion variation check
  if (emotionTimeline.length > 0 && totalSeconds > 3) {
    const uniqueEmotions = new Set(emotionTimeline.map((e) => e.emotion))
    const emotionVariation = uniqueEmotions.size / Math.max(emotionTimeline.length, 1)
    if (emotionVariation < profile.minEmotionVariation && emotionTimeline.length > 1) {
      issues.push({
        frame: 0,
        type: 'monotonous',
        suggestion: `Low emotional variation detected. Consider adding more [emotion] cues in your script to create dynamic expression changes.`,
        severity: 'low',
      })
    }
  }

  // -----------------------------------------------------------------------
  // Compute overall score
  // -----------------------------------------------------------------------

  const overallScore = computeOverallScore(segments, issues, profile)

  return {
    overallScore,
    segments,
    issues,
    heatmap,
    profileId,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rateSegment(
  wps: number,
  kfPerSec: number,
  hasAudio: boolean,
  hasVisuals: boolean,
  profile: PacingProfile
): PacingRating {
  // Empty — nothing happening
  if (!hasAudio && !hasVisuals && wps === 0 && kfPerSec === 0) {
    return 'empty'
  }

  // Fast — above ideal ranges
  if (wps > profile.idealWps[1] || kfPerSec > profile.idealKeyframesPerSec[1]) {
    return 'fast'
  }

  // Slow — below ideal ranges (but something exists)
  if (
    wps < profile.idealWps[0] * 0.5 &&
    kfPerSec < profile.idealKeyframesPerSec[0] * 0.5
  ) {
    return 'slow'
  }

  return 'good'
}

function computeOverallScore(
  segments: PacingSegment[],
  issues: PacingIssue[],
  _profile: PacingProfile
): number {
  if (segments.length === 0) return 0

  // Base score: percentage of "good" segments
  const goodCount = segments.filter((s) => s.rating === 'good').length
  const baseScore = (goodCount / segments.length) * 100

  // Penalty for issues
  let penalty = 0
  for (const issue of issues) {
    switch (issue.severity) {
      case 'high':
        penalty += 12
        break
      case 'medium':
        penalty += 6
        break
      case 'low':
        penalty += 2
        break
    }
  }

  // Bonus for variety (a mix of pacing speeds is good for story-driven content)
  const uniqueRatings = new Set(segments.map((s) => s.rating))
  const varietyBonus = uniqueRatings.size >= 3 ? 5 : 0

  return Math.max(0, Math.min(100, Math.round(baseScore - penalty + varietyBonus)))
}
