/**
 * Platform-Specific Export Optimization
 *
 * Defines per-platform rules and provides analysis + auto-apply transforms
 * for TikTok, YouTube Shorts, Instagram Reels, YouTube, Instagram Feed.
 */

import type {
  TargetPlatform,
  PlatformProfile,
  PlatformAdjustment,
  PlatformFitResult,
} from '@/types/platformOptimization'
import type { CaptionStyle } from '@/types/voice'

// ── Platform Profiles ──

export const PLATFORM_PROFILES: Record<TargetPlatform, PlatformProfile> = {
  tiktok: {
    id: 'tiktok',
    label: 'TikTok',
    aspectRatio: '9:16',
    durationRange: [15, 60],
    hookWindowSeconds: 3,
    recommendedCaptionStyle: 'animated-pop',
    bottomSafeZone: 0.20,
    topSafeZone: 0.05,
    pacingMultiplier: 1.15,
    ctaPlacement: 'end',
    maxFileSizeMB: 287,
    hashtagStrategy: 'description',
    maxTextOverlays: 3,
  },
  'youtube-shorts': {
    id: 'youtube-shorts',
    label: 'YouTube Shorts',
    aspectRatio: '9:16',
    durationRange: [30, 60],
    hookWindowSeconds: 5,
    recommendedCaptionStyle: 'animated-glow',
    bottomSafeZone: 0.15,
    topSafeZone: 0.05,
    pacingMultiplier: 1.0,
    ctaPlacement: 'end',
    maxFileSizeMB: 256,
    hashtagStrategy: 'description',
    maxTextOverlays: 4,
  },
  'instagram-reels': {
    id: 'instagram-reels',
    label: 'Instagram Reels',
    aspectRatio: '9:16',
    durationRange: [15, 90],
    hookWindowSeconds: 3,
    recommendedCaptionStyle: 'animated-bounce',
    bottomSafeZone: 0.20,
    topSafeZone: 0.05,
    pacingMultiplier: 1.1,
    ctaPlacement: 'middle',
    maxFileSizeMB: 250,
    hashtagStrategy: 'inline',
    maxTextOverlays: 3,
  },
  youtube: {
    id: 'youtube',
    label: 'YouTube',
    aspectRatio: '16:9',
    durationRange: [60, 600],
    hookWindowSeconds: 5,
    recommendedCaptionStyle: 'sentence',
    bottomSafeZone: 0.10,
    topSafeZone: 0.05,
    pacingMultiplier: 1.0,
    ctaPlacement: 'end',
    maxFileSizeMB: 12288,
    hashtagStrategy: 'description',
    maxTextOverlays: 5,
  },
  'instagram-feed': {
    id: 'instagram-feed',
    label: 'Instagram Feed',
    aspectRatio: '1:1',
    durationRange: [15, 60],
    hookWindowSeconds: 3,
    recommendedCaptionStyle: 'karaoke',
    bottomSafeZone: 0.10,
    topSafeZone: 0.05,
    pacingMultiplier: 1.0,
    ctaPlacement: 'middle',
    maxFileSizeMB: 250,
    hashtagStrategy: 'inline',
    maxTextOverlays: 2,
  },
  general: {
    id: 'general',
    label: 'General',
    aspectRatio: '16:9',
    durationRange: [5, 600],
    hookWindowSeconds: 5,
    recommendedCaptionStyle: 'word-by-word',
    bottomSafeZone: 0.05,
    topSafeZone: 0.05,
    pacingMultiplier: 1.0,
    ctaPlacement: 'end',
    maxFileSizeMB: 1024,
    hashtagStrategy: 'none',
    maxTextOverlays: 10,
  },
}

// ── Analysis ──

interface AnalysisInput {
  aspectRatio: string
  durationSeconds: number
  captionStyle: CaptionStyle
  captionPosition: 'top' | 'center' | 'bottom'
  textOverlayCount: number
  /** Positions of text overlays as fraction of canvas height (0-1) */
  textOverlayPositions: number[]
  /** Whether there's a CTA text overlay */
  hasCTA: boolean
  /** Where the CTA is positioned as fraction of duration (0-1) */
  ctaTimeFraction?: number
}

/**
 * Analyze how well the current composition fits a target platform.
 * Returns a score 0-100 and a list of specific adjustments needed.
 */
