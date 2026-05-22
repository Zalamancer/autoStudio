/**
 * Step Executor: Setup Captions
 */

import type { ClipPlan } from '@/types/orchestrator'
import type { CaptionStyle } from '@/types/voice'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { logger } from '@/utils/logger'
import type { ExecutionContext } from '../constants'

const VALID_STYLES = [
  'word-by-word', 'sentence', 'karaoke',
  'typewriter', 'fade-per-word',
  'animated-pop', 'animated-bounce', 'animated-glow', 'animated-wave',
] as const

const VALID_POSITIONS = ['top', 'center', 'bottom'] as const
const VALID_EMOJI_MODES = ['none', 'contextual', 'emotion-only'] as const

/**
 * Auto-select a caption style based on content mood/type.
 * Called when no explicit style is specified by the user.
 */
function autoSelectCaptionStyle(plan: ClipPlan): string {
  const dialogueCount = plan.dialogue.length
  const hasMultipleCharacters = new Set(plan.dialogue.map((d) => d.characterName)).size > 1
  const avgScriptLength = plan.dialogue.reduce((sum, d) => sum + d.script.length, 0) / Math.max(dialogueCount, 1)
  const duration = plan.canvas.durationSeconds || 15

  // Fast-paced short content → animated-pop or typewriter
  if (duration <= 10 && avgScriptLength < 60) {
    return 'animated-pop'
  }

  // Multi-character conversations → karaoke (shows context + highlights active word)
  if (hasMultipleCharacters && dialogueCount > 4) {
    return 'karaoke'
  }

  // Longer scripts → sentence mode (less visual clutter)
  if (avgScriptLength > 120) {
    return 'sentence'
  }

  // Default for medium-paced content
  return 'word-by-word'
}

export async function executeSetupCaptions(
  plan: ClipPlan,
  _ctx: ExecutionContext,
): Promise<void> {
  try {
    const store = useVoiceStore.getState()
    const captions = plan.captions || { style: 'word-by-word', position: 'bottom' }

    // Auto-select style if none specified or use the plan's style
    const requestedStyle = captions.style || autoSelectCaptionStyle(plan)

    // Validate caption style
    const style = VALID_STYLES.includes(requestedStyle as typeof VALID_STYLES[number])
      ? requestedStyle
      : autoSelectCaptionStyle(plan)

    // Validate position
    const position = VALID_POSITIONS.includes(captions.position as typeof VALID_POSITIONS[number])
      ? captions.position
      : 'bottom'

    store.setCaptionStyle(style as CaptionStyle)
    store.setCaptionPosition(position)
    if (captions.fontSize && typeof captions.fontSize === 'number') {
      store.setCaptionFontSize(captions.fontSize)
    }
    if (captions.color && typeof captions.color === 'string') {
      store.setCaptionColor(captions.color)
    }

    // Set emoji mode if specified
    if (captions.emojiMode && VALID_EMOJI_MODES.includes(captions.emojiMode as typeof VALID_EMOJI_MODES[number])) {
      store.setEmojiMode(captions.emojiMode as typeof VALID_EMOJI_MODES[number])
    }

    // Set animation speed if specified and style is animated
    if (captions.animationSpeed && typeof captions.animationSpeed === 'number' && (style.startsWith('animated-') || style === 'typewriter' || style === 'fade-per-word')) {
      const validSpeeds = [0.5, 0.75, 1, 1.25, 1.5] as const
      const speed = validSpeeds.includes(captions.animationSpeed as typeof validSpeeds[number])
        ? captions.animationSpeed as typeof validSpeeds[number]
        : 1
      store.setCaptionAnimationSpeed(speed)
    }

    // Apply caption preset if specified
    if (captions.presetId && typeof captions.presetId === 'string') {
      store.setCaptionPreset(captions.presetId)
    }

    // Auto-enable speaker labels for multi-character clips
    const characterNames = new Set(plan.dialogue.map((d) => d.characterName))
    if (characterNames.size > 1) {
      store.setShowSpeakerLabels(true)
      logger.log(`[Orchestrator:captions] Enabled speaker labels for ${characterNames.size} characters`)
    }

  } catch (err) {
    logger.error('[Orchestrator:captions] Failed:', err)
  }
}
