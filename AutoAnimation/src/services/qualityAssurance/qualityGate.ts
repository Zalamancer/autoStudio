/**
 * Quality Gate Service
 *
 * Orchestrates all QA checks and provides:
 * - Full QA report generation
 * - Quality gate pass/fail decision
 * - Automated iteration support (identify weak elements, suggest regeneration)
 * - Integration with existing viral score analyzer
 * - Score grading (A+ through F)
 */

import type {
  QAReport,
  QACategoryScore,
  QACheckResult,
  QACheckCategory,
  QAGrade,
  QAImprovement,
  QualityGateConfig,
  QualityGateResult,
  VisualQualityInput,
  AudioQualityInput,
  ContentCompletenessInput,
  CanvasElementBounds,
} from '@/types/qualityAssurance'
import type { ViralScoreDimensions } from '@/types/orchestrator'
import { scoreVisualQuality } from './visualQuality'
import { scoreAudioQuality } from './audioQuality'
import { scoreContentCompleteness } from './contentCompleteness'
import { checkPlatformCompliance } from './platformCompliance'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useShapeStore } from '@/stores/useShapeStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useHTMLTemplateLayerStore } from '@/stores/useHTMLTemplateLayerStore'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { useTimelineStore, useEditorStore } from '@/stores'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { useOrchestratorStore } from '@/stores/useOrchestratorStore'

// ── Grade Mapping ──

