/**
 * Step Executor: Setup Motion Graphics
 *
 * Places AI-generated motion graphic elements on the canvas using the
 * visual flow system for intelligent sequencing, timing, and transitions.
 *
 * Integration points:
 * 1. suggestFlowPattern()  — determines the flow pattern from content
 * 2. computeFlowTiming()   — calculates proper timing with overlaps
 * 3. computeTransitionStyle() — powers transitions between elements
 * 4. suggestPreset()        — auto-assigns typography animation presets
 * 5. paletteFromMood()      — generates color palette from script emotion
 * 6. alignToTimingWindows() — snaps transitions to beats/dialogue pauses
 */

import type { ClipPlan } from '@/types/orchestrator'
import type { FlowTransitionType } from '@/services/motionDesign/visualFlow'
import {
  suggestFlowPattern,
  computeFlowTiming,
  FLOW_PATTERNS,
} from '@/services/motionDesign/visualFlow'
import { paletteFromMood } from '@/services/motionDesign/colorHarmony'
import { suggestPreset } from '@/services/motionDesign/typographyEngine'
import {
  findTimingWindows,
  alignToTimingWindows,
  extractPauses,
  extractEmotionCues,
} from '@/services/motionDesign/timingIntelligence'
import { buildMotionDesign } from '@/services/motionDesignGenerator'
import { registerDynamicTemplate } from '@/motionGraphics/dynamicRegistry'
import { useMotionGraphicStore } from '@/stores/useMotionGraphicStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useAudioDesignStore } from '@/stores/useAudioDesignStore'
import { snapFrameToBeat } from '@/services/musicAnalyzer'
import { logger } from '@/utils/logger'
import type { ExecutionContext } from '../constants'

/**
 * Extract the dominant emotion from dialogue scripts.
 * Scans all [emotion] cues and returns the most frequent one,
 * or a theme keyword derived from the script content.
 */
function extractDominantMood(plan: ClipPlan): string {
  const emotionCounts: Record<string, number> = {}
  const emotionRegex = /\[(\w+)\]/g

  for (const line of plan.dialogue) {
    let match
    while ((match = emotionRegex.exec(line.script)) !== null) {
      const emotion = match[1].toLowerCase()
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1
    }
    // Also count explicit emotion field
    if (line.emotion) {
      const e = line.emotion.toLowerCase()
      emotionCounts[e] = (emotionCounts[e] || 0) + 1
    }
  }

  // Return most frequent, or fall back to 'professional'
  let best = 'professional'
  let bestCount = 0
  for (const [emotion, count] of Object.entries(emotionCounts)) {
    if (count > bestCount) {
      bestCount = count
      best = emotion
    }
  }

  return best
}

/**
 * Build timing windows from dialogue word events and beat analysis.
 */
function buildTimingWindows(ctx: ExecutionContext): ReturnType<typeof findTimingWindows> {
  const dialogueLines = useMultiCharacterStore.getState().dialogueLines
  const beatAnalysis = useAudioDesignStore.getState().beatAnalysis

  // Extract pauses from dialogue word events
  const allWordEvents = dialogueLines
    .sort((a, b) => a.order - b.order)
    .flatMap((line) => line.wordTimeline ?? [])

  const pauses = allWordEvents.length > 1 ? extractPauses(allWordEvents) : []

  // Extract emotion cues from scripts
  const fullScript = dialogueLines.map((l) => l.script).join(' ')
  const emotionCues = allWordEvents.length > 0
    ? extractEmotionCues(fullScript, allWordEvents)
    : []

  // Convert beat analysis to AudioBeat format
  const beats = beatAnalysis
    ? beatAnalysis.beats.map((time, i) => ({
        time,
        strength: i % 4 === 0 ? 1.0 : i % 2 === 0 ? 0.7 : 0.4,
        isDownbeat: i % 4 === 0,
      }))
    : (ctx.beatTimestamps ?? []).map((time, i) => ({
        time,
        strength: i % 4 === 0 ? 1.0 : 0.5,
        isDownbeat: i % 4 === 0,
      }))

  const totalDurationSec = ctx.totalFrames / ctx.fps
  return findTimingWindows(totalDurationSec, pauses, beats, emotionCues)
}

