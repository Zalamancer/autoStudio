/**
 * Resolves viseme sprite data and timeline for a 3D character's face mapping.
 * Handles three viseme sources: primary 2D character, saved 2D character, or custom.
 * Also resolves the dialogue-driven viseme/emotion timelines.
 */
import { useMemo } from 'react'
import type { Viseme, VisemeEvent } from '@/types/voice'
import type { EmotionEvent } from '@/services/emotionTimeline'
import type { VisemeFaceMapping } from '@/types/character3d'
import { useCharacterConfigStore } from '@/stores'
import { useVoiceStore } from '@/stores'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { buildEmotionTimeline } from '@/services/emotionTimeline'

interface VisemeFaceDataResult {
  spriteMap: Record<string, string | null> | null
  curvedVisemes: Record<string, string | null> | null
  getVisemeAtFrame: (frame: number) => Viseme
  getEmotionAtFrame: (frame: number) => string
}

function findVisemeAtFrame(timeline: VisemeEvent[], frame: number): Viseme {
  for (const event of timeline) {
    if (frame >= event.startFrame && frame < event.endFrame) {
      return event.viseme
    }
  }
  return 'Rest'
}

function findEmotionAtFrame(timeline: EmotionEvent[], frame: number): string {
  for (const event of timeline) {
    if (frame >= event.startFrame && frame < event.endFrame) {
      return event.emotion
    }
  }
  return 'Neutral'
}

export function useVisemeFaceData(
  mapping: VisemeFaceMapping | undefined
): VisemeFaceDataResult {
  // Primary character sprites
  const primarySpriteMap = useCharacterConfigStore((s) => s.visemeSpriteMap)
  const primaryCurvedVisemes = useCharacterConfigStore((s) => s.curvedVisemes)

  // Primary character timeline
  const primaryVisemeTimeline = useVoiceStore((s) => s.activeVisemeTimeline)
  const primaryEmotionTimeline = useVoiceStore((s) => s.activeEmotionTimeline)

  // Saved 2D characters
  const savedCharacters = useSavedCharactersStore((s) => s.characters)

  // Multi-character dialogue
  const dialogueCharacters = useMultiCharacterStore((s) => s.characters)
  const dialogueLines = useMultiCharacterStore((s) => s.dialogueLines)

  // Resolve sprite source
  const { spriteMap, curvedVisemes } = useMemo(() => {
    if (!mapping?.enabled) {
      return { spriteMap: null, curvedVisemes: null }
    }

    const source = mapping.visemeSource

    if (source.type === 'character-config') {
      return {
        spriteMap: primarySpriteMap as Record<string, string | null> | null,
        curvedVisemes: primaryCurvedVisemes as Record<string, string | null>,
      }
    }

    if (source.type === 'saved-2d-character') {
      const saved = savedCharacters.find((c) => c.id === source.characterId)
      if (saved) {
        return {
          spriteMap: (saved.visemeSpriteMap as Record<string, string | null>) ?? null,
          curvedVisemes: saved.curvedVisemes as Record<string, string | null>,
        }
      }
      return { spriteMap: null, curvedVisemes: null }
    }

    if (source.type === 'custom') {
      return {
        spriteMap: source.sprites as Record<string, string | null>,
        curvedVisemes: null,
      }
    }

    return { spriteMap: null, curvedVisemes: null }
  }, [mapping, primarySpriteMap, primaryCurvedVisemes, savedCharacters])

  // Resolve viseme + emotion timelines based on dialogue link
  const { visemeTimeline, emotionTimeline } = useMemo(() => {
    if (!mapping?.enabled) {
      return { visemeTimeline: [] as VisemeEvent[], emotionTimeline: [] as EmotionEvent[] }
    }

    // If linked to a dialogue character, combine that character's dialogue line timelines
    if (mapping.dialogueCharacterId) {
      const dChar = dialogueCharacters.find((c) => c.id === mapping.dialogueCharacterId)
      if (dChar) {
        const charLines = dialogueLines
          .filter((l) => l.characterId === dChar.id)
          .sort((a, b) => a.order - b.order)

        const combinedVisemes: VisemeEvent[] = []
        const combinedEmotions: EmotionEvent[] = []

        for (const line of charLines) {
          if (line.visemeTimeline) {
            combinedVisemes.push(...line.visemeTimeline)
          }
          if (line.wordTimeline && line.wordTimeline.length > 0) {
            const lineEmotions = buildEmotionTimeline(line.script, line.wordTimeline)
            combinedEmotions.push(...lineEmotions)
          }
        }

        return { visemeTimeline: combinedVisemes, emotionTimeline: combinedEmotions }
      }
    }

    // Fallback: use primary character's timeline
    return {
      visemeTimeline: primaryVisemeTimeline,
      emotionTimeline: primaryEmotionTimeline,
    }
  }, [
    mapping,
    dialogueCharacters,
    dialogueLines,
    primaryVisemeTimeline,
    primaryEmotionTimeline,
  ])

  // Stable callback wrappers
  const getVisemeAtFrame = useMemo(
    () => (frame: number) => findVisemeAtFrame(visemeTimeline, frame),
    [visemeTimeline]
  )

  const getEmotionAtFrame = useMemo(
    () => (frame: number) => findEmotionAtFrame(emotionTimeline, frame),
    [emotionTimeline]
  )

  return { spriteMap, curvedVisemes, getVisemeAtFrame, getEmotionAtFrame }
}
