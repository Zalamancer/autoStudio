/**
 * Build Character3DExportData[] for 3D character export.
 */

import type { Character3DExportData } from '@/remotion/types'
import type { VisemeEvent } from '@/types/voice'
import type { EmotionEvent } from '@/services/emotionTimeline'
import type { CompositionContext } from './compositionTypes'
import {
  DEFAULT_VISEME_FACE_MAPPING,
  DEFAULT_FACE_EXPRESSION_MAPPING,
  type VisemeFaceMapping,
  type FaceExpressionMapping,
} from '@/types/character3d'
import { useCharacterConfigStore } from '@/stores'
import { use3DRigStore } from '@/stores/use3DRigStore'
import { buildEmotionTimeline } from '@/services/emotionTimeline'

export function buildCharacters3D(
  ctx: CompositionContext,
): Character3DExportData[] | undefined {
  const {
    chars3D,
    saved3DCharacters,
    saved3DBlobUrls,
    anims3D,
    anim3DBlobUrls,
    savedCharacterMap,
    dialogueCharacters,
    dialogueLines,
    visemeTimeline,
    emotionTimeline,
  } = ctx

  const visible3D = chars3D.filter((c) => c.visible)
  if (visible3D.length === 0) return undefined

  const saved3DCharMap = new Map(saved3DCharacters.map((sc) => [sc.id, sc]))
  const anim3DMap = new Map(anims3D.map((a) => [a.id, a]))
  const result: Character3DExportData[] = []

  for (const char of visible3D) {
    if (!char.saved3DCharacterId) continue
    const saved = saved3DCharMap.get(char.saved3DCharacterId)
    if (!saved) continue

    const glbUrl = saved3DBlobUrls[saved.glbBlobId]
    if (!glbUrl) continue

    let activeAnimationGlbUrl: string | undefined
    if (char.activeAnimationId) {
      const anim = anim3DMap.get(char.activeAnimationId)
      if (anim) {
        activeAnimationGlbUrl = anim3DBlobUrls[anim.glbBlobId]
      }
    }

    // Resolve expression face mapping data for export (eye/eyebrow sprites)
    let exportEyeVariantSpriteMap: Record<string, string | null> | undefined
    let exportEyebrowVariantSpriteMap: Record<string, string | null> | undefined

    if (char.faceExpressionMapping?.enabled) {
      const exSrc = char.faceExpressionMapping.expressionSource

      if (exSrc.type === 'character-config') {
        const cfg = useCharacterConfigStore.getState()
        const eyeSprites = cfg.eyeVariantSprites as Record<string, string | null>
        const browSprites = cfg.eyebrowVariantSprites as Record<string, string | null>
        if (Object.values(eyeSprites).some((v) => v != null)) {
          exportEyeVariantSpriteMap = eyeSprites
        }
        if (Object.values(browSprites).some((v) => v != null)) {
          exportEyebrowVariantSpriteMap = browSprites
        }
      } else if (exSrc.type === 'saved-2d-character') {
        const saved2D = savedCharacterMap.get(exSrc.characterId)
        if (saved2D) {
          if (saved2D.eyeVariants) {
            exportEyeVariantSpriteMap = saved2D.eyeVariants as Record<string, string | null>
          }
          if (saved2D.eyebrowVariants) {
            exportEyebrowVariantSpriteMap = saved2D.eyebrowVariants as Record<string, string | null>
          }
        }
      } else if (exSrc.type === 'custom') {
        exportEyeVariantSpriteMap = exSrc.eyeSprites as Record<string, string | null>
        exportEyebrowVariantSpriteMap = exSrc.eyebrowSprites as Record<string, string | null>
      }
    }

    // Resolve viseme face mapping data for export
    let exportVisemeSpriteMap: Record<string, string | null> | undefined
    let exportVisemeTimeline: VisemeEvent[] | undefined
    let exportEmotionTimeline: EmotionEvent[] | undefined

    if (char.visemeFaceMapping?.enabled) {
      const vfm = char.visemeFaceMapping
      const src = vfm.visemeSource

      if (src.type === 'character-config') {
        const cfg = useCharacterConfigStore.getState()
        exportVisemeSpriteMap = (cfg.visemeSpriteMap as Record<string, string | null>) ?? undefined
        if (!exportVisemeSpriteMap) {
          exportVisemeSpriteMap = cfg.curvedVisemes as Record<string, string | null>
        }
      } else if (src.type === 'saved-2d-character') {
        const saved2D = savedCharacterMap.get(src.characterId)
        if (saved2D) {
          exportVisemeSpriteMap = (saved2D.visemeSpriteMap as Record<string, string | null>) ?? (saved2D.curvedVisemes as Record<string, string | null>)
        }
      } else if (src.type === 'custom') {
        exportVisemeSpriteMap = src.sprites as Record<string, string | null>
      }

      // Resolve timeline
      if (vfm.dialogueCharacterId) {
        const dChar = dialogueCharacters.find((c) => c.id === vfm.dialogueCharacterId)
        if (dChar) {
          const charLines = dialogueLines
            .filter((l) => l.characterId === dChar.id)
            .sort((a, b) => a.order - b.order)
          const combinedV: VisemeEvent[] = []
          const combinedE: EmotionEvent[] = []
          for (const line of charLines) {
            if (line.visemeTimeline) combinedV.push(...line.visemeTimeline)
            if (line.wordTimeline?.length) {
              combinedE.push(...buildEmotionTimeline(line.script, line.wordTimeline))
            }
          }
          exportVisemeTimeline = combinedV
          exportEmotionTimeline = combinedE
        }
      } else {
        exportVisemeTimeline = visemeTimeline
        exportEmotionTimeline = emotionTimeline
      }
    }

    // If expression mapping is enabled but viseme mapping didn't resolve emotion timeline,
    // resolve it now so expression overlays have emotion data in export
    if (char.faceExpressionMapping?.enabled && !exportEmotionTimeline) {
      const exDialogueCharId = char.faceExpressionMapping.dialogueCharacterId
      if (exDialogueCharId) {
        const dChar = dialogueCharacters.find((c) => c.id === exDialogueCharId)
        if (dChar) {
          const charLines = dialogueLines
            .filter((l) => l.characterId === dChar.id)
            .sort((a, b) => a.order - b.order)
          const combinedE: EmotionEvent[] = []
          for (const line of charLines) {
            if (line.wordTimeline?.length) {
              combinedE.push(...buildEmotionTimeline(line.script, line.wordTimeline))
            }
          }
          exportEmotionTimeline = combinedE
        }
      } else {
        exportEmotionTimeline = emotionTimeline
      }
    }

    // Look up 3D rig data for spring bones / squash-stretch
    const rigStore3D = use3DRigStore.getState()
    const charRig = Object.values(rigStore3D.rigs).find(
      (r) => r.characterId === char.saved3DCharacterId
    )
    const springChains = charRig?.springChains?.length
      ? charRig.springChains.map((c) => ({
          rootBoneName: c.rootBoneName,
          boneNames: c.boneNames,
          stiffness: c.stiffness,
          damping: c.damping,
          gravity: c.gravity,
        }))
      : undefined
    const squashStretchBones = charRig?.squashStretchBones?.length
      ? charRig.squashStretchBones.filter((b) => b.enabled).map((b) => b.boneName)
      : undefined

    result.push({
      id: char.id,
      name: char.name,
      glbUrl,
      position: char.position,
      rotation: char.rotation,
      scale: char.scale,
      visible: char.visible,
      activeAnimationGlbUrl,
      animationStartFrame: 0,
      animationSpeed: char.animationSpeed,
      boneMapping: saved.boneMapping as Record<string, string> | undefined,
      visemeFaceMapping: char.visemeFaceMapping
        ? { ...DEFAULT_VISEME_FACE_MAPPING, ...char.visemeFaceMapping } as VisemeFaceMapping
        : undefined,
      visemeSpriteMap: exportVisemeSpriteMap,
      visemeTimeline: exportVisemeTimeline,
      emotionTimeline: exportEmotionTimeline,
      faceExpressionMapping: char.faceExpressionMapping
        ? { ...DEFAULT_FACE_EXPRESSION_MAPPING, ...char.faceExpressionMapping } as FaceExpressionMapping
        : undefined,
      eyeVariantSpriteMap: exportEyeVariantSpriteMap,
      eyebrowVariantSpriteMap: exportEyebrowVariantSpriteMap,
      springChains,
      squashStretchBones,
    })
  }

  return result.length > 0 ? result : undefined
}
