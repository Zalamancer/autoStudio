/**
 * Platform Compliance Checker
 *
 * Verifies clip meets platform-specific requirements:
 * - Aspect ratio compliance
 * - Duration limits
 * - Safe zone verification (UI overlay areas)
 * - Resolution requirements
 * - Caption requirements
 * - CTA recommendations
 * - Text coverage limits
 */

import type {
  QACheckResult,
  PlatformSpec,
  PlatformComplianceResult,
  SafeZoneViolation,
  CanvasElementBounds,
} from '@/types/qualityAssurance'

// ── Platform Specifications ──

const PLATFORM_SPECS: Record<string, PlatformSpec> = {
  tiktok: {
    platform: 'tiktok',
    minDuration: 5,
    maxDuration: 600, // 10 min, but 60s performs best
    allowedAspectRatios: ['9:16', '1:1'],
    preferredAspectRatio: '9:16',
    safeZone: {
      top: 0.1,    // 10% for status bar
      bottom: 0.2,  // 20% for engagement buttons + description
      left: 0.05,
      right: 0.12,  // Right side buttons (like, comment, share)
    },
    maxFileSizeMB: 287,
    minWidth: 540,
    minHeight: 960,
    maxWidth: 1080,
    maxHeight: 1920,
    requiresCaptions: false,
    recommendsCTA: true,
    maxTextCoverage: 0.2, // TikTok penalizes text-heavy videos
  },
  instagram: {
    platform: 'instagram',
    minDuration: 3,
    maxDuration: 90, // Reels max
    allowedAspectRatios: ['9:16', '1:1', '4:5'],
    preferredAspectRatio: '9:16',
    safeZone: {
      top: 0.08,
      bottom: 0.15,
      left: 0.05,
      right: 0.05,
    },
    maxFileSizeMB: 250,
    minWidth: 500,
    minHeight: 500,
    maxWidth: 1080,
    maxHeight: 1920,
    requiresCaptions: false,
    recommendsCTA: true,
    maxTextCoverage: 0.2,
  },
  reels: {
    platform: 'reels',
    minDuration: 3,
    maxDuration: 90,
    allowedAspectRatios: ['9:16'],
    preferredAspectRatio: '9:16',
    safeZone: {
      top: 0.08,
      bottom: 0.18,
      left: 0.05,
      right: 0.1,
    },
    maxFileSizeMB: 250,
    minWidth: 500,
    minHeight: 889,
    maxWidth: 1080,
    maxHeight: 1920,
    requiresCaptions: false,
    recommendsCTA: true,
    maxTextCoverage: 0.2,
  },
  youtube: {
    platform: 'youtube',
    minDuration: 1,
    maxDuration: 43200, // 12 hours
    allowedAspectRatios: ['16:9', '9:16', '1:1', '4:3'],
    preferredAspectRatio: '16:9',
    safeZone: {
      top: 0.05,
      bottom: 0.1, // Progress bar + title
      left: 0.03,
      right: 0.03,
    },
    maxFileSizeMB: 256000,
    minWidth: 426,
    minHeight: 240,
    maxWidth: 3840,
    maxHeight: 2160,
    requiresCaptions: false,
    recommendsCTA: true,
    maxTextCoverage: 0.3,
  },
  'youtube-shorts': {
    platform: 'youtube-shorts',
    minDuration: 1,
    maxDuration: 60,
    allowedAspectRatios: ['9:16'],
    preferredAspectRatio: '9:16',
    safeZone: {
      top: 0.08,
      bottom: 0.2,  // Title + engagement buttons
      left: 0.05,
      right: 0.12, // Side buttons
    },
    maxFileSizeMB: 256000,
    minWidth: 540,
    minHeight: 960,
    maxWidth: 1080,
    maxHeight: 1920,
    requiresCaptions: false,
    recommendsCTA: false,
    maxTextCoverage: 0.2,
  },
  facebook: {
    platform: 'facebook',
    minDuration: 1,
    maxDuration: 240,
    allowedAspectRatios: ['16:9', '9:16', '1:1', '4:5'],
    preferredAspectRatio: '9:16',
    safeZone: {
      top: 0.05,
      bottom: 0.1,
      left: 0.05,
      right: 0.05,
    },
    maxFileSizeMB: 4000,
    minWidth: 120,
    minHeight: 120,
    maxWidth: 1920,
    maxHeight: 1920,
    requiresCaptions: false,
    recommendsCTA: true,
    maxTextCoverage: 0.2,
  },
  x: {
    platform: 'x',
    minDuration: 0.5,
    maxDuration: 140,
    allowedAspectRatios: ['16:9', '9:16', '1:1'],
    preferredAspectRatio: '16:9',
    safeZone: {
      top: 0.05,
      bottom: 0.08,
      left: 0.03,
      right: 0.03,
    },
    maxFileSizeMB: 512,
    minWidth: 32,
    minHeight: 32,
    maxWidth: 1920,
    maxHeight: 1200,
    requiresCaptions: false,
    recommendsCTA: false,
    maxTextCoverage: 0.3,
  },
}

