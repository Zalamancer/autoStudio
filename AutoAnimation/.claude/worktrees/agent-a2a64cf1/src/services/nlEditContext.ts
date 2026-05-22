/**
 * NL Edit Context — Builds a structured summary of current project state
 * for injecting into Gemini prompts during NL timeline editing.
 */

import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { buildTranscript } from '@/services/transcriptSync'

export interface EditingContext {
  duration: number
  fps: number
  totalFrames: number
  currentFrame: number
  characters: Array<{ name: string; lineCount: number }>
  textOverlays: Array<{ id: string; content: string; type: string }>
  mediaItems: Array<{ id: string; name: string; startFrame: number; endFrame: number }>
  transcript?: Array<{ word: string; startFrame: number; endFrame: number }>
}

/**
 * Build the current editing context for NL command parsing.
 */
export function buildEditingContext(): EditingContext {
  const timeline = useTimelineStore.getState()
  const multiChar = useMultiCharacterStore.getState()
  const textOverlays = useTextOverlayStore.getState().overlays
  const mediaItems = useMediaStore.getState().canvasItems

  const fps = timeline.fps || 30
  const totalFrames = timeline.totalFrames
  const currentFrame = timeline.currentFrame

  // Build character summary
  const characters = multiChar.characters.map((c) => ({
    name: c.name,
    lineCount: multiChar.dialogueLines.filter((l) => l.characterId === c.id).length,
  }))

  // Build text overlay summary
  const overlaysSummary = textOverlays.map((o) => ({
    id: o.id,
    content: o.content,
    type: o.presetType,
  }))

  // Build media summary
  const mediaSummary = mediaItems.map((m) => ({
    id: m.id,
    name: m.assetId || m.id,
    startFrame: m.startFrame ?? 0,
    endFrame: m.endFrame ?? totalFrames,
  }))

  // Build transcript words if available
  let transcript: EditingContext['transcript'] = undefined
  try {
    const lines = buildTranscript()
    if (lines.length > 0) {
      transcript = []
      for (const line of lines) {
        const words = line.text.split(/\s+/).filter(Boolean)
        const frameDuration = line.endFrame - line.startFrame
        const framesPerWord = words.length > 0 ? frameDuration / words.length : 0
        for (let i = 0; i < words.length; i++) {
          transcript.push({
            word: words[i],
            startFrame: Math.round(line.startFrame + i * framesPerWord),
            endFrame: Math.round(line.startFrame + (i + 1) * framesPerWord),
          })
        }
      }
    }
  } catch {
    // No transcript available
  }

  return {
    duration: totalFrames / fps,
    fps,
    totalFrames,
    currentFrame,
    characters,
    textOverlays: overlaysSummary,
    mediaItems: mediaSummary,
    transcript,
  }
}
