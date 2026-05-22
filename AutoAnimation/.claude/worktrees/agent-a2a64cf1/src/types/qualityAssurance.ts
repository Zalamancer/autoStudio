/**
 * Quality Assurance System Types
 *
 * Defines all types for automated quality checking, scoring,
 * platform compliance, iteration, and A/B variant generation.
 */

import type { SocialPlatform } from './social'
import type { ViralScoreDimensions } from './orchestrator'

// ── Quality Check Categories ──

export type QACheckCategory =
  | 'visual'
  | 'audio'
  | 'content'
  | 'platform'
  | 'accessibility'
  | 'brand'

export type QACheckSeverity = 'critical' | 'warning' | 'info'

export type QACheckStatus = 'pass' | 'fail' | 'warning' | 'skipped'

// ── Individual Check Result ──

export interface QACheckResult {
  /** Unique check identifier */
  id: string
  /** Human-readable check name */
  name: string
  /** Category this check belongs to */
  category: QACheckCategory
  /** Pass/fail/warning status */
  status: QACheckStatus
  /** Severity if not passing */
  severity: QACheckSeverity
  /** Score 0-100 for this specific check */
  score: number
  /** Description of what was checked */
  description: string
  /** Actionable fix suggestion if not passing */
  suggestion?: string
  /** Auto-fixable: can the system automatically resolve this */
  autoFixable: boolean
  /** Auto-fix function identifier (for iteration system) */
  autoFixAction?: string
  /** Additional data for rendering (e.g., overlap regions, contrast ratios) */
  metadata?: Record<string, unknown>
}

// ── Category Score ──

export interface QACategoryScore {
  category: QACheckCategory
  /** Weighted average score 0-100 */
  score: number
  /** Number of checks that passed */
  passed: number
  /** Number of checks that failed */
  failed: number
  /** Number of warnings */
  warnings: number
  /** Individual check results */
  checks: QACheckResult[]
}

// ── Full QA Report ──

export interface QAReport {
  /** Unique report ID */
  id: string
  /** When the report was generated */
  timestamp: number
  /** Overall quality score 0-100 */
  overallScore: number
  /** Letter grade A-F */
  grade: QAGrade
  /** Per-category scores */
  categories: QACategoryScore[]
  /** All individual check results (flattened) */
  allChecks: QACheckResult[]
  /** Critical issues that must be fixed before publishing */
  blockers: QACheckResult[]
  /** Sorted list of actionable improvements */
  improvements: QAImprovement[]
  /** Whether the clip passes minimum quality threshold */
  passesThreshold: boolean
  /** The threshold that was used */
  threshold: number
  /** Platform-specific compliance result */
  platformCompliance: PlatformComplianceResult | null
  /** Virality score dimensions (from existing analyzer) */
  viralityDimensions: ViralScoreDimensions | null
}

export type QAGrade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F'

// ── Improvements ──

export interface QAImprovement {
  /** Related check ID */
  checkId: string
  /** Priority order (lower = more important) */
  priority: number
  /** Human description of the improvement */
  description: string
  /** Estimated score improvement if applied */
  estimatedImpact: number
  /** Whether the system can auto-apply this */
  autoApplicable: boolean
  /** Action identifier for auto-application */
  action?: string
  /** Action payload */
  actionPayload?: Record<string, unknown>
}

// ── Visual Quality ──

export interface VisualQualityInput {
  /** Canvas dimensions */
  canvasWidth: number
  canvasHeight: number
  /** All element bounding boxes on canvas */
  elements: CanvasElementBounds[]
  /** Background color or type */
  backgroundColor: string
  /** Text overlay details */
  textOverlays: TextOverlayInfo[]
  /** Whether captions are enabled */
  hasCaptions: boolean
  /** Caption position */
  captionPosition?: string
  /** Aspect ratio */
  aspectRatio: string
}

export interface CanvasElementBounds {
  id: string
  type: 'character' | 'text' | 'shape' | 'media' | 'template' | 'svg' | 'video' | 'lottie' | 'caption'
  x: number
  y: number
  width: number
  height: number
  /** Frame range this element is visible */
  startFrame: number
  endFrame: number
  /** Z-index / layer order */
  zIndex: number
  /** Opacity at rest */
  opacity: number
}

export interface TextOverlayInfo {
  id: string
  text: string
  fontSize: number
  fontFamily: string
  color: string
  backgroundColor?: string
  x: number
  y: number
  width: number
  height: number
}

// ── Audio Quality ──

export interface AudioQualityInput {
  /** Total clip duration in seconds */
  durationSeconds: number
  /** Dialogue audio segments */
  dialogueSegments: AudioSegment[]
  /** Background music info */
  music: AudioTrackInfo | null
  /** Sound effects */
  soundEffects: AudioSegment[]
  /** Gaps between audio (potential awkward silences) */
  fps: number
}

export interface AudioSegment {
  /** Start time in seconds */
  startTime: number
  /** End time in seconds */
  endTime: number
  /** Average amplitude (0-1) */
  avgAmplitude: number
  /** Peak amplitude (0-1) */
  peakAmplitude: number
  /** Type of audio */
  type: 'dialogue' | 'music' | 'sfx'
}

