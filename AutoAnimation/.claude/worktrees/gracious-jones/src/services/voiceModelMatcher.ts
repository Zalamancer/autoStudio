import type { VoiceModelProfile } from '@/types/audioExpanded'
import { VOICE_MODEL_PROFILES } from '@/data/voiceModelProfiles'

interface CharacterDescription {
  gender?: 'male' | 'female' | 'neutral'
  age?: 'young' | 'adult' | 'senior'
  accent?: string
  style?: string
  language?: string
  tags?: string[]
}

/**
 * Score how well a voice matches a character description.
 */
export function scoreVoiceMatch(character: CharacterDescription, voice: VoiceModelProfile): number {
  let score = 0

  if (character.gender && voice.gender === character.gender) score += 30
  if (character.gender && voice.gender === 'neutral') score += 10

  if (character.age && voice.age === character.age) score += 20

  if (character.accent) {
    const charAccent = character.accent.toLowerCase()
    if (voice.accent.toLowerCase() === charAccent) score += 15
    if (voice.accent.toLowerCase().includes(charAccent) || charAccent.includes(voice.accent.toLowerCase())) score += 8
  }

  if (character.style && voice.style === character.style) score += 15

  if (character.language && voice.language === character.language) score += 10

  if (character.tags) {
    const matchingTags = character.tags.filter(t => voice.tags.includes(t.toLowerCase()))
    score += matchingTags.length * 5
  }

  return score
}

/**
 * Find the best matching voices for a character description.
 */
export function matchVoiceToCharacter(
  characterDesc: CharacterDescription,
  availableVoices?: VoiceModelProfile[],
): VoiceModelProfile[] {
  const voices = availableVoices ?? VOICE_MODEL_PROFILES
  const scored = voices.map(voice => ({
    voice,
    score: scoreVoiceMatch(characterDesc, voice),
  }))

  scored.sort((a, b) => b.score - a.score)
  return scored.map(s => s.voice)
}
