import type { CharacterSwapConfig } from '@/types/faceSwap'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useKeyframeStore } from '@/stores/useKeyframeStore'

export async function swapCharacter(config: CharacterSwapConfig): Promise<void> {
  const multiStore = useMultiCharacterStore.getState()
  const keyframeStore = useKeyframeStore.getState()

  const characters = multiStore.characters ?? []
  const sourceChar = characters.find((c) => c.id === config.sourceCharacterId)
  const targetChar = characters.find((c) => c.id === config.targetCharacterId)

  if (!sourceChar || !targetChar) {
    throw new Error('Source or target character not found')
  }

  if (config.blendMode === 'replace') {
    // Full replacement: copy source character config to target slot
    multiStore.updateDialogueCharacter(config.targetCharacterId, {
      ...sourceChar,
      id: config.targetCharacterId,
      name: targetChar.name, // keep target name
    })
  } else if (config.blendMode === 'blend') {
    // Blend: take saved character reference from source but keep target positioning
    multiStore.updateDialogueCharacter(config.targetCharacterId, {
      savedCharacterId: sourceChar.savedCharacterId,
    })
  } else if (config.blendMode === 'morph') {
    // Morph: keep both and set up transition
    multiStore.updateDialogueCharacter(config.targetCharacterId, {
      savedCharacterId: sourceChar.savedCharacterId,
    })
  }

  // Preserve motion keyframes if requested
  if (config.preserveMotion) {
    const sourceTracks = keyframeStore.tracks.filter(
      (t) => t.objectRef.objectId === config.sourceCharacterId,
    )
    for (const track of sourceTracks) {
      for (const kf of track.keyframes) {
        keyframeStore.setKeyframe(
          { objectType: track.objectRef.objectType, objectId: config.targetCharacterId },
          track.property,
          kf.frame,
          kf.value,
        )
      }
    }
  }
}