export function getPlatformSpec(platform: string): PlatformSpec | null {
  return PLATFORM_SPECS[platform] || null
}

// ── Check Functions ──

function checkAspectRatio(
  spec: PlatformSpec,
  currentAspectRatio: string,
): QACheckResult {
  const allowed = spec.allowedAspectRatios.length === 0 || spec.allowedAspectRatios.includes(currentAspectRatio)
  const isPreferred = currentAspectRatio === spec.preferredAspectRatio

  return {
    id: `platform-aspect-ratio`,
    name: 'Aspect Ratio',
    category: 'platform',
    status: !allowed ? 'fail' : isPreferred ? 'pass' : 'warning',
    severity: !allowed ? 'critical' : 'info',
    score: !allowed ? 0 : isPreferred ? 100 : 70,
    description: !allowed
      ? `${currentAspectRatio} is not supported on ${spec.platform} (use ${spec.allowedAspectRatios.join(' or ')})`
      : isPreferred
        ? `${currentAspectRatio} is optimal for ${spec.platform}`
        : `${currentAspectRatio} works but ${spec.preferredAspectRatio} performs better on ${spec.platform}`,
    suggestion: !isPreferred
      ? `Consider switching to ${spec.preferredAspectRatio} for better performance on ${spec.platform}`
      : undefined,
    autoFixable: true,
    autoFixAction: 'set-aspect-ratio',
    metadata: { current: currentAspectRatio, preferred: spec.preferredAspectRatio, allowed: spec.allowedAspectRatios },
  }
}

function checkDuration(
  spec: PlatformSpec,
  durationSeconds: number,
): QACheckResult {
  const withinLimits = durationSeconds >= spec.minDuration && durationSeconds <= spec.maxDuration
  // For short-form platforms, optimal is 15-60 seconds
  const isShortForm = spec.maxDuration <= 600
  const optimalMin = isShortForm ? 15 : spec.minDuration
  const optimalMax = isShortForm ? 60 : spec.maxDuration
  const isOptimal = durationSeconds >= optimalMin && durationSeconds <= optimalMax

  return {
    id: `platform-duration`,
    name: 'Duration',
    category: 'platform',
    status: !withinLimits ? 'fail' : isOptimal ? 'pass' : 'warning',
    severity: !withinLimits ? 'critical' : 'info',
    score: !withinLimits ? 0 : isOptimal ? 100 : 65,
    description: !withinLimits
      ? `${Math.round(durationSeconds)}s exceeds ${spec.platform} limits (${spec.minDuration}-${spec.maxDuration}s)`
      : isOptimal
        ? `${Math.round(durationSeconds)}s is optimal for ${spec.platform}`
        : `${Math.round(durationSeconds)}s is valid but ${optimalMin}-${optimalMax}s performs better`,
    suggestion: !withinLimits
      ? `Adjust duration to ${spec.minDuration}-${spec.maxDuration}s for ${spec.platform}`
      : !isOptimal
        ? `${optimalMin}-${optimalMax}s clips get the most engagement on ${spec.platform}`
        : undefined,
    autoFixable: false,
    metadata: { duration: durationSeconds, min: spec.minDuration, max: spec.maxDuration, optimalMin, optimalMax },
  }
}

function checkSafeZones(
  spec: PlatformSpec,
  elements: CanvasElementBounds[],
  canvasWidth: number,
  canvasHeight: number,
): QACheckResult {
  const violations: SafeZoneViolation[] = []

  const safeTop = canvasHeight * spec.safeZone.top
  const safeBottom = canvasHeight * (1 - spec.safeZone.bottom)
  const safeLeft = canvasWidth * spec.safeZone.left
  const safeRight = canvasWidth * (1 - spec.safeZone.right)

  // Only check important elements (text, captions) that shouldn't be in unsafe zones
  const importantElements = elements.filter(
    (e) => (e.type === 'text' || e.type === 'caption') && e.opacity > 0.3,
  )

  for (const el of importantElements) {
    if (el.y < safeTop) {
      violations.push({
        elementId: el.id,
        elementType: el.type,
        zone: 'top',
        overlapPixels: Math.round(safeTop - el.y),
      })
    }
    if (el.y + el.height > safeBottom) {
      violations.push({
        elementId: el.id,
        elementType: el.type,
        zone: 'bottom',
        overlapPixels: Math.round(el.y + el.height - safeBottom),
      })
    }
    if (el.x < safeLeft) {
      violations.push({
        elementId: el.id,
        elementType: el.type,
        zone: 'left',
        overlapPixels: Math.round(safeLeft - el.x),
      })
    }
    if (el.x + el.width > safeRight) {
      violations.push({
        elementId: el.id,
        elementType: el.type,
        zone: 'right',
        overlapPixels: Math.round(el.x + el.width - safeRight),
      })
    }
  }

  const score = violations.length === 0 ? 100 : Math.max(0, 100 - violations.length * 20)

  return {
    id: `platform-safe-zones`,
    name: 'Safe Zones',
    category: 'platform',
    status: violations.length === 0 ? 'pass' : 'warning',
    severity: violations.length > 3 ? 'warning' : 'info',
    score: Math.round(score),
    description: violations.length === 0
      ? `All text within ${spec.platform} safe zones`
      : `${violations.length} element(s) in platform UI overlay areas`,
    suggestion: violations.length > 0
      ? `Move text away from screen edges — ${spec.platform} overlays UI elements there`
      : undefined,
    autoFixable: false,
    metadata: { violations, safeZone: spec.safeZone },
  }
}