export async function executeSetupMotionGraphics(
  plan: ClipPlan,
  ctx: ExecutionContext,
): Promise<void> {
  if (!plan.motionGraphics || plan.motionGraphics.length === 0) return

  const totalDurationSec = ctx.totalFrames / ctx.fps

  // 1. Determine the overall color palette from script emotion
  const dominantMood = extractDominantMood(plan)
  const palette = ctx.compositionLayout?.palette
    ? {
        primary: ctx.compositionLayout.palette.primary,
        secondary: ctx.compositionLayout.palette.secondary,
        accent: ctx.compositionLayout.palette.accent,
        background: ctx.compositionLayout.palette.background,
        surface: ctx.compositionLayout.palette.background,
        text: ctx.compositionLayout.palette.text,
        textSecondary: ctx.compositionLayout.palette.textOnDark ?? ctx.compositionLayout.palette.text,
        extras: ctx.compositionLayout.palette.all ?? [],
      }
    : paletteFromMood(dominantMood)

  // 2. Build timing windows from dialogue and audio
  const timingWindows = buildTimingWindows(ctx)

  // 3. Determine flow pattern from content
  const contentDescription = plan.motionGraphics
    .map((mg) => `${mg.role}: ${Object.values(mg.content).join(' ')}`)
    .join('. ')
  const patternName = suggestFlowPattern(contentDescription, plan.motionGraphics.length)
  const pattern = FLOW_PATTERNS[patternName] ?? FLOW_PATTERNS['hook-explain-cta']

  // 4. Compute flow timing with overlaps
  const { timings, transitions } = computeFlowTiming(pattern, totalDurationSec, 0.03)

  // 5. Place each motion graphic element
  let counter = 0
  for (let i = 0; i < plan.motionGraphics.length; i++) {
    const mgSpec = plan.motionGraphics[i]

    try {
      // Determine primary text content for typography preset suggestion
      const primaryText = mgSpec.content.title
        || mgSpec.content.name
        || mgSpec.content.text
        || Object.values(mgSpec.content)[0]
        || ''

      // 4. Auto-assign typography preset
      const typographyPreset = suggestPreset(primaryText, {
        emotion: dominantMood,
        role: mgSpec.role,
      })

      // Override palette primary with per-element color if specified
      const elementPalette = mgSpec.color
        ? { ...palette, accent: mgSpec.color }
        : palette

      // Build the motion design description programmatically
      const description = buildMotionDesign(
        mgSpec.role as any,
        mgSpec.content,
        elementPalette,
        typographyPreset,
      )

      // Register as a dynamic template
      const templateId = `orch-mg-${Date.now()}-${++counter}`
      registerDynamicTemplate(templateId, description)

      // Calculate frame range from flow timing or plan percentages
      const flowTiming = i < timings.length ? timings[i] : null
      const startPercent = flowTiming?.start ?? mgSpec.startPercent
      const endPercent = flowTiming?.end ?? mgSpec.endPercent

      let startFrame = Math.round(startPercent * ctx.totalFrames)
      let endFrame = Math.round(endPercent * ctx.totalFrames)

      // 6. Snap to timing windows (dialogue pauses, beats)
      if (timingWindows.length > 0) {
        const aligned = alignToTimingWindows(startFrame, endFrame, ctx.fps, timingWindows, 0.25)
        startFrame = aligned.startFrame
        endFrame = aligned.endFrame
      }

      // Also snap to beat timestamps if available
      if (ctx.beatTimestamps && ctx.beatTimestamps.length > 0) {
        startFrame = snapFrameToBeat(startFrame, ctx.fps, ctx.beatTimestamps, 0.15)
        endFrame = snapFrameToBeat(endFrame, ctx.fps, ctx.beatTimestamps, 0.15)
        if (endFrame <= startFrame) endFrame = startFrame + Math.round(ctx.fps * 2)
      }

      // Determine transition type
      const flowTransition = mgSpec.transition
        ?? (i < transitions.length ? transitions[i]?.type : 'crossfade')
        ?? 'crossfade'

      // Add motion graphic instance to the store
      const instanceId = `mg-${templateId}`
      useMotionGraphicStore.getState().addInstance({
        id: instanceId,
        templateId,
        name: description.name,
        config: { ...description.defaultConfig },
        position: { x: 0, y: 0 },
        scale: 1,
        opacity: 1,
        zIndex: 10 + i,
        rotation: 0,
        visible: true,
        startFrame,
        endFrame,
        dynamicDescription: description,
        flowRole: mgSpec.role,
        flowTransition: flowTransition as FlowTransitionType,
        palette: description.palette,
      })

      // Update previous instance's flow transition to link them
      if (i > 0) {
        const instances = useMotionGraphicStore.getState().instances
        const prevInstance = instances[instances.length - 2]
        if (prevInstance) {
          useMotionGraphicStore.getState().updateInstance(prevInstance.id, {
            flowTransition: flowTransition as string,
          })
        }
      }

      logger.info(
        `[Orchestrator:motion-graphics] Added "${description.name}" (${mgSpec.role}) ` +
        `frames ${startFrame}-${endFrame}, typography: ${typographyPreset}, ` +
        `transition: ${flowTransition}`,
      )
    } catch (err) {
      logger.error(`[Orchestrator:motion-graphics] Failed to add element ${i + 1}:`, err)
    }
  }

  logger.info(
    `[Orchestrator:motion-graphics] Placed ${plan.motionGraphics.length} elements ` +
    `using flow pattern "${patternName}", mood: "${dominantMood}"`,
  )
}
