/**
 * Content Completeness Verifier
 *
 * Checks whether all planned elements were actually rendered:
 * - Character count matches plan
 * - All dialogue lines have audio
 * - Text overlays rendered
 * - Templates loaded
 * - SVG objects present
 * - Media items loaded
 * - No blank/error frames
 */

import type {
  QACheckResult,
  ContentCompletenessInput,
} from '@/types/qualityAssurance'

function checkElementMatch(
  id: string,
  name: string,
  plannedCount: number,
  actualCount: number,
  importance: 'critical' | 'warning',
): QACheckResult {
  const match = actualCount >= plannedCount
  const ratio = plannedCount > 0 ? actualCount / plannedCount : 1

  return {
    id,
    name,
    category: 'content',
    status: match ? 'pass' : 'fail',
    severity: importance,
    score: Math.round(ratio * 100),
    description: match
      ? `All ${plannedCount} planned ${name.toLowerCase()} present`
      : `${actualCount}/${plannedCount} ${name.toLowerCase()} rendered`,
    suggestion: !match
      ? `${plannedCount - actualCount} planned ${name.toLowerCase()} failed to render — check for errors`
      : undefined,
    autoFixable: false,
    metadata: { planned: plannedCount, actual: actualCount },
  }
}

function checkBooleanMatch(
  id: string,
  name: string,
  planned: boolean,
  actual: boolean,
  importance: 'critical' | 'warning',
): QACheckResult {
  if (!planned) {
    return {
      id,
      name,
      category: 'content',
      status: 'skipped',
      severity: 'info',
      score: 100,
      description: `${name} was not planned`,
      autoFixable: false,
    }
  }

  return {
    id,
    name,
    category: 'content',
    status: actual ? 'pass' : 'fail',
    severity: importance,
    score: actual ? 100 : 0,
    description: actual ? `${name} is present` : `${name} was planned but is missing`,
    suggestion: !actual ? `${name} failed to load — check configuration` : undefined,
    autoFixable: false,
  }
}

function checkErrorFrames(input: ContentCompletenessInput): QACheckResult {
  const { errorFrames, totalFrames } = input.actual
  if (totalFrames === 0) {
    return {
      id: 'content-error-frames',
      name: 'Frame Integrity',
      category: 'content',
      status: 'skipped',
      severity: 'info',
      score: 100,
      description: 'No frames to check',
      autoFixable: false,
    }
  }

  const errorRate = errorFrames.length / totalFrames
  const score = Math.round((1 - errorRate) * 100)

  return {
    id: 'content-error-frames',
    name: 'Frame Integrity',
    category: 'content',
    status: errorFrames.length === 0 ? 'pass' : errorRate > 0.05 ? 'fail' : 'warning',
    severity: errorRate > 0.05 ? 'critical' : 'warning',
    score,
    description: errorFrames.length === 0
      ? 'All frames rendered successfully'
      : `${errorFrames.length}/${totalFrames} frames have errors (${Math.round(errorRate * 100)}%)`,
    suggestion: errorFrames.length > 0
      ? 'Some frames failed to render — check element loading and image URLs'
      : undefined,
    autoFixable: false,
    metadata: { errorFrameCount: errorFrames.length, totalFrames, errorRate },
  }
}

// ── Main Content Completeness Scorer ──

export function scoreContentCompleteness(input: ContentCompletenessInput): QACheckResult[] {
  const { planned, actual } = input
  const checks: QACheckResult[] = []

  // Element count matches
  if (planned.characterCount > 0) {
    checks.push(checkElementMatch('content-characters', 'Characters', planned.characterCount, actual.characterCount, 'critical'))
  }
  if (planned.dialogueLineCount > 0) {
    checks.push(checkElementMatch('content-dialogue', 'Dialogue Lines', planned.dialogueLineCount, actual.dialogueLineCount, 'critical'))
  }
  if (planned.textOverlayCount > 0) {
    checks.push(checkElementMatch('content-text-overlays', 'Text Overlays', planned.textOverlayCount, actual.textOverlayCount, 'warning'))
  }
  if (planned.templateCount > 0) {
    checks.push(checkElementMatch('content-templates', 'HTML Templates', planned.templateCount, actual.templateCount, 'warning'))
  }
  if (planned.svgObjectCount > 0) {
    checks.push(checkElementMatch('content-svg', 'SVG Objects', planned.svgObjectCount, actual.svgObjectCount, 'warning'))
  }
  if (planned.mediaCount > 0) {
    checks.push(checkElementMatch('content-media', 'Stock Media', planned.mediaCount, actual.mediaCount, 'warning'))
  }

  // Boolean flags
  checks.push(checkBooleanMatch('content-music', 'Background Music', planned.hasMusic, actual.hasMusic, 'warning'))
  checks.push(checkBooleanMatch('content-captions', 'Captions', planned.hasCaptions, actual.hasCaptions, 'warning'))
  checks.push(checkBooleanMatch('content-background', 'Background', planned.hasBackground, actual.hasBackground, 'warning'))

  // Frame integrity
  checks.push(checkErrorFrames(input))

  return checks
}
