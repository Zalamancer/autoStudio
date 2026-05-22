import type { CopilotSuggestion } from '@/types/copilot'
import { buildCopilotContext } from './contextBuilder'

/**
 * Generate context-aware suggestion chips based on current project state.
 */
export function getCopilotSuggestions(): CopilotSuggestion[] {
  const ctx = buildCopilotContext()
  const suggestions: CopilotSuggestion[] = []

  const isEmpty = ctx.characters.length === 0
    && ctx.textOverlays.length === 0
    && ctx.shapes.length === 0
    && ctx.dialogueLines.length === 0

  if (isEmpty) {
    // Empty canvas suggestions — showcase capabilities
    suggestions.push(
      { label: 'Add a title', prompt: 'Add a title text that says "Hello World"' },
      { label: 'Generate SVG', prompt: 'Generate an SVG illustration of a colorful landscape with mountains and a sunset' },
      { label: 'Add photo', prompt: 'Search for a stock photo of a beautiful sunset and add it to the canvas' },
      { label: 'Add character', prompt: 'Add a character named "Host"' },
    )
    return suggestions
  }

  // Selection-based suggestions
  if (ctx.selection.type === 'text' && ctx.selection.id) {
    const overlay = ctx.textOverlays.find((o) => o.id === ctx.selection.id)
    if (overlay) {
      suggestions.push(
        { label: 'Make bigger', prompt: `Make the text "${overlay.content}" larger` },
        { label: 'Change color', prompt: `Change the color of "${overlay.content}" to something eye-catching` },
        { label: 'Center it', prompt: `Center the text "${overlay.content}" on the canvas` },
      )
      return suggestions
    }
  }

  if (ctx.selection.type === 'shape' && ctx.selection.id) {
    suggestions.push(
      { label: 'Change fill', prompt: 'Change the selected shape fill color to blue' },
      { label: 'Make bigger', prompt: 'Scale up the selected shape' },
    )
    return suggestions
  }

  // Project-state suggestions
  if (ctx.dialogueLines.length > 0 && ctx.dialogueLines.some((l) => !l.hasVoice)) {
    suggestions.push({ label: 'Generate voices', prompt: 'Generate voices for all dialogue lines that don\'t have audio yet' })
  }

  if (ctx.characters.length > 0 && ctx.dialogueLines.length === 0) {
    suggestions.push({ label: 'Add dialogue', prompt: 'Add some dialogue lines for the characters' })
  }

  if (ctx.textOverlays.length > 0) {
    suggestions.push({ label: 'Edit text', prompt: `What text overlays are on the canvas?` })
  }

  if (ctx.schema.length > 0) {
    suggestions.push({ label: 'List variables', prompt: 'What schema variables are available?' })
  }

  // Always available
  suggestions.push(
    { label: "What's here?", prompt: 'Describe what is currently on the canvas' },
  )

  return suggestions.slice(0, 4)
}
