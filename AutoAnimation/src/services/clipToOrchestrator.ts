/**
 * ClipToOrchestrator — Bridge service that converts an extracted clip into orchestrator input.
 *
 * Injects the transcript as dialogue, sets duration from clip boundaries,
 * pre-selects aspect ratio (9:16 for shorts), enables captions and stock media.
 */

import type { ExtractedClip } from '@/services/clipExtractor'
import type { OrchestratorSettings } from '@/types/orchestrator'

export interface ClipOrchestratorInput {
  prompt: string
  settings: Partial<OrchestratorSettings>
}

/**
 * Convert an extracted clip into orchestrator prompt and settings.
 */
export function convertClipToOrchestratorInput(
  clip: ExtractedClip,
  options?: {
    aspectRatio?: '16:9' | '9:16' | '1:1'
    includeMusic?: boolean
    includeStockMedia?: boolean
  },
): ClipOrchestratorInput {
  const transcriptText = clip.segments.map((s) => s.text.trim()).join(' ')

  const prompt = [
    `Create a short-form video from this clip: "${clip.title}".`,
    '',
    clip.hookRewrite ? `Opening hook: "${clip.hookRewrite}"` : '',
    '',
    'Transcript:',
    transcriptText,
    '',
    `Duration: ${Math.round(clip.duration)} seconds.`,
    'Make it engaging with dynamic text overlays and captions.',
  ]
    .filter(Boolean)
    .join('\n')

  const settings: Partial<OrchestratorSettings> = {
    aspectRatio: options?.aspectRatio ?? '9:16',
    durationSeconds: Math.round(clip.duration),
    fps: 30,
    generateMusic: options?.includeMusic ?? true,
    useStockMedia: options?.includeStockMedia ?? true,
    generateSVGAnimations: false,
    generateSVGAssets: false,
    generateStockAssets: false,
    useGoogleSearch: false,
  }

  return { prompt, settings }
}