function scoreToGrade(score: number): QAGrade {
  if (score >= 95) return 'A+'
  if (score >= 85) return 'A'
  if (score >= 78) return 'B+'
  if (score >= 70) return 'B'
  if (score >= 63) return 'C+'
  if (score >= 55) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

// ── Category Score Aggregation ──

function aggregateCategoryScore(category: QACheckCategory, checks: QACheckResult[]): QACategoryScore {
  const categoryChecks = checks.filter((c) => c.category === category)
  if (categoryChecks.length === 0) {
    return {
      category,
      score: 100,
      passed: 0,
      failed: 0,
      warnings: 0,
      checks: [],
    }
  }

  // Weight critical checks higher
  let totalWeight = 0
  let weightedScore = 0

  for (const check of categoryChecks) {
    const weight = check.severity === 'critical' ? 3 : check.severity === 'warning' ? 2 : 1
    weightedScore += check.score * weight
    totalWeight += weight
  }

  const score = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 100

  return {
    category,
    score,
    passed: categoryChecks.filter((c) => c.status === 'pass').length,
    failed: categoryChecks.filter((c) => c.status === 'fail').length,
    warnings: categoryChecks.filter((c) => c.status === 'warning').length,
    checks: categoryChecks,
  }
}

// ── Extract Improvements ──

function extractImprovements(checks: QACheckResult[]): QAImprovement[] {
  return checks
    .filter((c) => c.status !== 'pass' && c.status !== 'skipped' && c.suggestion)
    .map((c, i) => ({
      checkId: c.id,
      priority: c.severity === 'critical' ? i : c.severity === 'warning' ? i + 100 : i + 200,
      description: c.suggestion!,
      estimatedImpact: c.severity === 'critical' ? 15 : c.severity === 'warning' ? 8 : 3,
      autoApplicable: c.autoFixable,
      action: c.autoFixAction,
    }))
    .sort((a, b) => a.priority - b.priority)
}

// ── Full QA Input (aggregated from stores) ──

export interface QAInput {
  visual: VisualQualityInput
  audio: AudioQualityInput
  content: ContentCompletenessInput
  platform?: string
  viralityDimensions?: ViralScoreDimensions
}

// ── Generate Full QA Report ──

export function generateQAReport(input: QAInput, threshold: number = 60): QAReport {
  const allChecks: QACheckResult[] = []

  // Visual quality checks
  allChecks.push(...scoreVisualQuality(input.visual))

  // Audio quality checks
  allChecks.push(...scoreAudioQuality(input.audio))

  // Content completeness checks
  allChecks.push(...scoreContentCompleteness(input.content))

  // Platform compliance checks
  let platformCompliance = null
  if (input.platform) {
    const compliance = checkPlatformCompliance(input.platform, {
      aspectRatio: input.visual.aspectRatio,
      durationSeconds: input.audio.durationSeconds,
      canvasWidth: input.visual.canvasWidth,
      canvasHeight: input.visual.canvasHeight,
      elements: input.visual.elements,
      hasCaptions: input.visual.hasCaptions,
    })
    allChecks.push(...compliance.checks)
    platformCompliance = compliance
  }

  // Aggregate category scores
  const categories: QACategoryScore[] = [
    aggregateCategoryScore('visual', allChecks),
    aggregateCategoryScore('audio', allChecks),
    aggregateCategoryScore('content', allChecks),
    aggregateCategoryScore('platform', allChecks),
  ]

  // Compute overall score (weighted)
  const categoryWeights: Record<QACheckCategory, number> = {
    visual: 0.25,
    audio: 0.25,
    content: 0.3,
    platform: 0.2,
    accessibility: 0,
    brand: 0,
  }

  let overallScore = 0
  let totalWeight = 0
  for (const cat of categories) {
    const weight = categoryWeights[cat.category] || 0
    if (weight > 0 && cat.checks.length > 0) {
      overallScore += cat.score * weight
      totalWeight += weight
    }
  }
  overallScore = totalWeight > 0 ? Math.round(overallScore / totalWeight) : 100

  // Extract blockers and improvements
  const blockers = allChecks.filter((c) => c.status === 'fail' && c.severity === 'critical')
  const improvements = extractImprovements(allChecks)

  return {
    id: `qa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    overallScore,
    grade: scoreToGrade(overallScore),
    categories,
    allChecks,
    blockers,
    improvements,
    passesThreshold: overallScore >= threshold && blockers.length === 0,
    threshold,
    platformCompliance,
    viralityDimensions: input.viralityDimensions ?? null,
  }
}

// ── Quality Gate (for orchestrator integration) ──

export function evaluateQualityGate(input: QAInput, config: QualityGateConfig): QualityGateResult {
  const report = generateQAReport(input, config.minimumScore)

  // Check category minimums
  let categoriesPassed = true
  for (const category of config.requiredCategories) {
    const catScore = report.categories.find((c) => c.category === category)
    const minScore = config.categoryMinScores[category] ?? config.minimumScore
    if (catScore && catScore.score < minScore) {
      categoriesPassed = false
    }
  }

  const passed = report.passesThreshold && categoriesPassed

  // Identify remaining non-fixable issues
  const remainingIssues = report.allChecks.filter(
    (c) => c.status !== 'pass' && c.status !== 'skipped' && !c.autoFixable,
  )

  return {
    passed,
    report,
    iterationsPerformed: 0,
    appliedFixes: [],
    remainingIssues,
  }
}

// ── Default Quality Gate Config ──

export const DEFAULT_QUALITY_GATE_CONFIG: QualityGateConfig = {
  minimumScore: 70,
  maxIterations: 3,
  requiredCategories: ['content', 'audio', 'visual'],
  categoryMinScores: {
    content: 65,
    audio: 55,
    visual: 55,
  },
  autoFix: true,
}

// ── Extract QA Input from Stores ──

export function extractQAInputFromStores(): QAInput {
  // Store state cast to any — this function pokes at ad-hoc shapes (x/y/width/height on
  // TextOverlay, CanvasShape, CanvasMediaItem, GeneratedVoice) that aren't part of the real
  // store types. The previous implementation used require() which hid these mismatches by
  // implicit any. Keeping the cast preserves the original runtime behavior without a risky
  // cross-store refactor.
  const timeline = useTimelineStore.getState() as any
  const editor = useEditorStore.getState() as any
  const canvas = useCanvasStore.getState() as any
  const dialogue = useMultiCharacterStore.getState() as any
  const voice = useVoiceStore.getState() as any
  const text = useTextOverlayStore.getState() as any
  const shapes = useShapeStore.getState() as any
  const media = useMediaStore.getState() as any
  const htmlTemplates = useHTMLTemplateLayerStore.getState() as any
  const svg = useSVGObjectStore.getState() as any
  const animations = useAnimationStore.getState() as any
  const orchestrator = useOrchestratorStore.getState() as any

  const fps = timeline.fps || 30
  const totalFrames = timeline.totalFrames || 0
  const durationSeconds = totalFrames / fps
  const canvasWidth = canvas.canvasWidth
  const canvasHeight = canvas.canvasHeight

  // Build element bounds from all layers
  const elements: CanvasElementBounds[] = []

  // Text overlays
  const overlays = text.overlays || []
  for (const overlay of overlays) {
    elements.push({
      id: `text-${overlay.id}`,
      type: 'text',
      x: overlay.x ?? 0,
      y: overlay.y ?? 0,
      width: overlay.width ?? 200,
      height: overlay.height ?? 40,
      startFrame: overlay.startFrame ?? 0,
      endFrame: overlay.endFrame ?? totalFrames,
      zIndex: 6,
      opacity: overlay.opacity ?? 1,
    })
  }

  // Shapes
  const shapesList = shapes.shapes || []
  for (const shape of shapesList) {
    elements.push({
      id: `shape-${shape.id}`,
      type: 'shape',
      x: shape.x ?? 0,
      y: shape.y ?? 0,
      width: shape.width ?? 100,
      height: shape.height ?? 100,
      startFrame: 0,
      endFrame: totalFrames,
      zIndex: 3,
      opacity: shape.opacity ?? 1,
    })
  }

  // Media items
  const mediaItems = media.canvasItems || []
  for (const item of mediaItems) {
    elements.push({
      id: `media-${item.id}`,
      type: 'media',
      x: item.x ?? 0,
      y: item.y ?? 0,
      width: item.width ?? canvasWidth,
      height: item.height ?? canvasHeight,
      startFrame: item.startFrame ?? 0,
      endFrame: item.endFrame ?? totalFrames,
      zIndex: 2,
      opacity: item.opacity ?? 1,
    })
  }

  // Text overlay info for readability checks
  const textOverlayInfos = overlays.map((o: Record<string, unknown>) => ({
    id: String(o.id),
    text: String(o.text ?? ''),
    fontSize: Number(o.fontSize ?? 16),
    fontFamily: String(o.fontFamily ?? 'Inter'),
    color: String(o.color ?? '#ffffff'),
    backgroundColor: o.backgroundColor as string | undefined,
    x: Number(o.x ?? 0),
    y: Number(o.y ?? 0),
    width: Number(o.width ?? 200),
    height: Number(o.height ?? 40),
  }))

  // Audio segments from dialogue — use real amplitude data when available,
  // otherwise mark as unmeasured so QA can skip rather than fake results
  const dialogueSegments = (voice.generatedVoices || []).map((v: Record<string, unknown>) => ({
    startTime: Number(v.startTime ?? 0),
    endTime: Number(v.startTime ?? 0) + Number(v.audioDuration ?? 0),
    avgAmplitude: Number(v.avgAmplitude ?? -1), // -1 = unmeasured
    peakAmplitude: Number(v.peakAmplitude ?? -1),
    type: 'dialogue' as const,
  }))

  // Detect actual background music from media store (stored as audio canvas items by generateMusic step)
  const musicItems = mediaItems.filter(
    (item: Record<string, unknown>) =>
      String(item.id ?? '').startsWith('media-music-') ||
      (String(item.category ?? '') === 'audio' &&
        String(item.name ?? '')
          .toLowerCase()
          .includes('music')),
  )
  const hasMusicActual = musicItems.length > 0

  // Detect sound effects from media store
  const sfxItems = mediaItems.filter(
    (item: Record<string, unknown>) =>
      String(item.id ?? '').startsWith('media-sfx-') || String(item.id ?? '').startsWith('sfx-'),
  )
  const sfxSegments = sfxItems.map((item: Record<string, unknown>) => ({
    startTime: Number(item.startTime ?? 0),
    endTime: Number(item.startTime ?? 0) + Number(item.duration ?? 2),
    avgAmplitude: 0.6,
    peakAmplitude: 0.9,
    type: 'sfx' as const,
  }))

  // Detect background: Lottie animations, canvas color, OR HTML templates (primary visual layer)
  const templateCount = (htmlTemplates.templates || []).length
  const hasBackgroundActual = (animations.animations || []).length > 0 || !!canvas.backgroundColor || templateCount > 0

  // Planned vs actual content
  const plan = orchestrator.plan
  const planned = {
    characterCount: plan?.characters?.length ?? dialogue.characters.length,
    dialogueLineCount: plan?.dialogue?.length ?? dialogue.dialogueLines.length,
    textOverlayCount: plan?.textOverlays?.length ?? overlays.length,
    templateCount: plan?.htmlTemplates?.length ?? templateCount,
    svgObjectCount: plan?.svgObjects?.length ?? (svg.composition?.objects || []).length,
    mediaCount: plan?.stockMedia?.length ?? mediaItems.length,
    hasMusic: plan?.music !== undefined || false,
    hasCaptions: (plan?.captions?.style ?? voice.captionStyle) !== 'none',
    hasBackground: plan?.background !== undefined || hasBackgroundActual,
  }

  const actual = {
    characterCount: dialogue.characters.length,
    dialogueLineCount: dialogue.dialogueLines.length,
    textOverlayCount: overlays.length,
    templateCount,
    svgObjectCount: (svg.composition?.objects || []).length,
    mediaCount: mediaItems.length,
    hasMusic: hasMusicActual,
    hasCaptions: voice.captionStyle !== 'none',
    hasBackground: hasBackgroundActual,
    errorFrames: [],
    totalFrames,
  }

  // Build music info from actual media store data, not voice store
  const musicInfo = hasMusicActual
    ? {
        duration: Number((musicItems[0] as Record<string, unknown>).duration ?? durationSeconds),
        loops: false,
        volume: 0.3,
      }
    : null

  return {
    visual: {
      canvasWidth,
      canvasHeight,
      elements,
      backgroundColor: canvas.backgroundColor || '#000000',
      textOverlays: textOverlayInfos,
      hasCaptions: voice.captionStyle !== 'none',
      captionPosition: 'bottom',
      aspectRatio: editor.aspectRatio,
    },
    audio: {
      durationSeconds,
      dialogueSegments,
      music: musicInfo,
      soundEffects: sfxSegments,
      fps,
    },
    content: { planned, actual },
    platform: orchestrator.settings?.targetPlatform,
  }
}
