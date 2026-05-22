import type { ContentScore } from '@/types/faceSwap'

interface ProjectState {
  tracks?: Array<{ clips?: Array<{ startFrame: number; endFrame: number }> }>
  textOverlays?: Array<{ text: string; startFrame: number }>
  voiceGenerated?: boolean
  musicEnabled?: boolean
  captionsEnabled?: boolean
  totalDuration?: number
  fps?: number
  characters?: Array<{ id: string }>
  aspectRatio?: string
}

function scoreComposition(state: ProjectState): number {
  let score = 50 // Base

  // Has characters
  if (state.characters && state.characters.length > 0) score += 10

  // Has text overlays
  if (state.textOverlays && state.textOverlays.length > 0) score += 10

  // Has multiple tracks (visual variety)
  if (state.tracks && state.tracks.length > 2) score += 10
  else if (state.tracks && state.tracks.length > 0) score += 5

  // Proper aspect ratio for shorts
  if (state.aspectRatio === '9:16') score += 10

  // Reasonable duration
  const duration = state.totalDuration ?? 0
  if (duration >= 15 && duration <= 60) score += 10
  else if (duration > 0) score += 5

  return Math.min(100, score)
}

function scorePacing(state: ProjectState): number {
  let score = 50

  const fps = state.fps ?? 30
  const totalFrames = (state.totalDuration ?? 0) * fps
  if (totalFrames === 0) return 30

  // Count scene changes (track clips)
  const allClips = (state.tracks ?? []).flatMap((t) => t.clips ?? [])
  const sceneChanges = allClips.length

  // Good pacing: 1 change every 3-5 seconds
  const idealChanges = totalFrames / (fps * 4)
  const pacingRatio = sceneChanges / Math.max(1, idealChanges)

  if (pacingRatio > 0.5 && pacingRatio < 2) score += 30
  else if (pacingRatio > 0.25 && pacingRatio < 3) score += 15

  // Has opening hook (content in first 3 seconds)
  const earlyContent = allClips.filter((c) => c.startFrame < fps * 3)
  if (earlyContent.length > 0) score += 20

  return Math.min(100, score)
}

function scoreAudioQuality(state: ProjectState): number {
  let score = 30

  if (state.voiceGenerated) score += 30
  if (state.musicEnabled) score += 20
  if (state.captionsEnabled) score += 20

  return Math.min(100, score)
}

function scoreVisualAppeal(state: ProjectState): number {
  let score = 40

  // Has characters (visual interest)
  if (state.characters && state.characters.length > 0) score += 20

  // Has text overlays (context)
  if (state.textOverlays && state.textOverlays.length > 0) score += 15

  // Multiple visual layers
  const trackCount = state.tracks?.length ?? 0
  if (trackCount >= 3) score += 25
  else if (trackCount >= 1) score += 10

  return Math.min(100, score)
}

function scoreHookStrength(state: ProjectState): number {
  let score = 30
  const fps = state.fps ?? 30

  // Check first 3 seconds for content
  const allClips = (state.tracks ?? []).flatMap((t) => t.clips ?? [])
  const firstThreeSeconds = allClips.filter((c) => c.startFrame < fps * 3)
  if (firstThreeSeconds.length > 0) score += 20

  // Text overlay in first 2 seconds
  const earlyText = (state.textOverlays ?? []).filter((t) => t.startFrame < fps * 2)
  if (earlyText.length > 0) score += 25

  // Voice starts early
  if (state.voiceGenerated) score += 25

  return Math.min(100, score)
}

function predictRetention(composition: number, pacing: number, hook: number, audio: number): number {
  // Weighted formula based on engagement research
  return Math.round(
    hook * 0.35 +
    pacing * 0.25 +
    composition * 0.2 +
    audio * 0.2
  )
}

function generateSuggestions(scores: {
  composition: number
  pacing: number
  audioQuality: number
  visualAppeal: number
  hookStrength: number
}): string[] {
  const suggestions: string[] = []

  if (scores.hookStrength < 60) {
    suggestions.push('Add a text overlay or visual hook in the first 2 seconds')
  }
  if (scores.pacing < 50) {
    suggestions.push('Add more scene transitions to improve pacing')
  }
  if (scores.audioQuality < 50) {
    suggestions.push('Add voiceover or background music to increase engagement')
  }
  if (scores.composition < 50) {
    suggestions.push('Consider using 9:16 aspect ratio for short-form platforms')
  }
  if (scores.visualAppeal < 50) {
    suggestions.push('Add more visual layers like text, characters, or B-roll')
  }
  if (scores.audioQuality < 70 && scores.audioQuality >= 50) {
    suggestions.push('Enable captions for accessibility and silent autoplay')
  }
  if (scores.pacing > 80 && scores.hookStrength < 70) {
    suggestions.push('Good pacing! Strengthen your opening hook for better retention')
  }

  return suggestions.slice(0, 5)
}

export function scoreContent(state: ProjectState): ContentScore {
  const composition = scoreComposition(state)
  const pacing = scorePacing(state)
  const audioQuality = scoreAudioQuality(state)
  const visualAppeal = scoreVisualAppeal(state)
  const hookStrength = scoreHookStrength(state)
  const retentionPrediction = predictRetention(composition, pacing, hookStrength, audioQuality)
  const suggestions = generateSuggestions({ composition, pacing, audioQuality, visualAppeal, hookStrength })

  const overall = Math.round(
    (composition + pacing + audioQuality + visualAppeal + hookStrength) / 5
  )

  return {
    overall,
    composition,
    pacing,
    audioQuality,
    visualAppeal,
    hookStrength,
    retentionPrediction,
    suggestions,
  }
}
