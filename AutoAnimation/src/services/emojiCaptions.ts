/**
 * Emoji Captions Service
 * Maps words to contextual emojis and emotion events to emoji decorations.
 */

import { WORD_EMOJI_MAP, EMOTION_EMOJI_MAP } from '@/data/emojiMap'

export type EmojiMode = 'none' | 'contextual' | 'emotion-only'

/**
 * Get emoji for a word based on the emoji mode.
 * Returns the emoji string or null if no match.
 */
export function getEmojiForWord(
  word: string,
  mode: EmojiMode,
  currentEmotion?: string,
): string | null {
  if (mode === 'none') return null

  // Clean word: remove punctuation, lowercase
  const clean = word.replace(/[^a-zA-Z]/g, '').toLowerCase()
  if (!clean) return null

  if (mode === 'emotion-only') {
    // Only return emoji if the current emotion maps to one
    if (currentEmotion) {
      return EMOTION_EMOJI_MAP[currentEmotion.toLowerCase()] ?? null
    }
    return null
  }

  // Contextual mode: check word map
  return WORD_EMOJI_MAP[clean] ?? null
}

/**
 * Get the emotion emoji for the current emotion state.
 */
export function getEmotionEmoji(emotion: string): string | null {
  if (!emotion) return null
  return EMOTION_EMOJI_MAP[emotion.toLowerCase()] ?? null
}

/**
 * Insert emoji into caption text based on mode.
 * Returns the text with emojis inserted after matching words.
 */
export function insertEmojisIntoText(
  text: string,
  mode: EmojiMode,
  currentEmotion?: string,
): string {
  if (mode === 'none') return text

  if (mode === 'emotion-only') {
    const emoji = currentEmotion ? getEmotionEmoji(currentEmotion) : null
    return emoji ? `${text} ${emoji}` : text
  }

  // Contextual mode: add emojis after matching words
  const words = text.split(/\s+/)
  let emojiCount = 0
  const maxEmojis = 2 // limit per caption to avoid clutter

  const result = words.map((word) => {
    if (emojiCount >= maxEmojis) return word
    const emoji = getEmojiForWord(word, mode)
    if (emoji) {
      emojiCount++
      return `${word} ${emoji}`
    }
    return word
  })

  return result.join(' ')
}
