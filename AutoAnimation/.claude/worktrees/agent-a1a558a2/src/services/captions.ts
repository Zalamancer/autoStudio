import type { ElevenLabsAlignment, WordEvent, CaptionStyle } from '@/types/voice'
import type { WhisperWord } from '@/services/whisperTranscript'

export interface SentenceEvent {
  sentence: string
  words: WordEvent[]
  startFrame: number
  endFrame: number
  startTime: number
  endTime: number
}

export class CaptionProcessor {
  private fps: number

  constructor(fps: number = 30) {
    this.fps = fps
  }

  /**
   * Extract word timings from character alignment data
   */
  extractWords(text: string, alignment: ElevenLabsAlignment): WordEvent[] {
    const words: WordEvent[] = []
    const textWords = text.split(/\s+/).filter((w) => w.length > 0)

    // Safety checks for undefined alignment data
    const characters = alignment?.characters || []
    const charStartTimes = alignment?.character_start_times_seconds || []
    const charEndTimes = alignment?.character_end_times_seconds || []

    if (characters.length === 0) return words

    let charIndex = 0

    for (const word of textWords) {
      // Skip leading whitespace in alignment
      while (
        charIndex < characters.length &&
        characters[charIndex]?.match(/\s/)
      ) {
        charIndex++
      }

      if (charIndex >= characters.length) break

      const wordStartIndex = charIndex
      // Count ALL non-whitespace characters in the word (including punctuation)
      // The alignment characters array includes punctuation, so we must consume
      // them to stay in sync. Previously only \w chars were counted, causing
      // punctuation to be "orphaned" and shift all subsequent word timings.
      const wordLength = word.length

      // Find where this word ends in the alignment
      let alignedChars = 0
      while (charIndex < characters.length && alignedChars < wordLength) {
        const char = characters[charIndex]
        if (char && !char.match(/\s/)) {
          alignedChars++
        }
        charIndex++
      }

      const wordEndIndex = charIndex - 1

      if (wordStartIndex < charStartTimes.length) {
        const startTime = charStartTimes[wordStartIndex] || 0
        const endTime =
          charEndTimes[Math.min(wordEndIndex, charEndTimes.length - 1)] || 0

        words.push({
          word: word.replace(/[.,!?;:"'()[\]{}]/g, ''), // Clean punctuation for display
          startTime,
          endTime,
          startFrame: Math.floor(startTime * this.fps),
          endFrame: Math.ceil(endTime * this.fps),
        })
      }
    }

    return words
  }

  /**
   * Group words into sentences for sentence-style captions
   */
  groupIntoSentences(text: string, words: WordEvent[]): SentenceEvent[] {
    const sentences: SentenceEvent[] = []
    const sentenceTexts = text.match(/[^.!?]+[.!?]+/g) || [text]

    let wordIndex = 0

    for (const sentenceText of sentenceTexts) {
      const sentenceWords = sentenceText.trim().split(/\s+/).filter((w) => w.length > 0)
      const sentenceWordEvents: WordEvent[] = []

      for (let i = 0; i < sentenceWords.length && wordIndex < words.length; i++) {
        sentenceWordEvents.push(words[wordIndex])
        wordIndex++
      }

      if (sentenceWordEvents.length > 0) {
        sentences.push({
          sentence: sentenceText.trim(),
          words: sentenceWordEvents,
          startTime: sentenceWordEvents[0].startTime,
          endTime: sentenceWordEvents[sentenceWordEvents.length - 1].endTime,
          startFrame: sentenceWordEvents[0].startFrame,
          endFrame: sentenceWordEvents[sentenceWordEvents.length - 1].endFrame,
        })
      }
    }

    return sentences
  }

  /**
   * Group words into chunks of N words for chunked display
   */
  groupIntoChunks(words: WordEvent[], chunkSize: number = 4): SentenceEvent[] {
    const chunks: SentenceEvent[] = []

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunkWords = words.slice(i, i + chunkSize)
      const sentence = chunkWords.map((w) => w.word).join(' ')

      chunks.push({
        sentence,
        words: chunkWords,
        startTime: chunkWords[0].startTime,
        endTime: chunkWords[chunkWords.length - 1].endTime,
        startFrame: chunkWords[0].startFrame,
        endFrame: chunkWords[chunkWords.length - 1].endFrame,
      })
    }

    return chunks
  }

  /**
   * Get current word at a specific frame (for word-by-word style)
   */
  getWordAtFrame(words: WordEvent[], frame: number): WordEvent | null {
    return words.find((w) => frame >= w.startFrame && frame < w.endFrame) || null
  }

  /**
   * Get current sentence at a specific frame (for sentence style)
   */
  getSentenceAtFrame(sentences: SentenceEvent[], frame: number): SentenceEvent | null {
    return sentences.find((s) => frame >= s.startFrame && frame < s.endFrame) || null
  }

  /**
   * Get caption content based on style
   */
  getCaptionAtFrame(
    frame: number,
    words: WordEvent[],
    sentences: SentenceEvent[],
    style: CaptionStyle
  ): { text: string; highlightIndex?: number } | null {
    switch (style) {
      case 'word-by-word': {
        const word = this.getWordAtFrame(words, frame)
        return word ? { text: word.word } : null
      }

      case 'sentence': {
        const sentence = this.getSentenceAtFrame(sentences, frame)
        return sentence ? { text: sentence.sentence } : null
      }

      case 'karaoke': {
        const sentence = this.getSentenceAtFrame(sentences, frame)
        if (!sentence) return null

        // Find which word in the sentence is currently active
        const activeWordIndex = sentence.words.findIndex(
          (w) => frame >= w.startFrame && frame < w.endFrame
        )

        return {
          text: sentence.sentence,
          highlightIndex: activeWordIndex >= 0 ? activeWordIndex : undefined,
        }
      }

      default:
        return null
    }
  }

  /**
   * Convert WhisperWord[] from transcription directly to timeline format.
   * This bypasses the ElevenLabs alignment path and provides captions from transcription.
   */
  static fromTranscript(
    words: WhisperWord[],
    fps: number,
  ): { wordTimeline: WordEvent[]; sentenceTimeline: SentenceEvent[] } {
    const processor = new CaptionProcessor(fps)

    const wordTimeline: WordEvent[] = words.map((w) => ({
      word: w.word.replace(/[.,!?;:"'()[\]{}]/g, ''),
      startTime: w.start,
      endTime: w.end,
      startFrame: Math.floor(w.start * fps),
      endFrame: Math.ceil(w.end * fps),
    }))

    // Build full text from words for sentence grouping
    const fullText = words.map((w) => w.word).join(' ')
    const sentenceTimeline = processor.groupIntoSentences(fullText, wordTimeline)

    return { wordTimeline, sentenceTimeline }
  }

  /**
   * Set FPS for frame calculations
   */
  setFps(fps: number): void {
    this.fps = fps
  }
}

// Default singleton instance
let processorInstance: CaptionProcessor | null = null

export function getCaptionProcessor(fps: number = 30): CaptionProcessor {
  if (!processorInstance || processorInstance['fps'] !== fps) {
    processorInstance = new CaptionProcessor(fps)
  }
  return processorInstance
}