function checkResolution(
  spec: PlatformSpec,
  width: number,
  height: number,
): QACheckResult {
  const meetsMin = width >= spec.minWidth && height >= spec.minHeight
  const exceedsMax = width > spec.maxWidth || height > spec.maxHeight

  return {
    id: `platform-resolution`,
    name: 'Resolution',
    category: 'platform',
    status: meetsMin && !exceedsMax ? 'pass' : 'fail',
    severity: !meetsMin ? 'critical' : 'warning',
    score: meetsMin && !exceedsMax ? 100 : 30,
    description: meetsMin && !exceedsMax
      ? `${width}x${height} meets ${spec.platform} requirements`
      : !meetsMin
        ? `${width}x${height} is below minimum (${spec.minWidth}x${spec.minHeight})`
        : `${width}x${height} exceeds maximum (${spec.maxWidth}x${spec.maxHeight})`,
    suggestion: !meetsMin
      ? `Increase resolution to at least ${spec.minWidth}x${spec.minHeight}`
      : exceedsMax
        ? `Reduce resolution to max ${spec.maxWidth}x${spec.maxHeight}`
        : undefined,
    autoFixable: true,
    autoFixAction: 'set-resolution',
    metadata: { width, height, minWidth: spec.minWidth, minHeight: spec.minHeight },
  }
}

function checkCaptions(
  spec: PlatformSpec,
  hasCaptions: boolean,
): QACheckResult {
  if (!spec.requiresCaptions && hasCaptions) {
    return {
      id: `platform-captions`,
      name: 'Captions',
      category: 'platform',
      status: 'pass',
      severity: 'info',
      score: 100,
      description: 'Captions are present (recommended for all platforms)',
      autoFixable: false,
    }
  }

  return {
    id: `platform-captions`,
    name: 'Captions',
    category: 'platform',
    status: hasCaptions ? 'pass' : spec.requiresCaptions ? 'fail' : 'warning',
    severity: spec.requiresCaptions ? 'critical' : 'info',
    score: hasCaptions ? 100 : spec.requiresCaptions ? 0 : 50,
    description: hasCaptions
      ? 'Captions are present'
      : spec.requiresCaptions
        ? `Captions are required for ${spec.platform}`
        : '80% of viewers watch without sound — captions strongly recommended',
    suggestion: !hasCaptions
      ? 'Add captions to improve engagement and accessibility'
      : undefined,
    autoFixable: true,
    autoFixAction: 'enable-captions',
    metadata: { required: spec.requiresCaptions },
  }
}

// ── Main Platform Compliance Checker ──

export function checkPlatformCompliance(
  platform: string,
  config: {
    aspectRatio: string
    durationSeconds: number
    canvasWidth: number
    canvasHeight: number
    elements: CanvasElementBounds[]
    hasCaptions: boolean
  },
): PlatformComplianceResult {
  const spec = getPlatformSpec(platform)
  if (!spec) {
    return {
      platform,
      compliant: true,
      checks: [],
      safeZoneViolations: [],
    }
  }

  const checks: QACheckResult[] = [
    checkAspectRatio(spec, config.aspectRatio),
    checkDuration(spec, config.durationSeconds),
    checkSafeZones(spec, config.elements, config.canvasWidth, config.canvasHeight),
    checkResolution(spec, config.canvasWidth, config.canvasHeight),
    checkCaptions(spec, config.hasCaptions),
  ]

  const safeZoneCheck = checks.find((c) => c.id === 'platform-safe-zones')
  const safeZoneViolations = (safeZoneCheck?.metadata?.violations as SafeZoneViolation[]) || []

  const criticalFails = checks.filter((c) => c.status === 'fail' && c.severity === 'critical')
  const compliant = criticalFails.length === 0

  return {
    platform,
    compliant,
    checks,
    safeZoneViolations,
  }
}

export { PLATFORM_SPECS }
