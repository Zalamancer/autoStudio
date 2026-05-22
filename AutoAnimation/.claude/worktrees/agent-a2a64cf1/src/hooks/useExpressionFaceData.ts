/**
 * Resolves eye/eyebrow sprite data and emotion timeline for a 3D character's
 * face expression mapping. Mirrors useVisemeFaceData pattern with three sprite
 * sources: primary 2D character, saved 2D character, or custom.
 */
import { useMemo } from 'react'
import type { EmotionEvent } from '@/services/emotionTimeline'
import type { FaceExpressionMapping } from '@/types/character3d'
import { useCharacterConfigStore } from '@/stores'
import { useVoiceStore } from '@/stores'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { buildEmotionTimeline } from '@/services/emotionTimeline'

export interface ExpressionFaceDataResult {
  eyeSprites: Record<string, string | null> | null
  eyebrowSprites: Record<string, string | null> | null
  getEmotionAtFrame: (frame: number) => string
}

function findEmotionAtFrame(timeline: EmotionEvent[], frame: number): string {
  for (const event of timeline) {
    if (frame >= event.startFrame && frame < event.endFrame) {
      return event.emotion
    }
  }
  return 'Neutral'
}

export function useExpressionFaceData(
  mapping: FaceExpressionMapping | undefined
): ExpressionFaceDataResult {
  // Primary character eye/eyebrow sprites
  const primaryEyeSprites = useCharacterConfigStore((s) => s.eyeVariantSprites)
  const primaryEyebrowSprites = useCharacterConfigStore((s) => s.eyebrowVariantSprites)

  // Primary character emotion timeline
  const primaryEmotionTimeline = useVoiceStore((s) => s.activeEmotionTimeline)

  // Saved 2D characters
  const savedCharacters = useSavedCharactersStore((s) => s.characters)

  // Multi-character dialogue
  const dialogueCharacters = useMultiCharacterStore((s) => s.characters)
  const dialogueLines = useMultiCharacterStore((s) => s.dialogueLines)

  // Resolve sprite source
  const { eyeSprites, eyebrowSprites } = useMemo(() => {
    if (!mapping?.enabled) {
      return { eyeSprites: null, eyebrowSprites: null }
    }

    const source = mapping.expressionSource

    if (source.type === 'character-config') {
      return {
        eyeSprites: primaryEyeSprites as Record<string, string | null> | null,
        eyebrowSprites: primaryEyebrowSprites as Record<string, string | null> | null,
      }
    }

    if (source.type === 'saved-2d-character') {
      const saved = savedCharacters.find((c) => c.id === source.characterId)
      if (saved) {
        return {
          eyeSprites: (saved.eyeVariants as Record<string, string | null>) ?? null,
          eyebrowSprites: (saved.eyebrowVariants as Record<string, string | null>) ?? null,
        }
      }
      return { eyeSprites: null, eyebrowSprites: null }
    }

    if (source.type === 'custom') {
      return {
        eyeSprites: source.eyeSprites as Record<string, string | null>,
        eyebrowSprites: source.eyebrowSprites as Record<string, string | null>,
      }
    }

    return { eyeSprites: null, eyebrowSprites: null }
  }, [mapping, primaryEyeSprites, primaryEyebrowSprites, savedCharacters])

  // Resolve emotion timeline based on dialogue link
  const emotionTimeline = useMemo(() => {
    if (!mapping?.enabled) {
      return [] as EmotionEvent[]
    }

    // If linked to a dialogue character, combine that character's dialogue line timelines
    if (mapping.dialogueCharacterId) {
      const dChar = dialogueCharacters.find((c) => c.id === mapping.dialogueCharacterId)
      if (dChar) {
        const charLines = dialogueLines
          .filter((l) => l.characterId === dChar.id)
          .sort((a, b) => a.order - b.order)

        const combinedEmotions: EmotionEvent[] = []
        for (const line of charLines) {
          if (line.wordTimeline && line.wordTimeline.length > 0) {
            const lineEmotions = buildEmotionTimeline(line.script, line.wordTimeline)
            combinedEmotions.push(...lineEmotions)
          }
        }
        return combinedEmotions
      }
    }

    // Fallback: use primary character's emotion timeline
    return primaryEmotionTimeline
  }, [
    mapping,
    dialogueCharacters,
    dialogueLines,
    primaryEmotionTimeline,
  ])

  // Stable callback wrapper
  const getEmotionAtFrame = useMemo(
    () => (frame: number) => findEmotionAtFrame(emotionTimeline, frame),
    [emotionTimeline]
  )

  return { eyeSprites, eyebrowSprites, getEmotionAtFrame }
}
