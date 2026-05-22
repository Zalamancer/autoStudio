/**
 * Build DialogueCharacterData[] for multi-character dialogue export.
 */

import type { DialogueCharacterData } from '@/remotion/types'
import type { CompositionContext } from './compositionTypes'
import { buildEmotionTimeline } from '@/services/emotionTimeline'

export function buildDialogueCharacters(
  ctx: CompositionContext,
): DialogueCharacterData[] | undefined {
  const {
    dialogueCharacters,
    dialogueLines,
    savedCharacterMap,
    generatedVoiceMap,
    visemeMapping,
  } = ctx

  if (dialogueCharacters.length === 0) return undefined

  const defaultTransform = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, visible: true }
  const result: DialogueCharacterData[] = []

  for (const dChar of dialogueCharacters) {
    if (!dChar.visible || !dChar.savedCharacterId) continue

    const saved = savedCharacterMap.get(dChar.savedCharacterId)
    if (!saved) continue

    const bodyParts = saved.bodyParts || { viseme: [], eye: [], eyebrow: [], hair: [], body: [], head: [], shirt: [], pants: [], shoes: [] }
    const partTransforms = saved.partTransforms || {}
    const charPartTransforms = dChar.partTransforms

    const savedCharacterData = {
      savedImages: {
        viseme: bodyParts.viseme || [],
        eye: bodyParts.eye || [],
        eyebrow: bodyParts.eyebrow || [],
        hair: bodyParts.hair || [],
        body: bodyParts.body || [],
        head: bodyParts.head || [],
        shirt: bodyParts.shirt || [],
        pants: bodyParts.pants || [],
        shoes: bodyParts.shoes || [],
      },
      transforms: {
        group: {
          ...(partTransforms.group || defaultTransform),
          x: dChar.position.x,
          y: dChar.position.y,
        },
        eye: charPartTransforms?.eye || partTransforms['eye'] || defaultTransform,
        eyebrow: charPartTransforms?.eyebrow || partTransforms['eyebrow'] || defaultTransform,
        viseme: charPartTransforms?.viseme || partTransforms['viseme'] || defaultTransform,
        hair: charPartTransforms?.hair || partTransforms['hair'] || defaultTransform,
        body: charPartTransforms?.body || partTransforms['body'] || defaultTransform,
        head: charPartTransforms?.head || partTransforms['head'] || defaultTransform,
        shirt: charPartTransforms?.shirt || partTransforms['shirt'] || defaultTransform,
        pants: charPartTransforms?.pants || partTransforms['pants'] || defaultTransform,
        shoes: charPartTransforms?.shoes || partTransforms['shoes'] || defaultTransform,
      },
      selectedSprites: {
        viseme: saved.selectedSprites?.viseme ?? null,
        eye: dChar.defaultSpriteOverrides?.eye ?? saved.selectedSprites?.eye ?? null,
        eyebrow: dChar.defaultSpriteOverrides?.eyebrow ?? saved.selectedSprites?.eyebrow ?? null,
        hair: dChar.defaultSpriteOverrides?.hair ?? saved.selectedSprites?.hair ?? null,
        body: dChar.defaultSpriteOverrides?.body ?? saved.selectedSprites?.body ?? null,
        head: dChar.defaultSpriteOverrides?.head ?? saved.selectedSprites?.head ?? null,
        shirt: dChar.defaultSpriteOverrides?.shirt ?? saved.selectedSprites?.shirt ?? null,
        pants: dChar.defaultSpriteOverrides?.pants ?? saved.selectedSprites?.pants ?? null,
        shoes: dChar.defaultSpriteOverrides?.shoes ?? saved.selectedSprites?.shoes ?? null,
      },
      visemeMapping,
      useCurvedVisemes: true,
      curvedVisemes: saved.curvedVisemes || {},
      visemeSpriteMap: saved.visemeSpriteMap as Record<string, string | null> | undefined,
    }

    const charLines = dialogueLines
      .filter((l) => l.characterId === dChar.id)
      .sort((a, b) => a.order - b.order)
      .map((line) => {
        const voice = line.generatedVoiceId
          ? generatedVoiceMap.get(line.generatedVoiceId) ?? null
          : null

        const lineVisemeTimeline = line.visemeTimeline || []
        const lineEmotionTimeline =
          line.wordTimeline && line.wordTimeline.length > 0
            ? buildEmotionTimeline(line.script, line.wordTimeline)
            : []

        return {
          id: line.id,
          startFrame: line.startFrame,
          endFrame: line.endFrame,
          visemeTimeline: lineVisemeTimeline,
          emotionTimeline: lineEmotionTimeline,
          audioUrl: voice?.audioUrl || null,
        }
      })

    result.push({
      id: dChar.id,
      name: dChar.name,
      position: dChar.position,
      scale: dChar.scale,
      zIndex: dChar.zIndex,
      visible: dChar.visible,
      savedCharacter: savedCharacterData,
      dialogueLines: charLines,
      proceduralAnim: dChar.proceduralAnim,
    })
  }

  return result.length > 0 ? result : undefined
}
