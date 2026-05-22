/**
 * Platform-Specific Export Optimization Types
 */

export type TargetPlatform = 'tiktok' | 'youtube-shorts' | 'instagram-reels' | 'youtube' | 'instagram-feed' | 'general'

export interface PlatformProfile {
  id: TargetPlatform
  label: string
  /** Optimal aspect ratio */
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3'
  /** Optimal duration range in seconds [min, max] */
  durationRange: [number, number]
  /** Hook window — first N seconds must grab attention */
  hookWindowSeconds: number
  /** Recommended caption style */
  recommendedCaptionStyle: string
  /** Bottom safe zone percentage (0-1) where platform UI overlays appear */
  bottomSafeZone: number
  /** Top safe zone percentage (0-1) */
  topSafeZone: number
  /** Pacing multiplier (1.0 = normal, >1 = faster) */
  pacingMultiplier: number
  /** Where CTA should be placed */
  ctaPlacement: 'beginning' | 'middle' | 'end'
  /** Maximum recommended file size in MB */
  maxFileSizeMB: number
  /** Hashtag strategy */
  hashtagStrategy: 'description' | 'inline' | 'none'
  /** Maximum recommended text on screen */
  maxTextOverlays: number
}

export interface PlatformAdjustment {
  type: 'aspect-ratio' | 'duration' | 'caption-style' | 'safe-zone' | 'pacing' | 'cta' | 'text-count'
  severity: 'info' | 'warning' | 'critical'
  description: string
  /** Whether this adjustment can be auto-applied */
  autoFixable: boolean
}

export interface PlatformFitResult {
  platform: TargetPlatform
  score: number // 0-100
  adjustments: PlatformAdjustment[]
}