export interface AudioTrackInfo {
  /** Duration in seconds */
  duration: number
  /** Whether it loops */
  loops: boolean
  /** Relative volume (0-1) */
  volume: number
}

// ── Content Completeness ──

export interface ContentCompletenessInput {
  /** Planned elements from ClipPlan */
  planned: {
    characterCount: number
    dialogueLineCount: number
    textOverlayCount: number
    templateCount: number
    svgObjectCount: number
    mediaCount: number
    hasMusic: boolean
    hasCaptions: boolean
    hasBackground: boolean
  }
  /** Actually rendered/present elements */
  actual: {
    characterCount: number
    dialogueLineCount: number
    textOverlayCount: number
    templateCount: number
    svgObjectCount: number
    mediaCount: number
    hasMusic: boolean
    hasCaptions: boolean
    hasBackground: boolean
    /** Frames with errors or blank content */
    errorFrames: number[]
    /** Total frames */
    totalFrames: number
  }
}

// ── Platform Compliance ──

export interface PlatformSpec {
  platform: SocialPlatform | 'youtube-shorts' | 'reels'
  /** Min/max duration in seconds */
  minDuration: number
  maxDuration: number
  /** Required aspect ratios (empty = any) */
  allowedAspectRatios: string[]
  /** Preferred aspect ratio */
  preferredAspectRatio: string
  /** Safe zone margins (percentage of canvas) */
  safeZone: {
    top: number
    bottom: number
    left: number
    right: number
  }
  /** Max file size in MB */
  maxFileSizeMB: number
  /** Min resolution */
  minWidth: number
  minHeight: number
  /** Max resolution */
  maxWidth: number
  maxHeight: number
  /** Required: has captions */
  requiresCaptions: boolean
  /** Recommended: has CTA */
  recommendsCTA: boolean
  /** Max text coverage percentage */
  maxTextCoverage: number
}

export interface PlatformComplianceResult {
  platform: string
  /** Overall compliance pass/fail */
  compliant: boolean
  /** Individual compliance checks */
  checks: QACheckResult[]
  /** Specific safe zone violations */
  safeZoneViolations: SafeZoneViolation[]
}

export interface SafeZoneViolation {
  elementId: string
  elementType: string
  zone: 'top' | 'bottom' | 'left' | 'right'
  /** How many pixels into the unsafe area */
  overlapPixels: number
}

// ── Quality Gate (for automated iteration) ──

export interface QualityGateConfig {
  /** Minimum overall score to pass (0-100) */
  minimumScore: number
  /** Maximum number of auto-iteration attempts */
  maxIterations: number
  /** Which categories must pass */
  requiredCategories: QACheckCategory[]
  /** Minimum score per category */
  categoryMinScores: Partial<Record<QACheckCategory, number>>
  /** Whether to auto-fix fixable issues */
  autoFix: boolean
  /** Target platform for compliance */
  targetPlatform?: SocialPlatform | 'youtube-shorts' | 'reels'
}

export interface QualityGateResult {
  /** Whether the gate passed */
  passed: boolean
  /** The QA report */
  report: QAReport
  /** Number of iterations performed */
  iterationsPerformed: number
  /** Fixes that were auto-applied */
  appliedFixes: AppliedFix[]
  /** Issues that could not be auto-fixed */
  remainingIssues: QACheckResult[]
}

export interface AppliedFix {
  checkId: string
  action: string
  description: string
  /** Score before fix */
  scoreBefore: number
  /** Score after fix */
  scoreAfter: number
  /** Timestamp */
  timestamp: number
}

// ── A/B Variant Generation ──

export type VariantTreatment =
  | 'color_scheme'
  | 'text_style'
  | 'pacing'
  | 'hook_style'
  | 'caption_style'
  | 'layout'
  | 'transition_style'
  | 'music_mood'

export interface VariantConfig {
  /** Which treatments to vary */
  treatments: VariantTreatment[]
  /** Number of variants to generate (2-5) */
  count: number
  /** Keep original as variant A */
  includeOriginal: boolean
}

export interface GeneratedVariant {
  /** Variant index (0 = original if includeOriginal) */
  index: number
  /** Label (e.g., "Variant A - Bold Colors") */
  label: string
  /** Which treatments were changed */
  appliedTreatments: VariantTreatment[]
  /** Description of what changed */
  changes: string[]
  /** QA score for this variant */
  qaScore: number | null
  /** Viral score for this variant */
  viralScore: number | null
  /** Plan modifications (delta from original) */
  planDelta: Record<string, unknown>
}

// ── Pre-Publish Checklist ──

export interface PrePublishChecklistItem {
  id: string
  label: string
  checked: boolean
  autoChecked: boolean
  category: 'required' | 'recommended' | 'optional'
  description: string
}

export interface PrePublishChecklist {
  items: PrePublishChecklistItem[]
  allRequiredPassed: boolean
  recommendedPassRate: number
  readyToPublish: boolean
}
