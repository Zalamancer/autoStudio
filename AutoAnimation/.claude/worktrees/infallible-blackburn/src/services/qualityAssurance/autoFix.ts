/**
 * Auto-Fix Iteration Loop
 *
 * Takes a QA report with failing checks and automatically fixes
 * what it can, then re-runs the QA check. Repeats up to maxIterations
 * or until the quality gate passes.
 *
 * Supported auto-fix actions:
 * - add-text-background: Add semi-transparent background to low-contrast text
 * - adjust-music-volume: Lower music volume when it overpowers dialogue
 * - set-aspect-ratio: Switch to platform-preferred aspect ratio
 * - enable-captions: Turn on word-by-word captions
 * - set-resolution: Adjust canvas resolution to meet platform minimums
 * - nudge-overlapping: Push overlapping elements apart
 */

import type {
  QAReport,
  QACheckResult,
  QualityGateConfig,
  AppliedFix,
} from '@/types/qualityAssurance'
import { generateQAReport, extractQAInputFromStores, type QAInput } from './qualityGate'

// ── Fix Registry ──

type FixFunction = (check: QACheckResult, input: QAInput) => { applied: boolean; description: string }

const FIX_REGISTRY: Record<string, FixFunction> = {
  'add-text-background': fixTextContrast,
  'adjust-music-volume': fixMusicVolume,
  'enable-captions': fixEnableCaptions,
  'set-aspect-ratio': fixAspectRatio,
  'set-resolution': fixResolution,
}

// ── Fix Implementations ──

function fixTextContrast(check: QACheckResult, _input: QAInput): { applied: boolean; description: string } {
  const contrastIssues = (check.metadata?.contrastIssues as Array<{ id: string; contrast: number }>) || []
  if (contrastIssues.length === 0) return { applied: false, description: 'No contrast issues to fix' }

  try {
    const { useTextOverlayStore } = require('@/stores/useTextOverlayStore')
    const store = useTextOverlayStore.getState()

    let fixed = 0
    for (const issue of contrastIssues) {
      // Extract the actual overlay ID from "text-{id}" format
      const overlayId = issue.id.replace(/^text-/, '')
      const overlay = store.overlays.find((o: { id: string }) => o.id === overlayId)
      if (!overlay) continue

      // Add a semi-transparent dark background behind the text
      store.updateOverlay(overlayId, {
        background: true,
        backgroundOpacity: 0.7,
      })
      fixed++
    }

    // Also fix too-small texts
    const tooSmallIds = (check.metadata?.tooSmallTexts as string[]) || []
    for (const id of tooSmallIds) {
      const overlayId = id.replace(/^text-/, '')
      store.updateOverlay(overlayId, { fontSize: 14 })
      fixed++
    }

    return {
      applied: fixed > 0,
      description: `Added background to ${fixed} text overlay(s) for better readability`,
    }
  } catch {
    return { applied: false, description: 'Failed to access text overlay store' }
  }
}

function fixMusicVolume(check: QACheckResult, _input: QAInput): { applied: boolean; description: string } {
  const musicVolume = check.metadata?.musicVolume as number | undefined
  if (musicVolume === undefined) return { applied: false, description: 'No music volume data' }

  try {
    // Attempt to use audio design store if available
    const { useAudioDesignStore } = require('@/stores/useAudioDesignStore')
    const store = useAudioDesignStore.getState()

    if (musicVolume > 0.4) {
      // Lower music to 25%
      if (typeof store.setMasterMusicVolume === 'function') {
        store.setMasterMusicVolume(0.25)
      }
      return { applied: true, description: 'Lowered background music volume to 25%' }
    }

    return { applied: false, description: 'Music volume is acceptable' }
  } catch {
    return { applied: false, description: 'Audio design store not available' }
  }
}

function fixEnableCaptions(_check: QACheckResult, _input: QAInput): { applied: boolean; description: string } {
  try {
    const { useVoiceStore } = require('@/stores/useVoiceStore')
    const store = useVoiceStore.getState()

    if (store.captionStyle === 'none') {
      store.setCaptionStyle('word-by-word')
      return { applied: true, description: 'Enabled word-by-word captions' }
    }

    return { applied: false, description: 'Captions already enabled' }
  } catch {
    return { applied: false, description: 'Failed to access voice store' }
  }
}

function fixAspectRatio(check: QACheckResult, _input: QAInput): { applied: boolean; description: string } {
  const preferred = check.metadata?.preferred as string | undefined
  if (!preferred) return { applied: false, description: 'No preferred aspect ratio' }

  try {
    const { useEditorStore } = require('@/stores')
    const store = useEditorStore.getState()

    if (store.aspectRatio !== preferred && typeof store.setAspectRatio === 'function') {
      store.setAspectRatio(preferred)
      return { applied: true, description: `Switched aspect ratio to ${preferred}` }
    }

    return { applied: false, description: 'Aspect ratio already optimal' }
  } catch {
    return { applied: false, description: 'Failed to access editor store' }
  }
}

