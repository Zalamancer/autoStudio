/**
 * Step Executor: Generate Characters
 *
 * Autonomously generates new 2D characters via the NB2 pipeline when
 * no saved character matches a plan character with generateNew=true.
 *
 * Runs before setup-characters so generated characters are available
 * for matching during character placement.
 *
 * Key improvements:
 * - Parallelizes independent generation steps (hair + visemes + eyes + eyebrows)
 * - Style matching via visualStyle field in ClipPlanCharacter
 * - Generates characters in parallel batches (up to 2 at a time)
 * - Non-fatal: if generation fails, setup-characters still proceeds
 */

import type { ClipPlan } from '@/types/orchestrator'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { logger } from '@/utils/logger'
import type { ExecutionContext } from '../constants'

export async function executeGenerateCharacters(
  plan: ClipPlan,
  ctx: ExecutionContext,
): Promise<void> {
  const savedChars = useSavedCharactersStore.getState().characters

  // Find characters that need generation
  const charsToGenerate = plan.characters.filter((planChar) => {
    if (!planChar.generateNew) return false
    if (planChar.dimension === '3d') return false  // 3D uses different pipeline
    if (!planChar.referenceDescription) return false

    // Check if a saved character already matches
    if (planChar.savedCharacterName) {
      const match = savedChars.find(
        (sc) => sc.name.toLowerCase() === planChar.savedCharacterName!.toLowerCase(),
      )
      if (match) return false
    }

    // Fuzzy match check
    const fuzzyMatch = savedChars.find(
      (sc) => sc.name.toLowerCase().includes(planChar.name.toLowerCase()) ||
              planChar.name.toLowerCase().includes(sc.name.toLowerCase()),
    )
    if (fuzzyMatch) return false

    return true
  })

  if (charsToGenerate.length === 0) {
    logger.log('[Orchestrator:generate-characters] No characters need generation, skipping')
    return
  }

  logger.log(`[Orchestrator:generate-characters] Generating ${charsToGenerate.length} character(s): ${charsToGenerate.map(c => c.name).join(', ')}`)

  // Import the autonomous generation service (lazy to avoid circular deps)
  const { generateCharacterAutonomous } = await import('@/services/autonomousCharacterGen')

  // Generate characters in parallel batches (2 at a time to avoid API rate limits)
  const batchSize = 2
  for (let i = 0; i < charsToGenerate.length; i += batchSize) {
    const batch = charsToGenerate.slice(i, i + batchSize)

    const results = await Promise.allSettled(
      batch.map((planChar) =>
        generateCharacterAutonomous({
          description: planChar.referenceDescription!,
          name: planChar.name,
          visualStyle: planChar.visualStyle,
          autoRig: false,  // Skip auto-rig during orchestration for speed
          generateClothing: false,  // Skip clothing for speed
          onProgress: (phase, detail) => {
            logger.log(`[Orchestrator:generate-characters] ${planChar.name}: ${phase} -- ${detail}`)
          },
        }),
      ),
    )

    // Process results
    for (let j = 0; j < results.length; j++) {
      const result = results[j]
      const planChar = batch[j]

      if (result.status === 'fulfilled') {
        // Update plan so setup-characters finds the generated character by name
        planChar.savedCharacterName = planChar.name
        ctx.savedCharacterIdMap.set(planChar.name, result.value.savedCharacterId)

        logger.log(`[Orchestrator:generate-characters] Successfully generated "${planChar.name}" (id=${result.value.savedCharacterId.slice(-6)})`)
        if (result.value.warnings.length > 0) {
          logger.warn(`[Orchestrator:generate-characters] Warnings for "${planChar.name}":`, result.value.warnings)
        }
      } else {
        logger.error(`[Orchestrator:generate-characters] Failed to generate "${planChar.name}":`, result.reason)
        // Non-fatal: setup-characters will still add the character without sprites
      }
    }
  }
}
