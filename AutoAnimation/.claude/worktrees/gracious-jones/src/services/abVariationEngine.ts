/**
 * A/B Variation Engine — Generates plan variations for A/B testing.
 *
 * Supports three strategies:
 * - isolated: changes one variable at a time
 * - random: random combinations of variable changes
 * - guided: uses virality suggestions to generate improvement-focused variants
 */

import type { ClipPlan, VariationVariable, VariationConfig } from '@/types/orchestrator'

interface VariantResult {
  plan: ClipPlan
  label: string
  variableChanges: Record<string, string>
}

/**
 * Deep clone a ClipPlan.
 */
function clonePlan(plan: ClipPlan): ClipPlan {
  return JSON.parse(JSON.stringify(plan))
}

/**
 * Mutate a single field of a ClipPlan.
 */
export function mutateClipPlan(
  basePlan: ClipPlan,
  field: VariationVariable['field'],
  value?: string,
): ClipPlan {
  const plan = clonePlan(basePlan)

  switch (field) {
    case 'voice':
      // Change all character voice names
      for (const char of plan.characters) {
        char.voiceName = value ?? 'British Female'
      }
      break

    case 'musicMood':
      // No direct music field on ClipPlan; this is handled at orchestrator settings level
      break

    case 'textStyle':
      // Change text overlay font/color
      for (const overlay of plan.textOverlays) {
        overlay.fontFamily = value ?? 'Inter'
      }
      break

    case 'characterPosition':
      // Shift character positions
      for (const char of plan.characters) {
        char.position = {
          x: char.position.x + (Math.random() * 20 - 10),
          y: char.position.y + (Math.random() * 10 - 5),
        }
      }
      break

    case 'template':
      // Change HTML template IDs
      if (plan.htmlTemplates) {
        for (const tpl of plan.htmlTemplates) {
          tpl.templateId = value ?? tpl.templateId
        }
      }
      break

    case 'aspectRatio':
      plan.canvas.aspectRatio = (value as ClipPlan['canvas']['aspectRatio']) ?? '9:16'
      break

    case 'captionStyle':
      plan.captions.style = (value as ClipPlan['captions']['style']) ?? 'word-by-word'
      break

    case 'pacing':
      // Adjust duration and dialogue timing
      if (value === 'fast') {
        plan.canvas.durationSeconds = Math.round(plan.canvas.durationSeconds * 0.75)
      } else if (value === 'slow') {
        plan.canvas.durationSeconds = Math.round(plan.canvas.durationSeconds * 1.25)
      }
      break
  }

  return plan
}

/**
 * Generate isolated variants: each changes exactly one variable.
 */
export function generateIsolatedVariants(
  basePlan: ClipPlan,
  variables: VariationVariable[],
): VariantResult[] {
  const variants: VariantResult[] = []

  for (const variable of variables) {
    const values = variable.values ?? getDefaultValues(variable.field)
    const value = values[0]

    const plan = mutateClipPlan(basePlan, variable.field, value)
    variants.push({
      plan,
      label: `${variable.field}: ${value ?? 'modified'}`,
      variableChanges: { [variable.field]: value ?? 'modified' },
    })
  }

  return variants
}

/**
 * Generate random variants: each changes a random combination of variables.
 */
export function generateRandomVariants(
  basePlan: ClipPlan,
  variables: VariationVariable[],
  count: number,
): VariantResult[] {
  const variants: VariantResult[] = []

  for (let i = 0; i < count; i++) {
    let plan = clonePlan(basePlan)
    const changes: Record<string, string> = {}

    // Randomly select which variables to change
    for (const variable of variables) {
      if (Math.random() > 0.5) {
        const values = variable.values ?? getDefaultValues(variable.field)
        const value = values[Math.floor(Math.random() * values.length)]
        plan = mutateClipPlan(plan, variable.field, value)
        changes[variable.field] = value ?? 'modified'
      }
    }

    variants.push({
      plan,
      label: `Random variant ${i + 1}`,
      variableChanges: changes,
    })
  }

  return variants
}

/**
 * Generate guided variants: uses virality suggestions for improvement-focused changes.
 */
export function generateGuidedVariants(
  basePlan: ClipPlan,
  suggestions: string[],
): VariantResult[] {
  const variants: VariantResult[] = []

  for (const suggestion of suggestions.slice(0, 3)) {
    const plan = clonePlan(basePlan)
    const changes: Record<string, string> = {}

    // Simple heuristic mapping from suggestion text to mutations
    const lower = suggestion.toLowerCase()

    if (lower.includes('hook') || lower.includes('attention')) {
      // Improve hook: change text style and pacing
      for (const overlay of plan.textOverlays) {
        if (overlay.startPercent < 0.1) {
          overlay.color = '#ff0000'
        }
      }
      changes.textStyle = 'hook-emphasis'
    }

    if (lower.includes('pacing') || lower.includes('faster') || lower.includes('shorter')) {
      plan.canvas.durationSeconds = Math.round(plan.canvas.durationSeconds * 0.8)
      changes.pacing = 'faster'
    }

    if (lower.includes('caption') || lower.includes('subtitle')) {
      plan.captions.style = 'karaoke'
      changes.captionStyle = 'karaoke'
    }

    variants.push({
      plan,
      label: suggestion.slice(0, 40),
      variableChanges: changes,
    })
  }

  return variants
}

/**
 * Main entry point: generate variants from a VariationConfig.
 */
export function generateVariantsFromConfig(
  basePlan: ClipPlan,
  config: VariationConfig,
): VariantResult[] {
  switch (config.strategy) {
    case 'isolated':
      return generateIsolatedVariants(basePlan, config.variables)
    case 'random':
      return generateRandomVariants(basePlan, config.variables, config.variables.length)
    case 'guided':
      return generateGuidedVariants(basePlan, config.variables.map((v) => v.field))
    default:
      return generateIsolatedVariants(basePlan, config.variables)
  }
}

/**
 * Get default values for a variation field.
 */
function getDefaultValues(field: VariationVariable['field']): string[] {
  switch (field) {
    case 'voice':
      return ['British Female', 'American Male', 'Australian Female']
    case 'musicMood':
      return ['energetic', 'calm', 'dramatic']
    case 'textStyle':
      return ['Inter', 'Playfair Display', 'Oswald']
    case 'characterPosition':
      return ['center', 'left', 'right']
    case 'template':
      return ['tpl-neural-noir', 'tpl-retro-wave', 'tpl-minimal']
    case 'aspectRatio':
      return ['9:16', '16:9', '1:1']
    case 'captionStyle':
      return ['word-by-word', 'sentence', 'karaoke']
    case 'pacing':
      return ['fast', 'normal', 'slow']
    default:
      return ['default']
  }
}