export function analyzePlatformFit(
  platform: TargetPlatform,
  input: AnalysisInput,
): PlatformFitResult {
  const profile = PLATFORM_PROFILES[platform]
  const adjustments: PlatformAdjustment[] = []
  let score = 100

  // Check aspect ratio
  if (input.aspectRatio !== profile.aspectRatio) {
    score -= 25
    adjustments.push({
      type: 'aspect-ratio',
      severity: 'critical',
      description: `${profile.label} requires ${profile.aspectRatio} aspect ratio (current: ${input.aspectRatio})`,
      autoFixable: false, // aspect ratio change is destructive
    })
  }

  // Check duration
  const [minDuration, maxDuration] = profile.durationRange
  if (input.durationSeconds < minDuration) {
    score -= 15
    adjustments.push({
      type: 'duration',
      severity: 'warning',
      description: `Video is too short for ${profile.label} (${input.durationSeconds}s, min: ${minDuration}s)`,
      autoFixable: false,
    })
  } else if (input.durationSeconds > maxDuration) {
    score -= 20
    adjustments.push({
      type: 'duration',
      severity: 'critical',
      description: `Video exceeds ${profile.label} optimal length (${input.durationSeconds}s, max: ${maxDuration}s)`,
      autoFixable: false,
    })
  }

  // Check caption style
  if (input.captionStyle !== profile.recommendedCaptionStyle) {
    score -= 10
    adjustments.push({
      type: 'caption-style',
      severity: 'info',
      description: `${profile.label} performs best with "${profile.recommendedCaptionStyle}" captions (current: "${input.captionStyle}")`,
      autoFixable: true,
    })
  }

  // Check safe zones — text overlays in bottom danger zone
  const unsafeTexts = input.textOverlayPositions.filter(
    (pos) => pos > (1 - profile.bottomSafeZone)
  )
  if (unsafeTexts.length > 0) {
    score -= 15
    adjustments.push({
      type: 'safe-zone',
      severity: 'warning',
      description: `${unsafeTexts.length} text overlay(s) in ${profile.label}'s bottom safe zone (${Math.round(profile.bottomSafeZone * 100)}% from bottom)`,
      autoFixable: true,
    })
  }

  // Check caption position vs safe zone
  if (input.captionPosition === 'bottom' && profile.bottomSafeZone > 0.15) {
    score -= 5
    adjustments.push({
      type: 'safe-zone',
      severity: 'info',
      description: `Captions at bottom may overlap ${profile.label} UI. Consider "center" position.`,
      autoFixable: true,
    })
  }

  // Check text overlay count
  if (input.textOverlayCount > profile.maxTextOverlays) {
    score -= 10
    adjustments.push({
      type: 'text-count',
      severity: 'warning',
      description: `Too many text overlays for ${profile.label} (${input.textOverlayCount}, max: ${profile.maxTextOverlays})`,
      autoFixable: false,
    })
  }

  // Check CTA placement
  if (input.hasCTA && input.ctaTimeFraction !== undefined) {
    const expectedPlacement = profile.ctaPlacement
    const actualPlacement = input.ctaTimeFraction < 0.33 ? 'beginning'
      : input.ctaTimeFraction < 0.66 ? 'middle' : 'end'

    if (actualPlacement !== expectedPlacement) {
      score -= 5
      adjustments.push({
        type: 'cta',
        severity: 'info',
        description: `${profile.label} CTAs perform best at ${expectedPlacement} (current: ${actualPlacement})`,
        autoFixable: false,
      })
    }
  }

  return {
    platform,
    score: Math.max(0, score),
    adjustments,
  }
}

/**
 * Auto-apply platform optimizations that are safe to apply.
 * Returns the list of changes that were applied.
 */
export function getAutoFixActions(
  platform: TargetPlatform,
  fitResult: PlatformFitResult,
): Array<{ type: string; action: string }> {
  const profile = PLATFORM_PROFILES[platform]
  const actions: Array<{ type: string; action: string }> = []

  for (const adj of fitResult.adjustments) {
    if (!adj.autoFixable) continue

    switch (adj.type) {
      case 'caption-style':
        actions.push({
          type: 'caption-style',
          action: `Set caption style to "${profile.recommendedCaptionStyle}"`,
        })
        break
      case 'safe-zone':
        if (adj.description.includes('Captions at bottom')) {
          actions.push({
            type: 'caption-position',
            action: 'Move captions to center position',
          })
        } else {
          actions.push({
            type: 'text-reposition',
            action: `Reposition text overlays above ${Math.round(profile.bottomSafeZone * 100)}% safe zone`,
          })
        }
        break
    }
  }

  return actions
}

/**
 * Get a color for the fitness score badge.
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return '#4ade80' // green
  if (score >= 60) return '#facc15' // yellow
  if (score >= 40) return '#fb923c' // orange
  return '#f87171' // red
}

/**
 * Get the score label text.
 */
export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 80) return 'Good'
  if (score >= 60) return 'Fair'
  if (score >= 40) return 'Needs Work'
  return 'Poor'
}