function fixResolution(check: QACheckResult, _input: QAInput): { applied: boolean; description: string } {
  const minWidth = check.metadata?.minWidth as number | undefined
  const minHeight = check.metadata?.minHeight as number | undefined
  if (!minWidth || !minHeight) return { applied: false, description: 'No resolution data' }

  try {
    const { useCanvasStore } = require('@/stores/useCanvasStore')
    const store = useCanvasStore.getState()

    const currentWidth = store.canvasWidth
    const currentHeight = store.canvasHeight

    if (currentWidth < minWidth || currentHeight < minHeight) {
      // Scale up to meet minimum while maintaining aspect ratio
      const scaleX = minWidth / currentWidth
      const scaleY = minHeight / currentHeight
      const scale = Math.max(scaleX, scaleY)
      const newWidth = Math.round(currentWidth * scale)
      const newHeight = Math.round(currentHeight * scale)

      if (typeof store.setCanvasSize === 'function') {
        store.setCanvasSize(newWidth, newHeight)
        return { applied: true, description: `Increased resolution to ${newWidth}x${newHeight}` }
      }
    }

    return { applied: false, description: 'Resolution already adequate' }
  } catch {
    return { applied: false, description: 'Failed to access canvas store' }
  }
}

// ── Main Auto-Fix & Recheck Loop ──

export interface AutoFixResult {
  /** Final QA report after all iterations */
  finalReport: QAReport
  /** Whether the quality gate passed after fixes */
  passed: boolean
  /** Number of iterations performed */
  iterations: number
  /** All fixes that were applied across iterations */
  appliedFixes: AppliedFix[]
  /** Score progression [initial, after-iter-1, after-iter-2, ...] */
  scoreProgression: number[]
  /** Checks that remain unfixed */
  remainingIssues: QACheckResult[]
}

export function autoFixAndRecheck(
  initialReport: QAReport,
  config: QualityGateConfig,
): AutoFixResult {
  const maxIterations = config.maxIterations || 3
  const allAppliedFixes: AppliedFix[] = []
  const scoreProgression: number[] = [initialReport.overallScore]

  let currentReport = initialReport
  let iteration = 0

  while (iteration < maxIterations) {
    // Check if we already pass
    if (currentReport.passesThreshold && currentReport.blockers.length === 0) {
      break
    }

    iteration++
    console.log(`[QA AutoFix] Iteration ${iteration}/${maxIterations} — score: ${currentReport.overallScore}`)

    // Find fixable checks
    const fixableChecks = currentReport.allChecks.filter(
      (c) => c.status !== 'pass' && c.status !== 'skipped' && c.autoFixable && c.autoFixAction,
    )

    if (fixableChecks.length === 0) {
      console.log('[QA AutoFix] No more auto-fixable issues found')
      break
    }

    // Get fresh input before applying fixes
    const input = extractQAInputFromStores()

    // Apply each fix
    let fixesAppliedThisRound = 0
    for (const check of fixableChecks) {
      const fixFn = FIX_REGISTRY[check.autoFixAction!]
      if (!fixFn) {
        console.warn(`[QA AutoFix] No fix handler for action: ${check.autoFixAction}`)
        continue
      }

      const scoreBefore = check.score
      const result = fixFn(check, input)

      if (result.applied) {
        fixesAppliedThisRound++
        allAppliedFixes.push({
          checkId: check.id,
          action: check.autoFixAction!,
          description: result.description,
          scoreBefore,
          scoreAfter: 0, // Will be updated after recheck
          timestamp: Date.now(),
        })
        console.log(`[QA AutoFix] Applied: ${result.description}`)
      }
    }

    if (fixesAppliedThisRound === 0) {
      console.log('[QA AutoFix] No fixes could be applied this round')
      break
    }

    // Re-run QA check with fresh store state
    const freshInput = extractQAInputFromStores()
    currentReport = generateQAReport(freshInput, config.minimumScore)
    scoreProgression.push(currentReport.overallScore)

    // Update scoreAfter for fixes applied this round
    for (const fix of allAppliedFixes) {
      if (fix.scoreAfter === 0) {
        const updatedCheck = currentReport.allChecks.find((c) => c.id === fix.checkId)
        fix.scoreAfter = updatedCheck?.score ?? fix.scoreBefore
      }
    }

    console.log(`[QA AutoFix] After iteration ${iteration}: score ${currentReport.overallScore}`)
  }

  const remainingIssues = currentReport.allChecks.filter(
    (c) => c.status !== 'pass' && c.status !== 'skipped',
  )

  return {
    finalReport: currentReport,
    passed: currentReport.passesThreshold && currentReport.blockers.length === 0,
    iterations: iteration,
    appliedFixes: allAppliedFixes,
    scoreProgression,
    remainingIssues,
  }
}
