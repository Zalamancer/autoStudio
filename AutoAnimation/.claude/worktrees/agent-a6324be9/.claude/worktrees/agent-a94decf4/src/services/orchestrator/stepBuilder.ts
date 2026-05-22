/**
 * Orchestrator Step Builder — constructs the step list from a ClipPlan.
 */

import type {
  ClipPlan,
  OrchestratorStep,
  OrchestratorSettings,
} from '@/types/orchestrator'
import { hasElevenLabsService } from '@/services/elevenlabs'

/**
 * Build initial step list from a ClipPlan.
 */
export function buildStepsFromPlan(plan: ClipPlan, settings?: OrchestratorSettings): OrchestratorStep[] {
  const isFaceless = plan.canvas.mode === 'faceless' || settings?.mode === 'faceless'

  const steps: OrchestratorStep[] = [
    { type: 'setup-canvas', status: 'pending', detail: `${plan.canvas.aspectRatio}, ${plan.canvas.fps}fps, ${plan.canvas.durationSeconds}s${isFaceless ? ' (faceless)' : ''}` },
    { type: 'setup-background', status: 'pending', detail: plan.background.type === 'lottie' ? `Lottie: ${plan.background.lottieQuery || 'auto'}` : `Generate SVG: ${plan.background.svgPrompt?.slice(0, 40) || ''}...` },
  ]

  // Skip character setup in faceless mode.
  if (plan.characters.length > 0 && !isFaceless) {
    // Generate characters first if any need NB2 pipeline generation
    const charsToGenerate = plan.characters.filter(c => c.generateNew || c.referenceDescription)
    if (charsToGenerate.length > 0 && settings?.autoGenerateCharacters !== false) {
      steps.push({
        type: 'generate-characters',
        status: 'pending',
        detail: `Auto-generate ${charsToGenerate.length} character(s): ${charsToGenerate.map(c => c.name).join(', ')}`,
      })
    }

    // Then set up all characters (matches saved + uses any just-generated ones)
    steps.push({
      type: 'setup-characters',
      status: 'pending',
      detail: plan.characters.map((c) => c.name).join(', '),
    })
  }

  if (plan.dialogue.length > 0) {
    steps.push({
      type: 'generate-voices',
      status: 'pending',
      detail: isFaceless
        ? `${plan.dialogue.length} narration lines (voice-only)`
        : `${plan.dialogue.length} dialogue lines`,
    })
    steps.push({
      type: 'setup-dialogue',
      status: 'pending',
      detail: isFaceless ? 'Build narration timeline' : 'Build timeline from generated voices',
    })
    if (!isFaceless) {
      steps.push({
        type: 'setup-gestures',
        status: 'pending',
        detail: 'Auto-generate body gestures from speech emphasis',
      })
      steps.push({
        type: 'setup-character-motion',
        status: 'pending',
        detail: 'Assign rig animations and character motion keyframes',
      })
    }
  }

  // Camera setup (presets, custom keyframes, or camera directives)
  // Placed after setup-dialogue so ctx.totalFrames reflects actual audio duration
  if (plan.camera?.presetId || (plan.camera?.keyframes && plan.camera.keyframes.length > 0) || (plan.cameraDirectives && plan.cameraDirectives.length > 0)) {
    const detail = plan.camera?.presetId
      ? `Camera preset: ${plan.camera.presetId}`
      : plan.cameraDirectives?.length
        ? `${plan.cameraDirectives.length} camera directive${plan.cameraDirectives.length > 1 ? 's' : ''}`
        : `${plan.camera?.keyframes?.length || 0} custom camera keyframes`
    steps.push({
      type: 'setup-camera',
      status: 'pending',
      detail,
    })
  }

  // Auto-camera: generate camera keyframes from dialogue analysis
  // Only when enabled AND no explicit camera directives in the plan
  if (
    settings?.useAutoCamera !== false &&
    !plan.camera?.presetId &&
    !(plan.camera?.keyframes && plan.camera.keyframes.length > 0) &&
    !(plan.cameraDirectives && plan.cameraDirectives.length > 0) &&
    plan.dialogue.length > 0
  ) {
    steps.push({
      type: 'setup-auto-camera',
      status: 'pending',
      detail: 'Auto-generate camera moves from dialogue emphasis & emotion',
    })
  }

  // Smart B-roll: insert contextual cutaways during dialogue gaps.
  // Enabled by default — only disabled if explicitly turned off.
  if (settings?.useSmartBroll !== false && plan.dialogue.length > 0) {
    steps.push({
      type: 'setup-smart-broll',
      status: 'pending',
      detail: 'Analyze dialogue for visual concepts and insert contextual B-roll',
    })
  }

  // Generate background music if ElevenLabs is available and setting is enabled
  if (hasElevenLabsService() && settings?.generateMusic !== false) {
    steps.push({
      type: 'generate-music',
      status: 'pending',
      detail: plan.dialogue.length > 0
        ? `Mood-aware background score from ${plan.dialogue.length} dialogue lines`
        : 'Ambient cinematic background music',
    })
  }

  if (plan.textOverlays.length > 0) {
    steps.push({
      type: 'setup-text-overlays',
      status: 'pending',
      detail: `${plan.textOverlays.length} text overlays`,
    })
  }

  if (plan.shapes.length > 0) {
    steps.push({
      type: 'setup-shapes',
      status: 'pending',
      detail: `${plan.shapes.length} shapes`,
    })
  }

  if (plan.htmlTemplates && plan.htmlTemplates.length > 0) {
    steps.push({
      type: 'setup-html-templates',
      status: 'pending',
      detail: `${plan.htmlTemplates.length} HTML template${plan.htmlTemplates.length > 1 ? 's' : ''}`,
    })
  }

  if (plan.motionGraphics && plan.motionGraphics.length > 0) {
    steps.push({
      type: 'setup-motion-graphics',
      status: 'pending',
      detail: `${plan.motionGraphics.length} motion graphic${plan.motionGraphics.length > 1 ? 's' : ''}: ${plan.motionGraphics.map((m) => m.role).join(', ')}`,
    })
  }

  if (plan.svgObjects && plan.svgObjects.length > 0) {
    steps.push({
      type: 'generate-svg-objects',
      status: 'pending',
      detail: `${plan.svgObjects.length} SVG object${plan.svgObjects.length > 1 ? 's' : ''}: ${plan.svgObjects.map((o) => o.prompt).join(', ').slice(0, 60)}...`,
    })
  }

  if (plan.stockMedia && plan.stockMedia.length > 0) {
    steps.push({
      type: 'setup-stock-media',
      status: 'pending',
      detail: `${plan.stockMedia.length} stock asset${plan.stockMedia.length > 1 ? 's' : ''}: ${plan.stockMedia.map((m) => `${m.role || 'overlay'}:"${m.query}"`).join(', ').slice(0, 80)}`,
    })
  }

  if (plan.soundEffects && plan.soundEffects.length > 0 && settings?.useSoundEffects !== false) {
    steps.push({
      type: 'setup-sound-effects',
      status: 'pending',
      detail: `${plan.soundEffects.length} sound effect${plan.soundEffects.length > 1 ? 's' : ''}: ${plan.soundEffects.map((s) => `"${s.prompt}"`).join(', ').slice(0, 80)}`,
    })
  }

  // Beat sync: align visual elements to music beats
  // Runs after music generation and visual setup steps
  if (settings?.generateMusic !== false && settings?.beatSync?.enabled !== false) {
    const beatConf = settings?.beatSync
    const sub = beatConf?.subdivision || 1
    steps.push({
      type: 'sync-to-beat',
      status: 'pending',
      detail: `Sync visuals to beats (intensity: ${Math.round((beatConf?.intensity ?? 0.5) * 100)}%, every ${sub === 1 ? '' : `${sub}nd `}beat)`,
    })
  }

  // Retention hooks: visual engagement widgets
  if (plan.retentionHooks && plan.retentionHooks.length > 0) {
    steps.push({
      type: 'setup-retention-hooks',
      status: 'pending',
      detail: `${plan.retentionHooks.length} retention hook${plan.retentionHooks.length > 1 ? 's' : ''}: ${plan.retentionHooks.map((h) => h.type).join(', ')}`,
    })
  }

  // Auto-animate all placed visual elements (entrance/exit/attention animations)
  // Runs after all visual elements are on canvas
  steps.push({
    type: 'auto-animate-elements',
    status: 'pending',
    detail: 'Apply entrance, exit, and attention animations to canvas elements',
  })

  steps.push({
    type: 'setup-captions',
    status: 'pending',
    detail: `${plan.captions.style} captions at ${plan.captions.position}`,
  })

  // Auto-generate a click-worthy thumbnail
  steps.push({
    type: 'generate-thumbnail',
    status: 'pending',
    detail: 'Capture best frame and overlay title text',
  })

  steps.push({
    type: 'finalize-timeline',
    status: 'pending',
    detail: 'Set timeline duration and seek to start',
  })

  // Quality gate: score clip and auto-fix issues (never blocks completion)
  steps.push({
    type: 'quality-gate',
    status: 'pending',
    detail: `Score quality${settings?.targetPlatform ? ` for ${settings.targetPlatform}` : ''} and auto-fix issues`,
  })

  return steps
}
