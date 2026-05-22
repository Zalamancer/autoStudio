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

function aggregateCategoryScore(
  category: QACheckCategory,
  checks: QACheckResult[],
): QACategoryScore {
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

export function generateQAReport(
  input: QAInput,
  threshold: number = 60,
): QAReport {
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

export function evaluateQualityGate(
  input: QAInput,
  config: QualityGateConfig,
): QualityGateResult {
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
  minimumScore: 60,
  maxIterations: 3,
  requiredCategories: ['content', 'audio'],
  categoryMinScores: {
    content: 50,
    audio: 40,
    visual: 40,
  },
  autoFix: true,
}

// ── Extract QA Input from Stores ──

export function extractQAInputFromStores(): QAInput {
  // Lazy imports to avoid circular dependencies
  const { useMultiCharacterStore } = require('@/stores/useMultiCharacterStore')
  const { useVoiceStore } = require('@/stores/useVoiceStore')
  const { useTextOverlayStore } = require('@/stores/useTextOverlayStore')
  const { useShapeStore } = require('@/stores/useShapeStore')
  const { useMediaStore } = require('@/stores/useMediaStore')
  const { useHTMLTemplateLayerStore } = require('@/stores/useHTMLTemplateLayerStore')
  const { useSVGObjectStore } = require('@/stores/useSVGObjectStore')
  const { useTimelineStore } = require('@/stores')
  const { useEditorStore } = require('@/stores')
  const { useCanvasStore } = require('@/stores/useCanvasStore')
  const { useAnimationStore } = require('@/stores/useAnimationStore')
  const { useOrchestratorStore } = require('@/stores/useOrchestratorStore')

  const timeline = useTimelineStore.getState()
  const editor = useEditorStore.getState()
  const canvas = useCanvasStore.getState()
  const dialogue = useMultiCharacterStore.getState()
  const voice = useVoiceStore.getState()
  const text = useTextOverlayStore.getState()
  const shapes = useShapeStore.getState()
  const media = useMediaStore.getState()
  const htmlTemplates = useHTMLTemplateLayerStore.getState()
  const svg = useSVGObjectStore.getState()
  const animations = useAnimationStore.getState()
  const orchestrator = useOrchestratorStore.getState()

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

  // Audio segments from dialogue
  const dialogueSegments = (voice.generatedVoices || []).map((v: Record<string, unknown>) => ({
    startTime: Number(v.startTime ?? 0),
    endTime: Number(v.startTime ?? 0) + Number(v.audioDuration ?? 0),
    avgAmplitude: 0.5, // We can't accurately measure without analyzing the audio buffer
    peakAmplitude: 0.8,
    type: 'dialogue' as const,
  }))

  // Planned vs actual content
  const plan = orchestrator.plan
  const planned = {
    characterCount: plan?.characters?.length ?? dialogue.characters.length,
    dialogueLineCount: plan?.dialogue?.length ?? dialogue.dialogueLines.length,
    textOverlayCount: plan?.textOverlays?.length ?? overlays.length,
    templateCount: plan?.htmlTemplates?.length ?? (htmlTemplates.templates || []).length,
    svgObjectCount: plan?.svgObjects?.length ?? (svg.composition?.objects || []).length,
    mediaCount: plan?.stockMedia?.length ?? mediaItems.length,
    hasMusic: plan?.music !== undefined || false,
    hasCaptions: (plan?.captions?.style ?? voice.captionStyle) !== 'none',
    hasBackground: plan?.background !== undefined || (animations.animations || []).length > 0,
  }

  const actual = {
    characterCount: dialogue.characters.length,
    dialogueLineCount: dialogue.dialogueLines.length,
    textOverlayCount: overlays.length,
    templateCount: (htmlTemplates.templates || []).length,
    svgObjectCount: (svg.composition?.objects || []).length,
    mediaCount: mediaItems.length,
    hasMusic: (voice.generatedVoices || []).length > 0,
    hasCaptions: voice.captionStyle !== 'none',
    hasBackground: (animations.animations || []).length > 0 || !!canvas.backgroundColor,
    errorFrames: [],
    totalFrames,
  }

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
      music: voice.generatedVoices?.length > 0
        ? { duration: durationSeconds, loops: false, volume: 0.3 }
        : null,
      soundEffects: [],
      fps,
    },
    content: { planned, actual },
    platform: orchestrator.settings?.targetPlatform,
  }
}
